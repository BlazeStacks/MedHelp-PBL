package com.medhelp.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/** Demographic and emergency details belonging to a patient account. */
@Entity
@Table(name = "patient_profiles")
@Getter
@Setter
@NoArgsConstructor
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(length = 500)
    private String address;

    /** Free-text summary the patient chooses to share with their doctors. */
    @Column(name = "emergency_contact", length = 255)
    private String emergencyContact;

    @Column(name = "known_conditions", length = 2000)
    private String knownConditions;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}