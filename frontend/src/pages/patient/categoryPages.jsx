import { PatientCategoryPage } from './PatientCategoryPage';
/** Prescriptions tab. */
export function PatientPrescriptionsPage() {
    return (<PatientCategoryPage type="PRESCRIPTION" title="Prescriptions" description="Medicines prescribed to you, with dosage, frequency and duration." addLabel="Add prescription" emptyTitle="No prescriptions yet" emptyMessage="Add a prescription with one or more medicines to keep a complete medication history."/>);
}
/** Diagnostic reports tab. */
export function PatientReportsPage() {
    return (<PatientCategoryPage type="DIAGNOSTIC_REPORT" title="Diagnostic Reports" description="Blood tests, scans and other investigations, with their results and reports." addLabel="Add report" emptyTitle="No diagnostic reports yet" emptyMessage="Add a test result and attach the PDF or image of the report so it is never lost."/>);
}
/** Allergies tab. */
export function PatientAllergiesPage() {
    return (<PatientCategoryPage type="ALLERGY" title="Allergies" description="Known allergens, the reactions they cause and how severe they are." addLabel="Add allergy" emptyTitle="No allergies recorded" emptyMessage="Recording allergies helps a doctor avoid prescribing something that could harm you."/>);
}
/** Medical history tab. */
export function PatientHistoryPage() {
    return (<PatientCategoryPage type="MEDICAL_HISTORY" title="Medical History" description="Long-term conditions and how they are currently managed." addLabel="Add condition" emptyTitle="No medical history yet" emptyMessage="Add ongoing or past conditions so a doctor has the full picture."/>);
}
