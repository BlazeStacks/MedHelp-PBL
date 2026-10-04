package com.medhelp.controller;

import com.medhelp.dto.ActivityDtos;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** In-app notification centre. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ActivityDtos.NotificationSummary list() {
        return notificationService.summaryFor(SecurityUtils.currentUserId());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead(SecurityUtils.currentUserId());
        return ResponseEntity.noContent().build();
    }
}