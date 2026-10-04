package com.medhelp.service;

import com.medhelp.config.MedHelpProperties;
import com.medhelp.domain.entity.DoctorProfile;
import com.medhelp.domain.entity.PatientProfile;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.Role;
import com.medhelp.dto.AuthDtos;
import com.medhelp.dto.ProfileDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.repository.DoctorProfileRepository;
import com.medhelp.repository.PatientProfileRepository;
import com.medhelp.repository.UserRepository;
import com.medhelp.security.JwtService;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Registration, login and profile management.
 *
 * <p>Passwords are hashed with BCrypt and never logged or returned. Registering
 * also creates the matching role profile so the rest of the code can assume a
 * profile always exists.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final MedHelpProperties properties;

    public AuthService(UserRepository userRepository,
                       PatientProfileRepository patientProfileRepository,
                       DoctorProfileRepository doctorProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       AuditService auditService,
                       MedHelpProperties properties) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
        this.properties = properties;
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        if (request.role() == Role.PATIENT) {
            PatientProfile profile = new PatientProfile();
            profile.setUser(user);
            patientProfileRepository.save(profile);
        } else {
            DoctorProfile profile = new DoctorProfile();
            profile.setUser(user);
            profile.setSpecialization(request.specialization());
            profile.setHospital(request.hospital());
            profile.setRegistrationNumber(request.registrationNumber());
            doctorProfileRepository.save(profile);
        }

        auditService.record(AuditAction.REGISTER, user, null,
                user.getFullName() + " registered as " + user.getRole().name().toLowerCase());

        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                // Same message for unknown email and wrong password so the endpoint
                // cannot be used to enumerate accounts.
                .orElseThrow(() -> ApiException.unauthorized("Incorrect email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Incorrect email or password");
        }
        if (!user.isEnabled()) {
            throw ApiException.forbidden("This account has been disabled");
        }

        auditService.record(AuditAction.LOGIN, user, null, user.getFullName() + " signed in");
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(String rawRefreshToken) {
        User user = refreshTokenService.consume(rawRefreshToken);
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    private AuthDtos.AuthResponse issueTokens(User user) {
        String accessToken = jwtService.issueAccessToken(user);
        String refreshToken = refreshTokenService.issue(user);
        return refreshTokenService.buildAuthResponse(user, accessToken, jwtService.accessTokenSeconds(), refreshToken);
    }

    // --- Profiles ----------------------------------------------------------

    @Transactional(readOnly = true)
    public ProfileDtos.PatientProfileDto getPatientProfile(Long userId) {
        User user = requireUser(userId);
        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    PatientProfile created = new PatientProfile();
                    created.setUser(user);
                    return created;
                });
        return new ProfileDtos.PatientProfileDto(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                profile.getDateOfBirth(), profile.getGender(), profile.getBloodGroup(),
                profile.getAddress(), profile.getEmergencyContact(), profile.getKnownConditions(),
                profile.getUpdatedAt());
    }

    @Transactional
    public ProfileDtos.PatientProfileDto updatePatientProfile(Long userId,
                                                              ProfileDtos.UpdatePatientProfileRequest request) {
        User user = requireUser(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        user.setPhone(request.phone());
        userRepository.save(user);

        PatientProfile profile = patientProfileRepository.findByUserId(userId).orElseGet(() -> {
            PatientProfile created = new PatientProfile();
            created.setUser(user);
            return created;
        });
        if (request.dateOfBirth() != null) {
            profile.setDateOfBirth(request.dateOfBirth());
        }
        profile.setGender(request.gender());
        profile.setBloodGroup(request.bloodGroup());
        profile.setAddress(request.address());
        profile.setEmergencyContact(request.emergencyContact());
        profile.setKnownConditions(request.knownConditions());
        patientProfileRepository.save(profile);

        return getPatientProfile(userId);
    }

    @Transactional(readOnly = true)
    public ProfileDtos.DoctorProfileDto getDoctorProfile(Long userId) {
        User user = requireUser(userId);
        DoctorProfile profile = doctorProfileRepository.findByUserId(userId).orElseGet(() -> {
            DoctorProfile created = new DoctorProfile();
            created.setUser(user);
            return created;
        });
        return new ProfileDtos.DoctorProfileDto(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                profile.getSpecialization(), profile.getHospital(), profile.getRegistrationNumber(),
                profile.getYearsOfExperience(), profile.getBio(), profile.isVerified(),
                profile.getUpdatedAt());
    }

    @Transactional
    public ProfileDtos.DoctorProfileDto updateDoctorProfile(Long userId,
                                                            ProfileDtos.UpdateDoctorProfileRequest request) {
        User user = requireUser(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        user.setPhone(request.phone());
        userRepository.save(user);

        DoctorProfile profile = doctorProfileRepository.findByUserId(userId).orElseGet(() -> {
            DoctorProfile created = new DoctorProfile();
            created.setUser(user);
            return created;
        });
        profile.setSpecialization(request.specialization());
        profile.setHospital(request.hospital());
        profile.setRegistrationNumber(request.registrationNumber());
        profile.setYearsOfExperience(request.yearsOfExperience());
        profile.setBio(request.bio());
        doctorProfileRepository.save(profile);

        return getDoctorProfile(userId);
    }

    /**
     * Patient search for doctors.
     *
     * <p>Returns only minimal identifying information. No medical data is
     * reachable from here — that requires an approved access grant.
     */
    @Transactional(readOnly = true)
    public List<ProfileDtos.PatientSearchResult> searchPatients(String query, int limit) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return List.of();
        }
        return userRepository.searchByRoleAndQuery(Role.PATIENT, q, PageRequest.of(0, Math.min(limit, 25)))
                .stream()
                .map(patient -> {
                    PatientProfile profile = patientProfileRepository.findByUserId(patient.getId()).orElse(null);
                    return new ProfileDtos.PatientSearchResult(
                            patient.getId(),
                            patient.getFullName(),
                            patient.getEmail(),
                            profile == null ? null : profile.getBloodGroup(),
                            profile == null ? null : profile.getDateOfBirth(),
                            null);
                })
                .toList();
    }

    public User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}