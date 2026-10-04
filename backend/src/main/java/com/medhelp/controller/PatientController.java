package com.medhelp.controller;

import com.medhelp.dto.ActivityDtos;
import com.medhelp.dto.ProfileDtos;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.AuthService;
import com.medhelp.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** Endpoints available to a signed-in patient. */
@RestController
@RequestMapping("/api/patient")
public class PatientController {

    private final AuthService authService;
    private final DashboardService dashboardService;

    public PatientController(AuthService authService, DashboardService dashboardService) {
        this.authService = authService;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/me")
    public ProfileDtos.PatientProfileDto me() {
        return authService.getPatientProfile(SecurityUtils.currentUserId());
    }

    @PutMapping("/me")
    public ProfileDtos.PatientProfileDto updateMe(
            @Valid @RequestBody ProfileDtos.UpdatePatientProfileRequest request) {
        return authService.updatePatientProfile(SecurityUtils.currentUserId(), request);
    }

    /** Everything the patient home screen needs, in one request. */
    @GetMapping("/dashboard")
    public ActivityDtos.PatientDashboard dashboard() {
        return dashboardService.patientDashboard(SecurityUtils.currentUserId());
    }
}