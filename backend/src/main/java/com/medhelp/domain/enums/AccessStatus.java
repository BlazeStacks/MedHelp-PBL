package com.medhelp.domain.enums;

/**
 * Lifecycle of an access grant.
 *
 * <p>PENDING is created when a doctor asks for access. The patient then either
 * APPROVEs or DENIEs it. An approved grant stays active until the patient
 * REVOKEs it or the backend marks it EXPIRED once {@code expiresAt} passes.
 */
public enum AccessStatus {
    PENDING,
    APPROVED,
    DENIED,
    REVOKED,
    EXPIRED
}