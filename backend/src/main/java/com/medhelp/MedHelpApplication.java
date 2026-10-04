package com.medhelp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the MedHelp backend.
 *
 * <p>Scheduling is enabled so that access grants can be expired in the
 * background (see {@code AccessExpiryScheduler}) instead of relying on the
 * frontend to stop showing records.
 */
@SpringBootApplication
@EnableScheduling
public class MedHelpApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedHelpApplication.class, args);
    }
}