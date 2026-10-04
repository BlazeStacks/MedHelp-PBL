package com.medhelp.service;

import com.medhelp.domain.entity.MedicalRecord;
import com.medhelp.domain.entity.PrescriptionMedicine;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.NotificationType;
import com.medhelp.domain.enums.RecordCategory;
import com.medhelp.domain.enums.RecordType;
import com.medhelp.domain.enums.Role;
import com.medhelp.dto.RecordDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.mapper.RecordMapper;
import com.medhelp.repository.MedicalDocumentRepository;
import com.medhelp.repository.MedicalRecordRepository;
import com.medhelp.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Reading and writing structured medical records.
 *
 * <p>Two rules shape this service:
 * <ul>
 *   <li>A patient always has full access to their own records.</li>
 *   <li>A doctor needs a live access grant for the record's category to read
 *       anything, and may only CREATE new records — never edit or delete
 *       history. That keeps past records immutable.</li>
 * </ul>
 */
@Service
public class RecordService {

    private final MedicalRecordRepository recordRepository;
    private final MedicalDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final AccessGrantService accessGrantService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final RecordMapper recordMapper;

    public RecordService(MedicalRecordRepository recordRepository,
                         MedicalDocumentRepository documentRepository,
                         UserRepository userRepository,
                         AccessGrantService accessGrantService,
                         AuditService auditService,
                         NotificationService notificationService,
                         RecordMapper recordMapper) {
        this.recordRepository = recordRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.accessGrantService = accessGrantService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.recordMapper = recordMapper;
    }

    // --- Patient views -----------------------------------------------------

    /** All of a patient's own records, optionally filtered by type. */
    @Transactional(readOnly = true)
    public List<RecordDtos.RecordDto> listOwnRecords(Long patientId, RecordType typeFilter) {
        List<MedicalRecord> records = typeFilter == null
                ? recordRepository.findByPatientIdOrderByRecordDateDescIdDesc(patientId)
                : recordRepository.findByPatientIdAndTypeOrderByRecordDateDescIdDesc(patientId, typeFilter);
        return records.stream().map(recordMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<RecordDtos.TimelineEntry> timeline(Long patientId, RecordType typeFilter) {
        return recordMapper.toTimeline(
                typeFilter == null
                        ? recordRepository.findByPatientIdOrderByRecordDateDescIdDesc(patientId)
                        : recordRepository.findByPatientIdAndTypeOrderByRecordDateDescIdDesc(patientId, typeFilter));
    }

    @Transactional(readOnly = true)
    public RecordDtos.RecordStats stats(Long patientId) {
        long total = recordRepository.countByPatientId(patientId);
        long consultations = 0, prescriptions = 0, diagnostics = 0, allergies = 0, history = 0;
        for (Object[] row : recordRepository.countGroupedByType(patientId)) {
            RecordType type = (RecordType) row[0];
            long count = ((Number) row[1]).longValue();
            switch (type) {
                case CONSULTATION -> consultations = count;
                case PRESCRIPTION -> prescriptions = count;
                case DIAGNOSTIC_REPORT -> diagnostics = count;
                case ALLERGY -> allergies = count;
                case MEDICAL_HISTORY -> history = count;
            }
        }
        return new RecordDtos.RecordStats(total, consultations, prescriptions, diagnostics,
                allergies, history, documentRepository.countByPatientId(patientId));
    }

    /** A patient reading one of their own records. */
    @Transactional(readOnly = true)
    public RecordDtos.RecordDto getOwnRecord(Long patientId, Long recordId) {
        return recordMapper.toDto(requireOwnedRecord(patientId, recordId));
    }

    @Transactional(readOnly = true)
    public MedicalRecord requireOwnedRecord(Long patientId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> ApiException.notFound("Record not found"));
        if (!record.getPatient().getId().equals(patientId)) {
            throw ApiException.forbidden("This record does not belong to you");
        }
        return record;
    }

    // --- Doctor views (consent enforced) -----------------------------------

    /**
     * Records a doctor may read for a patient, filtered by the live grant.
     *
     * <p>When the caller also passes {@code typeFilter}, it is intersected with
     * the permitted types, so a doctor can never widen their view by asking for
     * a different category.
     */
    @Transactional(readOnly = true)
    public List<RecordDtos.RecordDto> listRecordsForDoctor(Long doctorId, Long patientId, RecordType typeFilter) {
        Set<RecordType> permitted = accessGrantService.permittedRecordTypes(doctorId, patientId);
        if (permitted.isEmpty()) {
            // Still triggers the denial audit entry and the 403 response.
            accessGrantService.requireAnyAccess(doctorId, patientId);
            return List.of();
        }

        List<RecordType> types;
        if (typeFilter != null) {
            if (!permitted.contains(typeFilter)) {
                accessGrantService.requireCategoryAccess(doctorId, patientId, typeFilter.category());
            }
            types = List.of(typeFilter);
        } else {
            types = List.copyOf(permitted);
        }

        List<MedicalRecord> records = recordRepository.findByPatientIdAndTypes(patientId, types);
        // Resolved eagerly (not getReferenceById) because AuditService runs in its
        // own transaction and must be able to read the actor's name.
        auditService.record(AuditAction.RECORD_VIEWED, doctorActor(doctorId), patientId,
                "Viewed " + records.size() + " record(s) for " + patientName(patientId),
                null, null, null);
        return records.stream().map(recordMapper::toDto).toList();
    }

    /** Single record read by a doctor, with a category-level check. */
    @Transactional(readOnly = true)
    public RecordDtos.RecordDto getRecordForDoctor(Long doctorId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> ApiException.notFound("Record not found"));

        accessGrantService.requireCategoryAccess(doctorId, record.getPatient().getId(), record.category());

        auditService.record(AuditAction.RECORD_VIEWED, doctorActor(doctorId),
                record.getPatient().getId(),
                "Viewed " + record.getType().label().toLowerCase() + " for "
                        + record.getPatient().getFullName(),
                record, null, null);

        return recordMapper.toDto(record);
    }

