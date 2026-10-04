package com.medhelp.domain.enums;

/** Every auditable action in the system, used by {@code audit_logs}. */
public enum AuditAction {
    REGISTER,
    LOGIN,
    ACCESS_REQUESTED,
    ACCESS_APPROVED,
    ACCESS_DENIED,
    ACCESS_REVOKED,
    ACCESS_EXPIRED,
    ACCESS_DENIED_BY_POLICY,
    RECORD_CREATED,
    RECORD_UPDATED,
    RECORD_DELETED,
    RECORD_VIEWED,
    DOCUMENT_UPLOADED,
    DOCUMENT_VIEWED,
    DOCUMENT_DOWNLOADED,
    PRESCRIPTION_CREATED
}