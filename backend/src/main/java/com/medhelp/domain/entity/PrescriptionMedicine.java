package com.medhelp.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A single medicine line inside a prescription record. */
@Entity
@Table(name = "prescription_medicines", indexes = @Index(name = "idx_medicine_record", columnList = "record_id"))
@Getter
@Setter
@NoArgsConstructor
public class PrescriptionMedicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "record_id", nullable = false)
    private MedicalRecord record;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String dosage;

    @Column(length = 100)
    private String frequency;

    @Column(length = 100)
    private String duration;

    @Column(length = 500)
    private String instructions;
}