    /**
     * Timeline for a doctor, restricted to the categories their grant allows.
     *
     * <p>Queries entities directly rather than round-tripping through DTOs, so
     * medicines and documents load inside the same transaction.
     */
    @Transactional(readOnly = true)
    public List<RecordDtos.TimelineEntry> timelineForDoctor(Long doctorId, Long patientId) {
        Set<RecordType> permitted = accessGrantService.permittedRecordTypes(doctorId, patientId);
        if (permitted.isEmpty()) {
            accessGrantService.requireAnyAccess(doctorId, patientId);
            return List.of();
        }

        List<MedicalRecord> records = recordRepository.findByPatientIdAndTypes(patientId, List.copyOf(permitted));
        auditService.record(AuditAction.RECORD_VIEWED, doctorActor(doctorId), patientId,
                "Viewed the timeline for " + patientName(patientId), null, null, null);
        return recordMapper.toTimeline(records);
    }

    /** Fully-loaded actor for audit rows written in a separate transaction. */
    private User doctorActor(Long doctorId) {
        return userRepository.findById(doctorId).orElse(null);
    }

    // --- Create ------------------------------------------------------------

    @Transactional
    public RecordDtos.RecordDto createRecord(Long actorId, RecordDtos.CreateRecordRequest request) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        User patient;
        if (actor.getRole() == Role.PATIENT) {
            if (request.patientId() != null && !request.patientId().equals(actor.getId())) {
                throw ApiException.forbidden("You can only add records to your own profile");
            }
            patient = actor;
        } else {
            // A doctor may only create a record in a consultation context they
            // actually have consent for, and only in a category they were granted.
            if (request.patientId() == null) {
                throw ApiException.badRequest("A patient must be selected when a doctor adds a record");
            }
            patient = userRepository.findById(request.patientId())
                    .orElseThrow(() -> ApiException.notFound("Patient not found"));
            if (patient.getRole() != Role.PATIENT) {
                throw ApiException.badRequest("Records can only be created for a patient");
            }
            accessGrantService.requireCategoryAccess(actorId, patient.getId(), request.type().category());
        }

        validate(request);

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setCreatedBy(actor);
        record.setType(request.type());
        record.setRecordDate(request.recordDate());
        applyFields(record, request);

        // A doctor-created record carries the doctor's name so it stays readable later.
        if (actor.getRole() == Role.DOCTOR && (record.getDoctorName() == null || record.getDoctorName().isBlank())) {
            record.setDoctorName(actor.getFullName());
        }

        if (request.medicines() != null) {
            for (RecordDtos.MedicineDto medicine : request.medicines()) {
                PrescriptionMedicine entity = new PrescriptionMedicine();
                entity.setName(medicine.name());
                entity.setDosage(medicine.dosage());
                entity.setFrequency(medicine.frequency());
                entity.setDuration(medicine.duration());
                entity.setInstructions(medicine.instructions());
                record.addMedicine(entity);
            }
        }

        recordRepository.save(record);

        boolean byDoctor = actor.getRole() == Role.DOCTOR;
        auditService.record(byDoctor ? AuditAction.PRESCRIPTION_CREATED : AuditAction.RECORD_CREATED,
                actor, patient.getId(),
                (byDoctor ? actor.getFullName() + " added a " : "Added a ")
                        + record.getType().label().toLowerCase()
                        + (byDoctor ? " for " + patient.getFullName() : ""),
                record, null, null);

        // Tell the patient whenever a doctor adds something to their file.
        if (byDoctor) {
            notificationService.notify(patient, NotificationType.PRESCRIPTION_ADDED,
                    "New " + record.getType().label().toLowerCase() + " added",
                    actor.getFullName() + " added a " + record.getType().label().toLowerCase()
                            + " to your records.",
                    "/patient/timeline");
        }

