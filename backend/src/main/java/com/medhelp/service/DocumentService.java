package com.medhelp.service;

import com.medhelp.domain.entity.MedicalDocument;
import com.medhelp.domain.entity.MedicalRecord;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.Role;
import com.medhelp.dto.RecordDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.mapper.RecordMapper;
import com.medhelp.repository.MedicalDocumentRepository;
import com.medhelp.repository.MedicalRecordRepository;
import com.medhelp.repository.UserRepository;
import com.medhelp.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Stores and serves medical documents.
 *
 * <p>The bytes go through {@link StorageService}; PostgreSQL only keeps the
 * storage path. Downloads always resolve authorization first, which is what
 * keeps medical files off public URLs.
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    /** Only document formats the platform accepts. */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/jpg", "image/png");
    private static final long MAX_BYTES = 15L * 1024 * 1024;

    private final MedicalDocumentRepository documentRepository;
    private final MedicalRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final AccessGrantService accessGrantService;
    private final AuditService auditService;
    private final RecordMapper recordMapper;

    public DocumentService(MedicalDocumentRepository documentRepository,
                           MedicalRecordRepository recordRepository,
                           UserRepository userRepository,
                           StorageService storageService,
                           AccessGrantService accessGrantService,
                           AuditService auditService,
                           RecordMapper recordMapper) {
        this.documentRepository = documentRepository;
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.accessGrantService = accessGrantService;
        this.auditService = auditService;
        this.recordMapper = recordMapper;
    }

    /**
     * Uploads a file against a record.
     *
     * <p>A patient may upload to their own record. A doctor may upload only
     * while holding a grant covering that record's category — for example
     * attaching a scanned report to a consultation they are allowed to work in.
     */
    @Transactional
    public RecordDtos.DocumentDto upload(Long actorId, Long recordId, MultipartFile file) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> ApiException.notFound("Record not found"));

        if (actor.getRole() == Role.PATIENT) {
            if (!record.getPatient().getId().equals(actor.getId())) {
                throw ApiException.forbidden("This record does not belong to you");
            }
        } else {
            accessGrantService.requireCategoryAccess(actorId, record.getPatient().getId(), record.category());
        }

        validate(file);

        String originalName = sanitiseFileName(file.getOriginalFilename());
        String extension = extensionOf(originalName);
        String storagePath = "patients/%d/records/%d/%s.%s"
                .formatted(record.getPatient().getId(), record.getId(), UUID.randomUUID(), extension);

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the uploaded file");
        }

        storageService.store(storagePath, content, file.getContentType());

        MedicalDocument document = new MedicalDocument();
        document.setRecord(record);
        document.setPatient(record.getPatient());
        document.setUploadedBy(actor);
        document.setOriginalName(originalName);
        document.setStoragePath(storagePath);
        document.setStorageProvider(storageService.providerName());
        document.setContentType(file.getContentType());
        document.setSizeBytes((long) content.length);
        documentRepository.save(document);

        auditService.record(AuditAction.DOCUMENT_UPLOADED, actor, record.getPatient().getId(),
                actor.getFullName() + " uploaded " + originalName, record, null, document.getId());

        return recordMapper.toDocumentDto(document);
    }

    @Transactional(readOnly = true)
    public List<RecordDtos.DocumentDto> listForRecord(Long actorId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> ApiException.notFound("Record not found"));
        authorizeRead(actorId, record);
        return documentRepository.findByRecordIdOrderByUploadedAtAsc(recordId)
                .stream().map(recordMapper::toDocumentDto).toList();
    }

    /**
     * Loads a document for download after authorizing the caller.
     *
     * <p>Returns the bytes and metadata; the controller streams them with
     * {@code Content-Disposition: attachment} and {@code Cache-Control: no-store}
     * so the file is never cached publicly.
     */
    @Transactional(readOnly = true)
    public DocumentPayload download(Long actorId, Long documentId, boolean inline) {
        MedicalDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("Document not found"));
        MedicalRecord record = document.getRecord();

        User actor = authorizeRead(actorId, record);

        byte[] content = storageService.read(document.getStoragePath());

        auditService.record(inline ? AuditAction.DOCUMENT_VIEWED : AuditAction.DOCUMENT_DOWNLOADED,
                actor, document.getPatient().getId(),
                actor.getFullName() + (inline ? " viewed " : " downloaded ") + document.getOriginalName(),
                record, null, document.getId());

        return new DocumentPayload(document.getOriginalName(), document.getContentType(), content);
    }

    @Transactional
    public void delete(Long actorId, Long documentId) {
        MedicalDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("Document not found"));

        // Only the owning patient may delete a stored file.
        if (!document.getPatient().getId().equals(actorId)) {
            throw ApiException.forbidden("Only the patient who owns this record can delete its documents");
        }

        storageService.delete(document.getStoragePath());
        documentRepository.delete(document);

        auditService.record(AuditAction.RECORD_DELETED, document.getPatient(), document.getPatient().getId(),
                "Deleted document " + document.getOriginalName(), document.getRecord(), null, document.getId());
    }

    /** Shared authorization for any document read path. */
    private User authorizeRead(Long actorId, MedicalRecord record) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (actor.getRole() == Role.PATIENT) {
            if (!record.getPatient().getId().equals(actor.getId())) {
                throw ApiException.forbidden("This record does not belong to you");
            }
        } else {
            // A doctor needs a live grant covering this record's category.
            accessGrantService.requireCategoryAccess(actorId, record.getPatient().getId(), record.category());
        }
        return actor;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Please choose a file to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Files must be 15 MB or smaller");
        }
        String name = sanitiseFileName(file.getOriginalFilename());
        String extension = extensionOf(name);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw ApiException.badRequest("Only PDF, JPG, JPEG and PNG files are supported");
        }
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw ApiException.badRequest("Unsupported file type: " + contentType);
        }
    }

    /** Strips directory components so a crafted filename cannot escape the storage root. */
    private String sanitiseFileName(String original) {
        if (original == null || original.isBlank()) {
            return "document";
        }
        String name = original.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[^A-Za-z0-9._ -]", "_").trim();
        return name.isBlank() ? "document" : name.substring(0, Math.min(name.length(), 200));
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /** Bytes plus metadata handed to the controller for streaming. */
    public record DocumentPayload(String fileName, String contentType, byte[] content) {
    }
}