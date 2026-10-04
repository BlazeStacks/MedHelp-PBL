package com.medhelp.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Metadata for an uploaded file.
 *
 * <p>The bytes themselves never live in PostgreSQL. Only the storage reference
 * ({@code storagePath}) is persisted; the file is written through the storage
 * abstraction to either local disk or a private Supabase Storage bucket.
 * Files are never exposed through a permanent public URL — reads always go
 * through an authorization check first.
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_document_record", columnList = "record_id"),
        @Index(name = "idx_document_patient", columnList = "patient_id")
})
@Getter
@Setter
@NoArgsConstructor
public class MedicalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "record_id", nullable = false)
    private MedicalRecord record;

    /** Denormalised owner so document authorization does not need the record graph. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    /** Provider-relative key, e.g. {@code patients/12/records/44/uuid.pdf}. */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "storage_provider", nullable = false, length = 20)
    private String storageProvider;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private Instant uploadedAt;
}