package com.medhelp.controller;

import com.medhelp.domain.enums.RecordType;
import com.medhelp.dto.RecordDtos;
import com.medhelp.exception.ApiException;
import com.medhelp.security.SecurityUtils;
import com.medhelp.service.DocumentService;
import com.medhelp.service.RecordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Record endpoints.
 *
 * <p>The same controller serves patients and doctors, but the rules differ:
 * a patient only ever touches their own records, while a doctor needs a live
 * access grant covering the relevant category. All of that is enforced in
 * {@link RecordService}, not here.
 */
@RestController
@RequestMapping("/api/records")
public class RecordController {

    private final RecordService recordService;
    private final DocumentService documentService;

    public RecordController(RecordService recordService, DocumentService documentService) {
        this.recordService = recordService;
        this.documentService = documentService;
    }

    /**
     * Lists records. A patient sees their own file. A doctor must pass
     * {@code patientId} and receives only the categories their grant allows.
     */
    @GetMapping
    public List<RecordDtos.RecordDto> list(
            @RequestParam(required = false) RecordType type,
            @RequestParam(required = false) Long patientId) {

        var principal = SecurityUtils.currentUser();
        if (principal.isPatient()) {
            return recordService.listOwnRecords(principal.getId(), type);
        }
        if (patientId == null) {
            throw ApiException.badRequest("Select a patient to view their records");
        }
        return recordService.listRecordsForDoctor(principal.getId(), patientId, type);
    }

    /** Timeline view, grouped by year on the client. */
    @GetMapping("/timeline")
    public List<RecordDtos.TimelineEntry> timeline(
            @RequestParam(required = false) RecordType type,
            @RequestParam(required = false) Long patientId) {

        var principal = SecurityUtils.currentUser();
        if (principal.isPatient()) {
            return recordService.timeline(principal.getId(), type);
        }
        if (patientId == null) {
            throw ApiException.badRequest("Select a patient to view their timeline");
        }
        return recordService.timelineForDoctor(principal.getId(), patientId);
    }

    /** Aggregated counts for the dashboard cards. */
    @GetMapping("/stats")
    public RecordDtos.RecordStats stats() {
        return recordService.stats(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    public RecordDtos.RecordDto get(@PathVariable Long id) {
        var principal = SecurityUtils.currentUser();
        if (principal.isPatient()) {
            return recordService.getOwnRecord(principal.getId(), id);
        }
        return recordService.getRecordForDoctor(principal.getId(), id);
    }

    @PostMapping
    public ResponseEntity<RecordDtos.RecordDto> create(@Valid @RequestBody RecordDtos.CreateRecordRequest request) {
        RecordDtos.RecordDto created = recordService.createRecord(SecurityUtils.currentUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public RecordDtos.RecordDto update(@PathVariable Long id,
                                       @Valid @RequestBody RecordDtos.UpdateRecordRequest request) {
        // Only the owning patient may edit; doctors add new records instead.
        return recordService.updateRecord(SecurityUtils.currentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recordService.deleteRecord(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    // --- Documents attached to a record -----------------------------------

    @PostMapping("/{id}/documents")
    public ResponseEntity<RecordDtos.DocumentDto> uploadDocument(@PathVariable Long id,
                                                                 @RequestParam("file") MultipartFile file) {
        RecordDtos.DocumentDto document = documentService.upload(SecurityUtils.currentUserId(), id, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(document);
    }

    @GetMapping("/{id}/documents")
    public List<RecordDtos.DocumentDto> listDocuments(@PathVariable Long id) {
        return documentService.listForRecord(SecurityUtils.currentUserId(), id);
    }
}