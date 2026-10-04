package com.medhelp.domain.entity;

import com.medhelp.domain.enums.AccessStatus;
import com.medhelp.domain.enums.RecordCategory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * A patient-granted, time-boxed, category-scoped permission for one doctor.
 *
 * <p>This is the heart of the application. Access is never a boolean on the
 * doctor: it is a record the patient creates, scopes and can revoke. Every
 * doctor-facing read path resolves through {@code AccessGrantService}.
 *
 * <p>Semantics:
 * <ul>
 *   <li>{@code accessAll = true}  -> every {@link RecordCategory} is permitted.</li>
 *   <li>{@code accessAll = false} -> only the categories in {@code permissions}.</li>
 *   <li>Access is live only while {@code status == APPROVED} and
 *       {@code expiresAt} is in the future.</li>
 * </ul>
 */
@Entity
@Table(name = "access_grants", indexes = {
        @Index(name = "idx_grant_patient", columnList = "patient_id"),
        @Index(name = "idx_grant_doctor", columnList = "doctor_id"),
        @Index(name = "idx_grant_doctor_status", columnList = "doctor_id, status"),
        @Index(name = "idx_grant_expires", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
public class AccessGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @Column(name = "access_all", nullable = false)
    private boolean accessAll = false;

    /** Only meaningful when {@code accessAll} is false. */
    @ElementCollection(fetch = FetchType.EAGER, targetClass = RecordCategory.class)
    @CollectionTable(name = "access_grant_permissions",
            joinColumns = @JoinColumn(name = "access_grant_id"),
            indexes = @Index(name = "idx_grant_permission_grant", columnList = "access_grant_id"))
    @Column(name = "category", length = 40, nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<RecordCategory> permissions = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccessStatus status = AccessStatus.PENDING;

    /** What the doctor said they need access for. */
    @Column(length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Set when the patient approves or denies. */
    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Optional note the patient leaves when denying or revoking. */
    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    /** Null while pending; set on approval. */
    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    /** True when the grant is currently usable: approved and not yet expired. */
    @Transient
    public boolean isLive() {
        return status == AccessStatus.APPROVED
                && expiresAt != null
                && expiresAt.isAfter(Instant.now());
    }

    /** Whether this grant permits reading the given category right now. */
    @Transient
    public boolean permits(RecordCategory category) {
        return isLive() && (accessAll || permissions.contains(category));
    }
}