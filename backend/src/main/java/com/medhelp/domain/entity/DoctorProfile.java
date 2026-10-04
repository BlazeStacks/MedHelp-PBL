package com.medhelp.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Professional details for a doctor account.
 *
 * <p>Anyone can register as a doctor in the MVP. The {@code verified} flag is
 * stored now so an admin verification workflow can be layered on later without
 * a schema change.
 */
@Entity
@Table(name = "doctor_profiles", indexes = @Index(name = "idx_doctor_specialization", columnList = "specialization"))
@Getter
@Setter
@NoArgsConstructor
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "registration_number", length = 100)
    private String registrationNumber;

    @Column(length = 150)
    private String specialization;

    @Column(length = 255)
    private String hospital;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(length = 500)
    private String bio;

    /** Reserved for a future admin-verification step. */
    @Column(nullable = false)
    private boolean verified = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}