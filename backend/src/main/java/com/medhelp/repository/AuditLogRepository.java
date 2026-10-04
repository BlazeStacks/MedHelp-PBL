package com.medhelp.repository;

import com.medhelp.domain.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);

    List<AuditLog> findByActorIdOrderByCreatedAtDesc(Long actorId, Pageable pageable);

    List<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