        return recordMapper.toDto(record);
    }

    // --- Update / delete (patient-owned records only) ----------------------

    @Transactional
    public RecordDtos.RecordDto updateRecord(Long patientId, Long recordId, RecordDtos.UpdateRecordRequest request) {
        MedicalRecord record = requireOwnedRecord(patientId, recordId);

        if (request.recordDate() != null) {
            record.setRecordDate(request.recordDate());
        }
        if (request.notes() != null) record.setNotes(request.notes());
        if (request.symptoms() != null) record.setSymptoms(request.symptoms());
        if (request.diagnosis() != null) record.setDiagnosis(request.diagnosis());
        if (request.treatment() != null) record.setTreatment(request.treatment());
        if (request.facility() != null) record.setFacility(request.facility());
        if (request.doctorName() != null) record.setDoctorName(request.doctorName());
        if (request.testName() != null) record.setTestName(request.testName());
        if (request.resultSummary() != null) record.setResultSummary(request.resultSummary());
        if (request.allergen() != null) record.setAllergen(request.allergen());
        if (request.reaction() != null) record.setReaction(request.reaction());
        if (request.severity() != null) record.setSeverity(request.severity());
        if (request.conditionName() != null) record.setConditionName(request.conditionName());
        if (request.currentStatus() != null) record.setCurrentStatus(request.currentStatus());
        if (request.conditionYear() != null) record.setConditionYear(request.conditionYear());

        // Medicines are replaced wholesale when the client sends a list.
        if (request.medicines() != null) {
            record.getMedicines().clear();
            for (RecordDtos.MedicineDto medicine : request.medicines()) {
                PrescriptionMedicine entity = new PrescriptionMedicine();
                entity.setName(medicine.name());
                entity.setDosage(medicine.dosage());
                entity.setFrequency(medicine.frequency());
                entity.setDuration(medicine.duration());
                entity.setInstructions(medicine.instructions());
                record.addMedicine(entity);
            }
        }

        validateExisting(record);
        recordRepository.save(record);

        auditService.record(AuditAction.RECORD_UPDATED, record.getPatient(), patientId,
                "Updated a " + record.getType().label().toLowerCase(), record, null, null);

        return recordMapper.toDto(record);
    }

    @Transactional
    public void deleteRecord(Long patientId, Long recordId) {
        MedicalRecord record = requireOwnedRecord(patientId, recordId);
        auditService.record(AuditAction.RECORD_DELETED, record.getPatient(), patientId,
                "Deleted a " + record.getType().label().toLowerCase(), record, null, null);
        recordRepository.delete(record);
    }

    // --- Validation --------------------------------------------------------

    private void validate(RecordDtos.CreateRecordRequest request) {
        switch (request.type()) {
            case CONSULTATION -> {
                requireText(request.diagnosis(), "A diagnosis is required for a consultation");
                requireText(request.symptoms(), "Symptoms are required for a consultation");
            }
            case PRESCRIPTION -> {
                if (request.medicines() == null || request.medicines().isEmpty()) {
                    throw ApiException.badRequest("A prescription needs at least one medicine");
                }
                for (RecordDtos.MedicineDto medicine : request.medicines()) {
                    requireText(medicine.name(), "Every medicine needs a name");
                }
            }
            case DIAGNOSTIC_REPORT -> requireText(request.testName(), "A test name is required for a diagnostic report");
            case ALLERGY -> requireText(request.allergen(), "An allergen is required for an allergy");
            case MEDICAL_HISTORY -> requireText(request.conditionName(),
                    "A condition name is required for medical history");
        }
    }

    private void validateExisting(MedicalRecord record) {
        if (record.getType() == RecordType.PRESCRIPTION && record.getMedicines().isEmpty()) {
            throw ApiException.badRequest("A prescription needs at least one medicine");
        }
    }

    private void applyFields(MedicalRecord record, RecordDtos.CreateRecordRequest request) {
        record.setNotes(request.notes());
        record.setSymptoms(request.symptoms());
        record.setDiagnosis(request.diagnosis());
        record.setTreatment(request.treatment());
        record.setFacility(request.facility());
        record.setDoctorName(request.doctorName());
        record.setTestName(request.testName());
        record.setResultSummary(request.resultSummary());
        record.setAllergen(request.allergen());
        record.setReaction(request.reaction());
        record.setSeverity(request.severity());
        record.setConditionName(request.conditionName());
        record.setCurrentStatus(request.currentStatus());
        record.setConditionYear(request.conditionYear());

        if (record.getRecordDate() == null) {
            record.setRecordDate(LocalDate.now());
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest(message);
        }
    }

    private String patientName(Long patientId) {
        return userRepository.findById(patientId).map(User::getFullName).orElse("the patient");
    }

    /** Convenience for the documents controller. */
    public RecordCategory categoryOf(MedicalRecord record) {
        return record.category();
    }
}