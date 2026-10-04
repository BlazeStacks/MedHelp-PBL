package com.medhelp.controller;

import com.medhelp.security.SecurityUtils;
import com.medhelp.service.DocumentService;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

/**
 * Serves medical documents.
 *
 * <p>Files are never exposed at a public URL. Every request is authorized
 * first (patient ownership, or a live doctor grant covering the record's
 * category), the read is audited, and the response is marked
 * {@code no-store} so nothing is cached on shared machines.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    /** Streams the file for in-browser viewing. */
    @GetMapping("/{id}/content")
    public ResponseEntity<byte[]> view(@PathVariable Long id) {
        return respond(documentService.download(SecurityUtils.currentUserId(), id, true), false);
    }

    /** Forces a download with the original filename. */
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        return respond(documentService.download(SecurityUtils.currentUserId(), id, false), true);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<byte[]> respond(DocumentService.DocumentPayload payload, boolean attachment) {
        MediaType mediaType = payload.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(payload.contentType());

        ContentDisposition disposition = (attachment
                ? ContentDisposition.attachment()
                : ContentDisposition.inline())
                .filename(payload.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(payload.content());
    }
}