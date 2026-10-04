package com.medhelp.mapper;

import com.medhelp.domain.entity.MedicalDocument;
import com.medhelp.domain.entity.MedicalRecord;
import com.medhelp.domain.entity.PrescriptionMedicine;
import com.medhelp.domain.entity.User;
import com.medhelp.dto.RecordDtos;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Converts record entities into the DTOs the API returns.
 *
 * <p>Kept as a small hand-written mapper rather than a mapping library: the
 * shape is simple, and explicit code is easier to explain during evaluation.
 */
@Component
public class RecordMapper {

    public RecordDtos.RecordDto toDto(MedicalRecord record) {
        User creator = record.getCreatedBy();
        boolean createdByDoctor = creator != null
                && creator.getRole() == com.medhelp.domain.enums.Role.DOCTOR;

        return new RecordDtos.RecordDto(
                record.getId(),
                record.getType(),
                record.getType().label(),
                record.getType().category().name(),
                record.getRecordDate(),
                record.getNotes(),
                record.getPatient().getId(),
                record.getPatient().getFullName(),
                creator == null ? null : creator.getId(),
                creator == null ? null : creator.getFullName(),
                createdByDoctor,
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getSymptoms(),
                record.getDiagnosis(),
                record.getTreatment(),
                record.getFacility(),
                record.getDoctorName(),
                record.getTestName(),
                record.getResultSummary(),
                record.getAllergen(),
                record.getReaction(),
                record.getSeverity(),
                record.getConditionName(),
                record.getCurrentStatus(),
                record.getConditionYear(),
                record.getMedicines().stream().map(this::toMedicineDto).toList(),
                record.getDocuments().stream().map(this::toDocumentDto).toList()
        );
    }

    public RecordDtos.MedicineDto toMedicineDto(PrescriptionMedicine medicine) {
        return new RecordDtos.MedicineDto(
                medicine.getId(),
                medicine.getName(),
                medicine.getDosage(),
                medicine.getFrequency(),
                medicine.getDuration(),
                medicine.getInstructions()
        );
    }

    public RecordDtos.DocumentDto toDocumentDto(MedicalDocument document) {
        return new RecordDtos.DocumentDto(
                document.getId(),
                document.getOriginalName(),
                document.getContentType(),
                document.getSizeBytes(),
                document.getUploadedAt(),
                document.getUploadedBy() == null ? null : document.getUploadedBy().getFullName(),
                // Always the authenticated backend endpoint. Files are never public.
                "/api/documents/" + document.getId() + "/content"
        );
    }

    /** Builds one timeline row from a record. */
    public RecordDtos.TimelineEntry toTimelineEntry(MedicalRecord record) {
        String title = switch (record.getType()) {
            case CONSULTATION -> record.getDiagnosis() != null && !record.getDiagnosis().isBlank()
                    ? record.getDiagnosis()
                    : "Consultation";
            case PRESCRIPTION -> "Prescription";
            case DIAGNOSTIC_REPORT -> record.getTestName() != null && !record.getTestName().isBlank()
                    ? record.getTestName()
                    : "Diagnostic Report";
            case ALLERGY -> record.getAllergen() != null && !record.getAllergen().isBlank()
                    ? "Allergy: " + record.getAllergen()
                    : "Allergy";
            case MEDICAL_HISTORY -> record.getConditionName() != null && !record.getConditionName().isBlank()
                    ? record.getConditionName()
                    : "Medical History";
        };

        String subtitle = switch (record.getType()) {
            case CONSULTATION -> record.getDoctorName();
            case PRESCRIPTION -> record.getDoctorName();
            case DIAGNOSTIC_REPORT -> record.getFacility();
            case ALLERGY -> record.getSeverity() == null ? null : record.getSeverity().name();
            case MEDICAL_HISTORY -> record.getCurrentStatus();
        };

        String summary = switch (record.getType()) {
            case CONSULTATION -> firstNonBlank(record.getTreatment(), record.getSymptoms(), record.getNotes());
            case PRESCRIPTION -> record.getMedicines().isEmpty()
                    ? record.getNotes()
                    : record.getMedicines().size() + " medicine(s): "
                        + record.getMedicines().stream().map(PrescriptionMedicine::getName)
                            .limit(3).reduce((a, b) -> a + ", " + b).orElse("");
            case DIAGNOSTIC_REPORT -> firstNonBlank(record.getResultSummary(), record.getNotes());
            case ALLERGY -> firstNonBlank(record.getReaction(), record.getNotes());
            case MEDICAL_HISTORY -> firstNonBlank(record.getTreatment(), record.getNotes());
        };

        return new RecordDtos.TimelineEntry(
                record.getId(),
                record.getType(),
                record.getType().label(),
                record.getRecordDate(),
                title,
                subtitle,
                summary,
                record.getDoctorName(),
                record.getFacility(),
                record.getDocuments().size()
        );
    }

    public List<RecordDtos.TimelineEntry> toTimeline(List<MedicalRecord> records) {
        return records.stream().map(this::toTimelineEntry).toList();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}