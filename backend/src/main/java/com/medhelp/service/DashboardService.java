package com.medhelp.service;

import com.medhelp.domain.enums.AccessStatus;
import com.medhelp.domain.enums.RecordType;
import com.medhelp.dto.AccessDtos;
import com.medhelp.dto.ActivityDtos;
import com.medhelp.dto.RecordDtos;
import com.medhelp.mapper.AccessMapper;
import com.medhelp.mapper.RecordMapper;
import com.medhelp.repository.AccessGrantRepository;
import com.medhelp.repository.MedicalRecordRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Builds the two role-specific dashboard payloads in a single round trip. */
@Service
public class DashboardService {

    private final RecordService recordService;
    private final AccessGrantService accessGrantService;
    private final AccessGrantRepository accessGrantRepository;
    private final AccessMapper accessMapper;
    private final RecordMapper recordMapper;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final MedicalRecordRepository recordRepository;

    public DashboardService(RecordService recordService,
                            AccessGrantService accessGrantService,
                            AccessGrantRepository accessGrantRepository,
                            AccessMapper accessMapper,
                            RecordMapper recordMapper,
                            AuditService auditService,
                            NotificationService notificationService,
                            MedicalRecordRepository recordRepository) {
        this.recordService = recordService;
        this.accessGrantService = accessGrantService;
        this.accessGrantRepository = accessGrantRepository;
        this.accessMapper = accessMapper;
        this.recordMapper = recordMapper;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.recordRepository = recordRepository;
    }

    @Transactional(readOnly = true)
    public ActivityDtos.PatientDashboard patientDashboard(Long patientId) {
        RecordDtos.RecordStats stats = recordService.stats(patientId);

        List<AccessDtos.AccessGrantDto> pending = accessGrantService.pendingForPatient(patientId);

        List<AccessDtos.AccessGrantDto> allGrants = accessMapper.toDtos(
                accessGrantRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
        List<AccessDtos.AccessGrantDto> active = allGrants.stream()
                .filter(AccessDtos.AccessGrantDto::live)
                .toList();

        AccessDtos.AccessStats accessStats = new AccessDtos.AccessStats(
                active.size(),
                pending.size(),
                allGrants.stream().filter(g -> g.status() == AccessStatus.DENIED).count(),
                allGrants.size());

        List<RecordDtos.TimelineEntry> recent = recordMapper.toTimeline(
                recordRepository.findRecentByPatientId(patientId, PageRequest.of(0, 8)));

        return new ActivityDtos.PatientDashboard(
                stats,
                accessStats,
                notificationService.unreadCount(patientId),
                recent,
                pending,
                active,
                auditService.forPatient(patientId, 10));
    }

    @Transactional(readOnly = true)
    public ActivityDtos.DoctorDashboard doctorDashboard(Long doctorId) {
        List<AccessDtos.AccessGrantDto> pending = accessMapper.toDtos(
                accessGrantRepository.findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, AccessStatus.PENDING));

        List<AccessDtos.AccessGrantDto> active = accessGrantService.liveGrantsForDoctor(doctorId);

        long prescriptionsWritten = recordRepository.countByCreatedByIdAndType(doctorId, RecordType.PRESCRIPTION);

        return new ActivityDtos.DoctorDashboard(
                pending.size(),
                active.size(),
                prescriptionsWritten,
                notificationService.unreadCount(doctorId),
                pending,
                active,
                auditService.forActor(doctorId, 10));
    }
}