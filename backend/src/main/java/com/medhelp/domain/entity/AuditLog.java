package com.medhelp.domain.entity;

import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Append-only record of security-relevant events.
 *
 * <p>Actor and patient are stored as plain ids rather than foreign keys so an
 * audit entry stays intact and readable even if an account is later removed.
 * Audit rows are never updated or deleted by application code.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_patient", columnList = "patient_id"),
        @Index(name = "idx_audit_actor", columnList = "actor_id"),
        @Index(name = "idx_audit_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", length = 255)
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", length = 20)
    private Role actorRole;

    /** Whose medical data this event concerns, when applicable. */
    @Column(name = "patient_id")
    private Long patientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AuditAction action;

    /** Human-readable summary shown in the access-history screen. */
    @Column(length = 500)
    private String description;

    @Column(name = "record_id")
    private Long recordId;

    @Column(name = "record_type", length = 40)
    private String recordType;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "access_grant_id")
    private Long accessGrantId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}