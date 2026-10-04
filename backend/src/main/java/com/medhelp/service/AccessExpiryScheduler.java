package com.medhelp.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Closes out access grants whose time has run out.
 *
 * <p>Authorization never depends on this job: {@code AccessGrant#isLive()} also
 * checks the expiry, so a lapsed grant is unusable the moment it lapses. The
 * scheduler exists so the status column and the patient's audit history catch
 * up, which is what makes "access expired" visible in the UI.
 */
@Component
public class AccessExpiryScheduler {

    private final AccessGrantService accessGrantService;

    public AccessExpiryScheduler(AccessGrantService accessGrantService) {
        this.accessGrantService = accessGrantService;
    }

    /** Runs every five minutes, and once shortly after startup. */
    @Scheduled(initialDelay = 20_000, fixedDelay = 300_000)
    public void expireLapsedGrants() {
        accessGrantService.expireLapsedGrants();
    }
}