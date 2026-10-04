package com.medhelp.repository;

import com.medhelp.domain.entity.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, Long> {

    List<MedicalDocument> findByRecordIdOrderByUploadedAtAsc(Long recordId);

    long countByPatientId(Long patientId);
}
