package com.medhelp.repository;

import com.medhelp.domain.entity.AccessGrant;
import com.medhelp.domain.enums.AccessStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AccessGrantRepository extends JpaRepository<AccessGrant, Long> {

    /** All grants a patient has ever created, newest first. */
    List<AccessGrant> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    /** Requests a doctor has made, newest first. */
    List<AccessGrant> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<AccessGrant> findByDoctorIdAndStatusOrderByCreatedAtDesc(Long doctorId, AccessStatus status);

    List<AccessGrant> findByPatientIdAndStatusOrderByCreatedAtDesc(Long patientId, AccessStatus status);

    /** Guards against a doctor creating duplicate pending requests for one patient. */
    Optional<AccessGrant> findFirstByPatientIdAndDoctorIdAndStatus(Long patientId, Long doctorId, AccessStatus status);

    /**
     * The grant that governs a doctor's current read access to a patient.
     * Only an APPROVED, unexpired grant can satisfy this.
     */
    @Query("""
            select g from AccessGrant g
            where g.patient.id = :patientId
              and g.doctor.id = :doctorId
              and g.status = com.medhelp.domain.enums.AccessStatus.APPROVED
              and g.expiresAt > :now
            order by g.expiresAt desc
            """)
    List<AccessGrant> findLiveGrants(@Param("patientId") Long patientId,
                                     @Param("doctorId") Long doctorId,
                                     @Param("now") Instant now);

    /** Used by the scheduler to close out grants that have lapsed. */
    @Query("""
            select g from AccessGrant g
            where g.status = com.medhelp.domain.enums.AccessStatus.APPROVED
              and g.expiresAt is not null
              and g.expiresAt <= :now
            """)
    List<AccessGrant> findLapsed(@Param("now") Instant now);

    long countByPatientIdAndStatus(Long patientId, AccessStatus status);

    long countByDoctorIdAndStatus(Long doctorId, AccessStatus status);
}
