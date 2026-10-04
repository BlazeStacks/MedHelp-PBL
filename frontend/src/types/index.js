/**
 * Shared UI labels and constants for the consent categories and record types.
 * Kept in one file so every page renders the same wording.
 */
/** Human labels for the consent categories shown in the approval UI. */
export const CATEGORY_LABELS = {
    CONSULTATIONS: 'Consultation History',
    PRESCRIPTIONS: 'Prescriptions',
    DIAGNOSTIC_REPORTS: 'Diagnostic Reports',
    ALLERGIES: 'Allergies',
    MEDICAL_HISTORY: 'Medical History',
};
export const CATEGORY_DESCRIPTIONS = {
    CONSULTATIONS: 'Symptoms, diagnoses and treatments from past visits',
    PRESCRIPTIONS: 'Medicines prescribed to you, with dosage and duration',
    DIAGNOSTIC_REPORTS: 'Blood tests, scans, MRI and other lab reports',
    ALLERGIES: 'Known allergens, reactions and severity',
    MEDICAL_HISTORY: 'Long-term conditions and their current status',
};
export const ALL_CATEGORIES = [
    'CONSULTATIONS',
    'PRESCRIPTIONS',
    'DIAGNOSTIC_REPORTS',
    'ALLERGIES',
    'MEDICAL_HISTORY',
];
export const DURATION_LABELS = {
    ONE_HOUR: '1 hour',
    TWENTY_FOUR_HOURS: '24 hours',
    SEVEN_DAYS: '7 days',
    THIRTY_DAYS: '30 days',
};
export const RECORD_TYPE_LABELS = {
    CONSULTATION: 'Consultation',
    PRESCRIPTION: 'Prescription',
    DIAGNOSTIC_REPORT: 'Diagnostic Report',
    ALLERGY: 'Allergy',
    MEDICAL_HISTORY: 'Medical History',
};
