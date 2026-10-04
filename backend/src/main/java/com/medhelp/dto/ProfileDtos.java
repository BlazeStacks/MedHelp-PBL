package com.medhelp.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

/** Payloads for the patient and doctor profile screens. */
public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record PatientProfileDto(
            Long id,
            String fullName,
            String email,
            String phone,
            LocalDate dateOfBirth,
            String gender,
            String bloodGroup,
            String address,
            String emergencyContact,
            String knownConditions,
            Instant updatedAt
    ) {
    }

    public record UpdatePatientProfileRequest(
            @Size(max = 150) String fullName,
            @Size(max = 20) String phone,
            LocalDate dateOfBirth,
            @Size(max = 20) String gender,
            @Pattern(regexp = "^$|^(A|B|AB|O)[+-]$", message = "Blood group must look like A+, O-, AB+")
            String bloodGroup,
            @Size(max = 500) String address,
            @Size(max = 255) String emergencyContact,
            @Size(max = 2000) String knownConditions
    ) {
    }

    public record DoctorProfileDto(
            Long id,
            String fullName,
            String email,
            String phone,
            String specialization,
            String hospital,
            String registrationNumber,
            Integer yearsOfExperience,
            String bio,
            boolean verified,
            Instant updatedAt
    ) {
    }

    public record UpdateDoctorProfileRequest(
            @Size(max = 150) String fullName,
            @Size(max = 20) String phone,
            @Size(max = 150) String specialization,
            @Size(max = 255) String hospital,
            @Size(max = 100) String registrationNumber,
            Integer yearsOfExperience,
            @Size(max = 500) String bio
    ) {
    }

    /**
     * Search result shown to a doctor.
     *
     * <p>Deliberately minimal: only enough to confirm they found the right
     * minimal identifying data. Making access requests is the only action available
     * before consent is granted.
     */
    public record PatientSearchResult(
            Long patientId,
            String fullName,
            String email,
            String bloodGroup,
            LocalDate dateOfBirth,
            String relationship
    ) {
    }
}