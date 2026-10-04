package com.medhelp.service;

import com.medhelp.domain.entity.AccessGrant;
import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.AccessDuration;
import com.medhelp.domain.enums.AccessStatus;
import com.medhelp.domain.enums.AuditAction;
import com.medhelp.domain.enums.NotificationType;
import com.medhelp.domain.enums.RecordCategory;
import com.medhelp.domain.enums.RecordType;
import com.medhelp.domain.enums.Role;
import com.medhelp.dto.AccessDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.mapper.AccessMapper;
import com.medhelp.repository.AccessGrantRepository;
import com.medhelp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * The consent engine.
 *
 * <p>This class is the single source of truth for the question "may this
 * doctor read this patient's record right now?". Every doctor-facing read path
 * calls {@link #requireCategoryAccess} or {@link #requireAnyAccess}, so hiding a
 * menu item in the UI is never what protects data.
 *
 * <p>Authorization is evaluated in this order:
 * <ol>
 *   <li>Is the requester actually a doctor?</li>
 *   <li>Who owns the record?</li>
 *   <li>Is there an APPROVED grant from that patient to that doctor?</li>
 *   <li>Has it expired?</li>
 *   <li>Does the grant allow this specific category?</li>
 * </ol>
 * A denial is itself audited, so patients can see attempted access too.
 */
@Service
public class AccessGrantService {

    private static final Logger log = LoggerFactory.getLogger(AccessGrantService.class);

    private final AccessGrantRepository accessGrantRepository;
    private final UserRepository userRepository;
    private final AccessMapper accessMapper;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public AccessGrantService(AccessGrantRepository accessGrantRepository,
                              UserRepository userRepository,
                              AccessMapper accessMapper,
                              AuditService auditService,
                              NotificationService notificationService) {
        this.accessGrantRepository = accessGrantRepository;
        this.userRepository = userRepository;
        this.accessMapper = accessMapper;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    // --- Doctor: request access -------------------------------------------

    @Transactional
    public AccessDtos.AccessGrantDto requestAccess(Long doctorId, AccessDtos.CreateAccessRequest request) {
        User doctor = requireUser(doctorId);
        User patient = requireUser(request.patientId());

        if (doctor.getRole() != Role.DOCTOR) {
            throw ApiException.forbidden("Only doctors can request access");
        }
        if (patient.getRole() != Role.PATIENT) {
            throw ApiException.badRequest("Access can only be requested for a patient");
        }
        if (doctor.getId().equals(patient.getId())) {
            throw ApiException.badRequest("You cannot request access to yourself");
        }

        // A live grant already answers the request; don't create noise for the patient.
        if (!liveGrants(patient.getId(), doctor.getId()).isEmpty()) {
            throw ApiException.conflict("You already have active access to this patient's records");
        }
        if (accessGrantRepository
                .findFirstByPatientIdAndDoctorIdAndStatus(patient.getId(), doctor.getId(), AccessStatus.PENDING)
                .isPresent()) {
            throw ApiException.conflict("You already have a pending request with this patient");
        }

        AccessGrant grant = new AccessGrant();
        grant.setPatient(patient);
        grant.setDoctor(doctor);
        grant.setStatus(AccessStatus.PENDING);
        grant.setReason(request.reason());
        // The doctor's requested categories are stored as a hint only. They become
        // real permissions only if and when the patient approves them.
        if (request.requestedCategories() != null && !request.requestedCategories().isEmpty()) {
            grant.setPermissions(EnumSet.copyOf(request.requestedCategories()));
        }
        accessGrantRepository.save(grant);

        auditService.record(AuditAction.ACCESS_REQUESTED, doctor, patient.getId(),
                doctor.getFullName() + " requested access to " + patient.getFullName() + "'s records",
                null, grant.getId(), null);

        notificationService.notify(patient, NotificationType.ACCESS_REQUEST,
                "New access request",
                doctor.getFullName() + " requested access to your medical records.",
                "/patient/access");

        return accessMapper.toDto(grant);
    }

    // --- Patient: approve / deny / revoke ---------------------------------

    @Transactional
    public AccessDtos.AccessGrantDto approve(Long patientId, Long grantId, AccessDtos.ApproveRequest request) {
        AccessGrant grant = requireGrantForPatient(patientId, grantId);
        if (grant.getStatus() != AccessStatus.PENDING) {
            throw ApiException.conflict("This request has already been " + grant.getStatus().name().toLowerCase());
        }

        Set<RecordCategory> permissions;
        if (request.accessAll()) {
            permissions = EnumSet.allOf(RecordCategory.class);
        } else {
            if (request.permissions() == null || request.permissions().isEmpty()) {
                throw ApiException.badRequest("Select at least one category, or choose to share all records");
            }
            permissions = EnumSet.copyOf(request.permissions());
        }

        grant.setAccessAll(request.accessAll());
        grant.setPermissions(permissions);
        grant.setStatus(AccessStatus.APPROVED);
        grant.setRespondedAt(Instant.now());
        grant.setExpiresAt(Instant.now().plus(durationToHours(request.duration()), ChronoUnit.HOURS));
        accessGrantRepository.save(grant);

        String scope = request.accessAll()
                ? "all records"
                : permissions.size() + " selected categories";
        auditService.record(AuditAction.ACCESS_APPROVED, grant.getPatient(), patientId,
                grant.getPatient().getFullName() + " approved " + grant.getDoctor().getFullName()
                        + "'s access to " + scope,
                null, grant.getId(), null);

        notificationService.notify(grant.getDoctor(), NotificationType.ACCESS_APPROVED,
                "Access approved",
                grant.getPatient().getFullName() + " approved your access request (" + scope + ").",
                "/doctor/patients/" + patientId);

        return accessMapper.toDto(grant);
    }

    @Transactional
    public AccessDtos.AccessGrantDto deny(Long patientId, Long grantId, AccessDtos.DenyRequest request) {
        AccessGrant grant = requireGrantForPatient(patientId, grantId);
        if (grant.getStatus() != AccessStatus.PENDING) {
            throw ApiException.conflict("This request has already been " + grant.getStatus().name().toLowerCase());
        }

        grant.setStatus(AccessStatus.DENIED);
        grant.setRespondedAt(Instant.now());
        grant.setPermissions(EnumSet.noneOf(RecordCategory.class));
        grant.setAccessAll(false);
        grant.setDecisionNote(request == null ? null : request.reason());
        accessGrantRepository.save(grant);

        auditService.record(AuditAction.ACCESS_DENIED, grant.getPatient(), patientId,
                grant.getPatient().getFullName() + " denied " + grant.getDoctor().getFullName()
                        + "'s access request",
                null, grant.getId(), null);

        notificationService.notify(grant.getDoctor(), NotificationType.ACCESS_DENIED,
                "Access denied",
                grant.getPatient().getFullName() + " denied your access request.",
                "/doctor/requests");

        return accessMapper.toDto(grant);
    }

    @Transactional
    public AccessDtos.AccessGrantDto revoke(Long patientId, Long grantId, AccessDtos.DenyRequest request) {
        AccessGrant grant = requireGrantForPatient(patientId, grantId);
        if (grant.getStatus() != AccessStatus.APPROVED) {
            throw ApiException.conflict("Only an active access grant can be revoked");
        }

        grant.setStatus(AccessStatus.REVOKED);
        grant.setRevokedAt(Instant.now());
        grant.setDecisionNote(request == null ? null : request.reason());
        accessGrantRepository.save(grant);

        auditService.record(AuditAction.ACCESS_REVOKED, grant.getPatient(), patientId,
                grant.getPatient().getFullName() + " revoked " + grant.getDoctor().getFullName() + "'s access",
                null, grant.getId(), null);

        notificationService.notify(grant.getDoctor(), NotificationType.ACCESS_REVOKED,
                "Access revoked",
                grant.getPatient().getFullName() + " revoked your access to their records.",
                "/doctor/patients");

        return accessMapper.toDto(grant);
    }

    /** Patient closes out a lapsed grant early, or a doctor dismisses their own. */
    @Transactional
    public AccessDtos.AccessGrantDto markExpired(AccessGrant grant, String reason) {
        grant.setStatus(AccessStatus.EXPIRED);
        accessGrantRepository.save(grant);
        auditService.record(AuditAction.ACCESS_EXPIRED, grant.getPatient(), grant.getPatient().getId(),
                reason, null, grant.getId(), null);
        return accessMapper.toDto(grant);
    }

    // --- Reads -------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AccessDtos.AccessGrantDto> requestsForPatient(Long patientId) {
        return accessMapper.toDtos(accessGrantRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
    }

    @Transactional(readOnly = true)
    public List<AccessDtos.AccessGrantDto> requestsFromDoctor(Long doctorId) {
        return accessMapper.toDtos(accessGrantRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId));
    }

    @Transactional(readOnly = true)
    public List<AccessDtos.AccessGrantDto> pendingForPatient(Long patientId) {
        return accessMapper.toDtos(
                accessGrantRepository.findByPatientIdAndStatusOrderByCreatedAtDesc(patientId, AccessStatus.PENDING));
    }

    @Transactional(readOnly = true)
    public List<AccessDtos.AccessGrantDto> liveGrantsForDoctor(Long doctorId) {
        return accessMapper.toDtos(liveGrants(null, doctorId));
    }

    /**
     * Describes exactly what a doctor may currently see for one patient.
     * The UI uses this to render the permission state, but the backend still
     * re-checks on every actual record fetch.
     */
    @Transactional(readOnly = true)
    public AccessDtos.EffectiveAccess effectiveAccess(Long doctorId, Long patientId) {
        User patient = requireUser(patientId);
        List<AccessGrant> grants = liveGrants(patientId, doctorId);
        if (grants.isEmpty()) {
            return new AccessDtos.EffectiveAccess(patientId, patient.getFullName(), false, false,
                    List.of(), null, null);
        }
        AccessGrant best = grants.get(0);
        boolean accessAll = grants.stream().anyMatch(AccessGrant::isAccessAll);
        Set<RecordCategory> union = EnumSet.noneOf(RecordCategory.class);
        grants.forEach(g -> union.addAll(g.getPermissions()));
        Instant expiresAt = grants.stream()
                .map(AccessGrant::getExpiresAt)
                .max(Instant::compareTo)
                .orElse(null);

        return new AccessDtos.EffectiveAccess(patientId, patient.getFullName(), true, accessAll,
                List.copyOf(union), expiresAt, best.getId());
    }

    // --- Authorization checks (used by record/document services) ----------

    /**
     * Enforces access to a specific category.
     *
     * @throws ApiException 403 when there is no live grant covering the category
     */
    @Transactional(readOnly = true)
    public void requireCategoryAccess(Long doctorId, Long patientId, RecordCategory category) {
        User patient = requireUser(patientId);
        List<AccessGrant> grants = liveGrants(patientId, doctorId);

        boolean permitted = grants.stream().anyMatch(g -> g.permits(category));
        if (permitted) {
            return;
        }

        // Audit the attempt so the patient's access history shows blocked reads.
        User doctor = userRepository.findById(doctorId).orElse(null);
        auditService.record(AuditAction.ACCESS_DENIED_BY_POLICY, doctor, patientId,
                (doctor == null ? "A doctor" : doctor.getFullName())
                        + " was denied access to " + category.name().toLowerCase().replace('_', ' ')
                        + " for " + patient.getFullName(),
                null, grants.isEmpty() ? null : grants.get(0).getId(), null);

        if (grants.isEmpty()) {
            throw ApiException.forbidden("You do not have active access to this patient's records");
        }
        throw ApiException.forbidden(
                "Your access grant does not include " + category.name().toLowerCase().replace('_', ' ') + " records");
    }

    /** Enforces that some live grant exists, regardless of category. */
    @Transactional(readOnly = true)
    public AccessGrant requireAnyAccess(Long doctorId, Long patientId) {
        User patient = requireUser(patientId);
        List<AccessGrant> grants = liveGrants(patientId, doctorId);
        if (grants.isEmpty()) {
            User doctor = userRepository.findById(doctorId).orElse(null);
            auditService.record(AuditAction.ACCESS_DENIED_BY_POLICY, doctor, patientId,
                    (doctor == null ? "A doctor" : doctor.getFullName())
                            + " was denied access to " + patient.getFullName() + "'s records (no active grant)",
                    null, null, null);
            throw ApiException.forbidden("You do not have active access to this patient's records");
        }
        return grants.get(0);
    }

    /**
     * The set of record types a doctor may read for a patient.
     * Returned empty when there is no live grant, which makes list queries
     * naturally return nothing rather than everything.
     */
    @Transactional(readOnly = true)
    public Set<RecordType> permittedRecordTypes(Long doctorId, Long patientId) {
        List<AccessGrant> grants = liveGrants(patientId, doctorId);
        if (grants.isEmpty()) {
            return EnumSet.noneOf(RecordType.class);
        }
        Set<RecordType> allowed = EnumSet.noneOf(RecordType.class);
        for (AccessGrant grant : grants) {
            for (RecordType type : RecordType.values()) {
                if (grant.permits(type.category())) {
                    allowed.add(type);
                }
            }
        }
        return allowed;
    }

    /** The categories a doctor can read for a patient, for the UI permission panel. */
    @Transactional(readOnly = true)
    public Set<RecordCategory> permittedCategories(Long doctorId, Long patientId) {
        Set<RecordCategory> allowed = EnumSet.noneOf(RecordCategory.class);
        for (RecordType type : permittedRecordTypes(doctorId, patientId)) {
            allowed.add(type.category());
        }
        return allowed;
    }

    // --- Housekeeping ------------------------------------------------------

    @Transactional
    public List<AccessGrant> findLapsed() {
        return accessGrantRepository.findLapsed(Instant.now());
    }

    @Transactional
    public int expireLapsedGrants() {
        List<AccessGrant> lapsed = accessGrantRepository.findLapsed(Instant.now());
        for (AccessGrant grant : lapsed) {
            grant.setStatus(AccessStatus.EXPIRED);
            accessGrantRepository.save(grant);
            auditService.record(AuditAction.ACCESS_EXPIRED, grant.getPatient(), grant.getPatient().getId(),
                    "Access for " + grant.getDoctor().getFullName() + " expired automatically",
                    null, grant.getId(), null);
            notificationService.notify(grant.getPatient(), NotificationType.ACCESS_EXPIRED,
                    "Access expired",
                    grant.getDoctor().getFullName() + "'s access to your records has expired.",
                    "/patient/access");
            notificationService.notify(grant.getDoctor(), NotificationType.ACCESS_EXPIRED,
                    "Access expired",
                    "Your access to " + grant.getPatient().getFullName() + "'s records has expired.",
                    "/doctor/patients");
        }
        if (!lapsed.isEmpty()) {
            log.info("Expired {} access grant(s)", lapsed.size());
        }
        return lapsed.size();
    }

    public long activeCount(Long patientId) {
        return accessGrantRepository.findByPatientIdAndStatusOrderByCreatedAtDesc(patientId, AccessStatus.APPROVED)
                .stream().filter(AccessGrant::isLive).count();
    }

    public long pendingCount(Long patientId) {
        return accessGrantRepository.countByPatientIdAndStatus(patientId, AccessStatus.PENDING);
    }

    // --- Helpers -----------------------------------------------------------

    private List<AccessGrant> liveGrants(Long patientId, Long doctorId) {
        Instant now = Instant.now();
        if (patientId == null) {
            // Doctor-scoped listing: filter in memory after fetching by doctor.
            return accessGrantRepository
                    .findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, AccessStatus.APPROVED)
                    .stream()
                    .filter(g -> g.getExpiresAt() != null && g.getExpiresAt().isAfter(now))
                    .toList();
        }
        return accessGrantRepository.findLiveGrants(patientId, doctorId, now);
    }

    private AccessGrant requireGrantForPatient(Long patientId, Long grantId) {
        AccessGrant grant = accessGrantRepository.findById(grantId)
                .orElseThrow(() -> ApiException.notFound("Access request not found"));
        if (!grant.getPatient().getId().equals(patientId)) {
            // Never reveal that someone else's grant exists.
            throw ApiException.forbidden("This access request does not belong to you");
        }
        return grant;
    }

    private long durationToHours(AccessDuration duration) {
        return switch (duration) {
            case ONE_HOUR -> 1;
            case TWENTY_FOUR_HOURS -> 24;
            case SEVEN_DAYS -> 24 * 7;
            case THIRTY_DAYS -> 24 * 30;
        };
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}