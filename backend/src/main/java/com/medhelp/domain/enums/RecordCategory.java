package com.medhelp.domain.enums;

/**
 * Categories of medical information a patient can share with a doctor.
 *
 * <p>These values are the contract between the consent UI, the access grant
 * permissions and the backend authorization checks. Adding a value here makes
 * it shareable without touching the authorization logic.
 */
public enum RecordCategory {
    CONSULTATIONS,
    PRESCRIPTIONS,
    DIAGNOSTIC_REPORTS,
    ALLERGIES,
    MEDICAL_HISTORY
}