package com.medhelp.controller;

import com.medhelp.dto.AccessDtos;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.AccessGrantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The consent API.
 *
 * <p>Doctors create requests; patients approve, deny or revoke them. Every
 * method derives the acting user from the JWT and re-checks ownership, so a
 * patient can never act on another patient's grant.
 */
@RestController
@RequestMapping("/api/access")
public class AccessController {

    private final AccessGrantService accessGrantService;

    public AccessController(AccessGrantService accessGrantService) {
        this.accessGrantService = accessGrantService;
    }

    /** Doctor asks a patient for access. */
    @PostMapping("/request")
    public ResponseEntity<AccessDtos.AccessGrantDto> request(
            @Valid @RequestBody AccessDtos.CreateAccessRequest request) {
        var principal = SecurityUtils.currentUser();
        if (!principal.isDoctor()) {
            throw com.medhelp.exception.ApiException.forbidden("Only doctors can request access");
        }
        AccessDtos.AccessGrantDto grant = accessGrantService.requestAccess(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(grant);
    }

    /** Every request involving the current user (patient or doctor view). */
    @GetMapping("/requests")
    public List<AccessDtos.AccessGrantDto> requests() {
        var principal = SecurityUtils.currentUser();
        return principal.isPatient()
                ? accessGrantService.requestsForPatient(principal.getId())
                : accessGrantService.requestsFromDoctor(principal.getId());
    }

    /** Just the pending ones, for the dashboard badge and review list. */
    @GetMapping("/requests/pending")
    public List<AccessDtos.AccessGrantDto> pending() {
        var principal = SecurityUtils.currentUser();
        if (principal.isPatient()) {
            return accessGrantService.pendingForPatient(principal.getId());
        }
        return accessGrantService.requestsFromDoctor(principal.getId()).stream()
                .filter(grant -> grant.status() == com.medhelp.domain.enums.AccessStatus.PENDING)
                .toList();
    }

    /** Currently active grants. */
    @GetMapping("/grants")
    public List<AccessDtos.AccessGrantDto> activeGrants() {
        var principal = SecurityUtils.currentUser();
        if (principal.isPatient()) {
            return accessGrantService.requestsForPatient(principal.getId()).stream()
                    .filter(AccessDtos.AccessGrantDto::live)
                    .toList();
        }
        return accessGrantService.liveGrantsForDoctor(principal.getId());
    }

    /**
     * What a doctor may currently see for a patient.
     * Used by the doctor UI to render the permission panel.
     */
    @GetMapping("/effective/{patientId}")
    public AccessDtos.EffectiveAccess effective(@PathVariable Long patientId) {
        var principal = SecurityUtils.currentUser();
        if (!principal.isDoctor()) {
            throw com.medhelp.exception.ApiException.forbidden("Only doctors have effective doctor access");
        }
        return accessGrantService.effectiveAccess(principal.getId(), patientId);
    }

    @PostMapping("/{id}/approve")
    public AccessDtos.AccessGrantDto approve(@PathVariable Long id,
                                             @Valid @RequestBody AccessDtos.ApproveRequest request) {
        return accessGrantService.approve(SecurityUtils.currentUserId(), id, request);
    }

    @PostMapping("/{id}/deny")
    public AccessDtos.AccessGrantDto deny(@PathVariable Long id,
                                          @RequestBody(required = false) AccessDtos.DenyRequest request) {
        return accessGrantService.deny(SecurityUtils.currentUserId(), id, request);
    }

    @PostMapping("/{id}/revoke")
    public AccessDtos.AccessGrantDto revoke(@PathVariable Long id,
                                            @RequestBody(required = false) AccessDtos.DenyRequest request) {
        return accessGrantService.revoke(SecurityUtils.currentUserId(), id, request);
    }
}