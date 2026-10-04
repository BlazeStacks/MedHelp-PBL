package com.medhelp.dto;

import com.medhelp.domain.enums.RecordType;
import com.medhelp.domain.enums.Severity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Payloads for structured medical records.
 *
 * <p>One request shape covers all five record types. Fields that do not apply
 * to a chosen type are simply left empty, and {@code RecordService} validates
 * the combination (for example a PRESCRIPTION must carry at least one medicine,
 * a record type is required, and per-type fields are mandatory).
 */
public final class RecordDtos {

    private RecordDtos() {
    }

    public record MedicineDto(
            Long id,

            @NotBlank(message = "Medicine name is required")
            @Size(max = 255) String name,

            @Size(max = 100) String dosage,
            @Size(max = 100) String frequency,
            @Size(max = 100) String duration,
            @Size(max = 500) String instructions
    ) {
    }

    public record DocumentDto(
            Long id,
            String originalName,
            String contentType,
            Long sizeBytes,
            Instant uploadedAt,
            String uploadedByName,
            /** Backend endpoint that streams the file after an authorization check. */
            String contentUrl
    ) {
    }

    public record RecordDto(
            Long id,
            RecordType type,
            String typeLabel,
            String category,
            LocalDate recordDate,
            String notes,
            Long patientId,
            String patientName,
            Long createdById,
            String createdByName,
            boolean createdByDoctor,
            Instant createdAt,
            Instant updatedAt,

            // Consultation
            String symptoms,
            String diagnosis,
            String treatment,
            String facility,
            String doctorName,

            // Diagnostic report
            String testName,
            String resultSummary,

            // Allergy
            String allergen,
            String reaction,
            Severity severity,

            // Medical history
            String conditionName,
            String currentStatus,
            Integer conditionYear,

            List<MedicineDto> medicines,
            List<DocumentDto> documents
    ) {
    }

    public record CreateRecordRequest(
            @NotNull(message = "Record type is required")
            RecordType type,

            @NotNull(message = "Record date is required")
            LocalDate recordDate,

            @Size(max = 4000) String notes,

            @Size(max = 2000) String symptoms,
            @Size(max = 2000) String diagnosis,
            @Size(max = 2000) String treatment,
            @Size(max = 255) String facility,
            @Size(max = 255) String doctorName,

            @Size(max = 255) String testName,
            @Size(max = 4000) String resultSummary,

            @Size(max = 255) String allergen,
            @Size(max = 255) String reaction,
            Severity severity,

            @Size(max = 255) String conditionName,
            @Size(max = 255) String currentStatus,
            Integer conditionYear,

            @Valid List<MedicineDto> medicines,

            /** Only set when a doctor creates the record during a consultation. */
            Long patientId
    ) {
    }

    /** Same shape as create; the record type itself cannot be changed afterwards.
     *  {@code medicines} replaces the medicine list when provided. */
    public record UpdateRecordRequest(
            LocalDate recordDate,
            @Size(max = 4000) String notes,

            @Size(max = 2000) String symptoms,
            @Size(max = 2000) String diagnosis,
            @Size(max = 2000) String treatment,
            @Size(max = 255) String facility,
            @Size(max = 255) String doctorName,

            @Size(max = 255) String testName,
            @Size(max = 4000) String resultSummary,

            @Size(max = 255) String allergen,
            @Size(max = 255) String reaction,
            Severity severity,

            @Size(max = 255) String conditionName,
            @Size(max = 255) String currentStatus,
            Integer conditionYear,

            @Valid List<MedicineDto> medicines
    ) {
    }

    /** One row of the medical timeline. */
    public record TimelineEntry(
            Long id,
            RecordType type,
            String typeLabel,
            LocalDate date,
            String title,
            String subtitle,
            String summary,
            String doctorName,
            String facility,
            int documentCount
    ) {
    }

    /** Aggregated numbers for the dashboard cards. */
    public record RecordStats(
            long totalRecords,
            long consultations,
            long prescriptions,
            long diagnosticReports,
            long allergies,
            long medicalHistory,
            long documents
    ) {
    }
}