package com.medhelp.controller;

import com.medhelp.dto.ActivityDtos;
import com.medhelp.dto.ProfileDtos;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.AuthService;
import com.medhelp.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Endpoints available to a signed-in doctor. */
@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final AuthService authService;
    private final DashboardService dashboardService;

    public DoctorController(AuthService authService, DashboardService dashboardService) {
        this.authService = authService;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/me")
    public ProfileDtos.DoctorProfileDto me() {
        return authService.getDoctorProfile(SecurityUtils.currentUserId());
    }

    @PutMapping("/me")
    public ProfileDtos.DoctorProfileDto updateMe(
            @Valid @RequestBody ProfileDtos.UpdateDoctorProfileRequest request) {
        return authService.updateDoctorProfile(SecurityUtils.currentUserId(), request);
    }

    /**
     * Finds patients to request access from.
     *
     * <p>Returns identifying details only — never medical data. Access to
     * records still requires the patient's explicit approval.
     */
    @GetMapping("/patients/search")
    public List<ProfileDtos.PatientSearchResult> searchPatients(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "10") int limit) {
        return authService.searchPatients(query, limit);
    }

    @GetMapping("/dashboard")
    public ActivityDtos.DoctorDashboard dashboard() {
        return dashboardService.doctorDashboard(SecurityUtils.currentUserId());
    }
}