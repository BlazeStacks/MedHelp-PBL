package com.medhelp.controller;

import com.medhelp.dto.ActivityDtos;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.AuditService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Access history.
 *
 * <p>A patient sees everything that happened to their data, including blocked
 * access attempts. A doctor sees their own activity. Nobody can read another
 * user's audit trail.
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public List<ActivityDtos.AuditLogDto> history(@RequestParam(defaultValue = "100") int limit) {
        var principal = SecurityUtils.currentUser();
        int capped = Math.min(Math.max(limit, 1), 500);
        return principal.isPatient()
                ? auditService.forPatient(principal.getId(), capped)
                : auditService.forActor(principal.getId(), capped);
    }
}