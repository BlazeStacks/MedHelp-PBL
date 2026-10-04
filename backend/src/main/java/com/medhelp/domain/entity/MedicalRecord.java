package com.medhelp.domain.entity;

import com.medhelp.domain.enums.RecordCategory;
import com.medhelp.domain.enums.RecordType;
import com.medhelp.domain.enums.Severity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * A single structured medical record.
 *
 * <p>The MVP keeps the five record types in one table with nullable
 * type-specific columns. That avoids five near-identical tables and five sets
 * of repositories/controllers while still giving each type its own validated
 * DTO and form. If the project grows, the type-specific fields can be split
 * out without changing the consent model, which only cares about
 * {@link RecordType#category()}.
 *
 * <p>Records belong to a patient. Doctors may only CREATE new records (for
 * example a consultation or prescription) while holding an active access
 * grant; they can never update or delete historical records.
 */
@Entity
@Table(name = "medical_records", indexes = {
        @Index(name = "idx_record_patient", columnList = "patient_id"),
        @Index(name = "idx_record_patient_type", columnList = "patient_id, type"),
        @Index(name = "idx_record_date", columnList = "record_date")
})
@Getter
@Setter
@NoArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    /** Patient for self-authored records, doctor for records created during a consultation. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RecordType type;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    /** Optional free-text field available on every record type. */
    @Column(length = 4000)
    private String notes;

    // --- CONSULTATION ------------------------------------------------------
    @Column(length = 2000)
    private String symptoms;

    @Column(length = 2000)
    private String diagnosis;

    @Column(length = 2000)
    private String treatment;

    /** Clinic/hospital for a consultation, or the lab for a diagnostic report. */
    @Column(length = 255)
    private String facility;

    /** Denormalised doctor name so a record stays readable on its own. */
    @Column(name = "doctor_name", length = 255)
    private String doctorName;

    // --- DIAGNOSTIC REPORT -------------------------------------------------
    @Column(name = "test_name", length = 255)
    private String testName;

    @Column(name = "result_summary", length = 4000)
    private String resultSummary;

    // --- ALLERGY -----------------------------------------------------------
    @Column(length = 255)
    private String allergen;

    @Column(length = 255)
    private String reaction;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Severity severity;

    // --- MEDICAL HISTORY ---------------------------------------------------
    @Column(name = "condition_name", length = 255)
    private String conditionName;

    @Column(name = "current_status", length = 255)
    private String currentStatus;

    /** Approximate year for long-past conditions where the exact date is unknown. */
    @Column(name = "condition_year")
    private Integer conditionYear;

    /** Medicines belonging to a PRESCRIPTION record. */
    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<PrescriptionMedicine> medicines = new ArrayList<>();

    /** Uploaded PDFs/images attached to this record. */
    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("uploadedAt ASC")
    private List<MedicalDocument> documents = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Convenience accessor used by the consent layer. */
    @Transient
    public RecordCategory category() {
        return type.category();
    }

    public void addMedicine(PrescriptionMedicine medicine) {
        medicine.setRecord(this);
        medicines.add(medicine);
    }
}