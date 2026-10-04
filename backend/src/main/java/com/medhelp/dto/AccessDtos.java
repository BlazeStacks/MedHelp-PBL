package com.medhelp.dto;

import com.medhelp.domain.enums.AccessDuration;
import com.medhelp.domain.enums.AccessStatus;
import com.medhelp.domain.enums.RecordCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

/**
 * Payloads for the consent system.
 *
 * <p>{@link ApproveRequest} is where the patient decides between "everything"
 * and an explicit set of categories, and chooses how long the access lasts.
 */
public final class AccessDtos {

    private AccessDtos() {
    }

    /**
     * Doctor asks a patient for access.
     *
     * <p>{@code requestedCategories} is only a hint for the patient's approval
     * screen. It grants nothing on its own — the patient's decision is what
     * produces permissions.
     */
    public record CreateAccessRequest(
            @NotNull(message = "Patient is required")
            Long patientId,

            @Size(max = 500, message = "Reason is too long")
            String reason,

            Set<RecordCategory> requestedCategories
    ) {
    }

    public record ApproveRequest(
            /** When true the doctor receives every category and {@code permissions} is ignored. */
            boolean accessAll,

            /** Required when {@code accessAll} is false. */
            Set<RecordCategory> permissions,

            @NotNull(message = "Access duration is required")
            AccessDuration duration
    ) {
    }

    public record DenyRequest(
            @Size(max = 500, message = "Reason is too long")
            String reason
    ) {
    }

    /** Full grant view used by both dashboards. */
    public record AccessGrantDto(
            Long id,
            Long patientId,
            String patientName,
            String patientEmail,
            Long doctorId,
            String doctorName,
            String doctorSpecialization,
            String doctorHospital,
            boolean accessAll,
            List<RecordCategory> permissions,
            AccessStatus status,
            String reason,
            String decisionNote,
            Instant createdAt,
            Instant respondedAt,
            Instant expiresAt,
            Instant revokedAt,
            /** True while approved and not yet expired. */
            boolean live,
            /** Seconds until expiry; null when not live. */
            Long expiresInSeconds
    ) {
    }

    /** What a doctor is currently allowed to see for one patient. */
    public record EffectiveAccess(
            Long patientId,
            String patientName,
            boolean hasAccess,
            boolean accessAll,
            List<RecordCategory> permissions,
            Instant expiresAt,
            Long grantId
    ) {
    }

    /** Counters for the patient dashboard. */
    public record AccessStats(
            long activeGrants,
            long pendingRequests,
            long deniedRequests,
            long totalRequests
    ) {
    }
}