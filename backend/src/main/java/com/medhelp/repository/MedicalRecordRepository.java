package com.medhelp.repository;

import com.medhelp.domain.entity.MedicalRecord;
import com.medhelp.domain.enums.RecordType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByRecordDateDescIdDesc(Long patientId);

    List<MedicalRecord> findByPatientIdAndTypeOrderByRecordDateDescIdDesc(Long patientId, RecordType type);

    /**
     * Category-scoped read used when a doctor holds a partial access grant.
     * The caller passes only the record types the grant actually permits.
     */
    @Query("""
            select r from MedicalRecord r
            where r.patient.id = :patientId
              and r.type in :types
            order by r.recordDate desc, r.id desc
            """)
    List<MedicalRecord> findByPatientIdAndTypes(@Param("patientId") Long patientId,
                                                @Param("types") List<RecordType> types);

    long countByPatientId(Long patientId);

    /** Number of records of a given type authored by one doctor. */
    long countByCreatedByIdAndType(Long createdById, RecordType type);

    @Query("""
            select r from MedicalRecord r
            where r.patient.id = :patientId
            order by r.recordDate desc, r.id desc
            """)
    List<MedicalRecord> findRecentByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query("select r.type, count(r) from MedicalRecord r where r.patient.id = :patientId group by r.type")
    List<Object[]> countGroupedByType(@Param("patientId") Long patientId);
}
