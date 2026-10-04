package com.medhelp.dto;

import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.NotificationType;
import com.medhelp.domain.enums.Role;

import java.time.Instant;
import java.util.List;

/** Payloads for audit history and in-app notifications. */
public final class ActivityDtos {

    private ActivityDtos() {
    }

    public record AuditLogDto(
            Long id,
            Long actorId,
            String actorName,
            Role actorRole,
            Long patientId,
            AuditAction action,
            String description,
            Long recordId,
            String recordType,
            Long accessGrantId,
            Instant createdAt
    ) {
    }

    public record NotificationDto(
            Long id,
            NotificationType type,
            String title,
            String message,
            String link,
            boolean read,
            Instant createdAt
    ) {
    }

    public record NotificationSummary(
            long unread,
            List<NotificationDto> items
    ) {
    }

    /** Combined dashboard payload so the patient home screen loads in one request. */
    public record PatientDashboard(
            RecordDtos.RecordStats recordStats,
            AccessDtos.AccessStats accessStats,
            long unreadNotifications,
            List<RecordDtos.TimelineEntry> recentTimeline,
            List<AccessDtos.AccessGrantDto> pendingRequests,
            List<AccessDtos.AccessGrantDto> activeGrants,
            List<ActivityDtos.AuditLogDto> recentActivity
    ) {
    }

    /** Doctor home screen payload. */
    public record DoctorDashboard(
            long pendingRequests,
            long authorizedPatients,
            long prescriptionsWritten,
            long unreadNotifications,
            List<AccessDtos.AccessGrantDto> pendingRequestsList,
            List<AccessDtos.AccessGrantDto> activeGrants,
            List<ActivityDtos.AuditLogDto> recentActivity
    ) {
    }
}