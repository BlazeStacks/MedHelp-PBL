package com.medhelp.service;

import com.medhelp.domain.entity.AuditLog;
import com.medhelp.domain.entity.MedicalRecord;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.AuditAction;
import com.medhelp.dto.ActivityDtos;
import com.medhelp.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Writes and reads the audit trail.
 *
 * <p>Audit writes run in their own transaction ({@code REQUIRES_NEW}). Two
 * things depend on that:
 * <ul>
 *   <li>Several read paths (for example a doctor listing permitted records) are
 *       {@code readOnly}, and PostgreSQL aborts the transaction on a failed
 *       INSERT. Without an independent transaction one rejected audit row would
 *       poison the caller's transaction and fail the whole request.</li>
 *   <li>A blocked-access attempt must still be recorded when the request itself
 *       is going to be rejected with 403.</li>
 * </ul>
 *
 * <p>Auditing is otherwise best-effort: a failure to write an audit row is
 * logged and never breaks the user's actual operation. Rows are append-only.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * {@code REQUIRES_NEW} suspends the caller's transaction so a readOnly
     * caller can still audit without aborting its own transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, User actor, Long patientId, String description) {
        record(action, actor, patientId, description, null, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, User actor, Long patientId, String description,
                       MedicalRecord record, Long accessGrantId, Long documentId) {
        try {
            AuditLog entry = new AuditLog();
            if (actor != null) {
                entry.setActorId(actor.getId());
                entry.setActorName(actor.getFullName());
                entry.setActorRole(actor.getRole());
            }
            entry.setPatientId(patientId);
            entry.setAction(action);
            entry.setDescription(description);
            if (record != null) {
                entry.setRecordId(record.getId());
                entry.setRecordType(record.getType().name());
            }
            entry.setAccessGrantId(accessGrantId);
            entry.setDocumentId(documentId);
            auditLogRepository.save(entry);
        } catch (RuntimeException ex) {
            // Best-effort: the audit row must not fail the user's operation.
            // Because this runs in its own transaction, nothing the caller does
            // is affected by the failure.
            log.error("Could not write audit entry for action {}: {}", action, ex.getMessage(), ex);
        }
    }

    /** Everything that happened to a patient's data, newest first. */
    @Transactional(readOnly = true)
    public List<ActivityDtos.AuditLogDto> forPatient(Long patientId, int limit) {
        return auditLogRepository.findByPatientIdOrderByCreatedAtDesc(patientId, PageRequest.of(0, limit))
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityDtos.AuditLogDto> forActor(Long actorId, int limit) {
        return auditLogRepository.findByActorIdOrderByCreatedAtDesc(actorId, PageRequest.of(0, limit))
                .stream().map(this::toDto).toList();
    }

    private ActivityDtos.AuditLogDto toDto(AuditLog entry) {
        return new ActivityDtos.AuditLogDto(
                entry.getId(),
                entry.getActorId(),
                entry.getActorName(),
                entry.getActorRole(),
                entry.getPatientId(),
                entry.getAction(),
                entry.getDescription(),
                entry.getRecordId(),
                entry.getRecordType(),
                entry.getAccessGrantId(),
                entry.getCreatedAt()
        );
    }
}