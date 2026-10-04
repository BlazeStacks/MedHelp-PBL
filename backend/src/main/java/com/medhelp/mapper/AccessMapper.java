package com.medhelp.mapper;

import com.medhelp.domain.entity.AccessGrant;
import com.medhelp.domain.entity.User;
import com.medhelp.dto.AccessDtos;
import com.medhelp.repository.DoctorProfileRepository;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Converts access grants into API payloads, including live/expiry information. */
@Component
public class AccessMapper {

    private final DoctorProfileRepository doctorProfileRepository;

    public AccessMapper(DoctorProfileRepository doctorProfileRepository) {
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public AccessDtos.AccessGrantDto toDto(AccessGrant grant) {
        User patient = grant.getPatient();
        User doctor = grant.getDoctor();

        String specialization = null;
        String hospital = null;
        if (doctor != null) {
            var profile = doctorProfileRepository.findByUserId(doctor.getId()).orElse(null);
            if (profile != null) {
                specialization = profile.getSpecialization();
                hospital = profile.getHospital();
            }
        }

        boolean live = grant.isLive();
        Long expiresInSeconds = null;
        if (live && grant.getExpiresAt() != null) {
            expiresInSeconds = Math.max(0, Duration.between(Instant.now(), grant.getExpiresAt()).toSeconds());
        }

        return new AccessDtos.AccessGrantDto(
                grant.getId(),
                patient == null ? null : patient.getId(),
                patient == null ? null : patient.getFullName(),
                patient == null ? null : patient.getEmail(),
                doctor == null ? null : doctor.getId(),
                doctor == null ? null : doctor.getFullName(),
                specialization,
                hospital,
                grant.isAccessAll(),
                List.copyOf(grant.getPermissions()),
                grant.getStatus(),
                grant.getReason(),
                grant.getDecisionNote(),
                grant.getCreatedAt(),
                grant.getRespondedAt(),
                grant.getExpiresAt(),
                grant.getRevokedAt(),
                live,
                expiresInSeconds
        );
    }

    public List<AccessDtos.AccessGrantDto> toDtos(List<AccessGrant> grants) {
        return grants.stream().map(this::toDto).toList();
    }
}