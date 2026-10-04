package com.medhelp.domain.enums;

/**
 * The five structured record types supported by the MVP.
 *
 * <p>Each value maps onto exactly one {@link RecordCategory} for consent
 * purposes, so a patient can grant access to "Diagnostic Reports" without
 * exposing anything else.
 */
public enum RecordType {
    CONSULTATION(RecordCategory.CONSULTATIONS, "Consultation"),
    PRESCRIPTION(RecordCategory.PRESCRIPTIONS, "Prescription"),
    DIAGNOSTIC_REPORT(RecordCategory.DIAGNOSTIC_REPORTS, "Diagnostic Report"),
    ALLERGY(RecordCategory.ALLERGIES, "Allergy"),
    MEDICAL_HISTORY(RecordCategory.MEDICAL_HISTORY, "Medical History");

    private final RecordCategory category;
    private final String label;

    RecordType(RecordCategory category, String label) {
        this.category = category;
        this.label = label;
    }

    public RecordCategory category() {
        return category;
    }

    public String label() {
        return label;
    }
}