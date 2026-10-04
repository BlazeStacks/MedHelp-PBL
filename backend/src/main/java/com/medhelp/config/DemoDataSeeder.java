package com.medhelp.config;

import com.medhelp.domain.entity.*;
import com.medhelp.domain.enums.*;
import com.medhelp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Creates fake demo accounts and records so the presentation starts with a
 * populated, realistic-looking patient file.
 *
 * <p>All data here is invented. It only runs when {@code SEED_DEMO_DATA=true}
 * and the database is empty, so it never overwrites real work.
 */
@Configuration
@ConditionalOnProperty(name = "medhelp.seed-demo-data", havingValue = "true")
public class DemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** Shared password for every demo account, shown on the login screen. */
    public static final String DEMO_PASSWORD = "Demo@1234";

    @Bean
    ApplicationRunner seedDemoData(UserRepository users,
                                   PatientProfileRepository patientProfiles,
                                   DoctorProfileRepository doctorProfiles,
                                   MedicalRecordRepository records,
                                   AccessGrantRepository accessGrants,
                                   PasswordEncoder passwordEncoder) {
        return args -> seed(users, patientProfiles, doctorProfiles, records, accessGrants, passwordEncoder);
    }

    @Transactional
    void seed(UserRepository users,
              PatientProfileRepository patientProfiles,
              DoctorProfileRepository doctorProfiles,
              MedicalRecordRepository records,
              AccessGrantRepository accessGrants,
              PasswordEncoder passwordEncoder) {

        if (users.count() > 0) {
            log.info("Demo seed skipped: users already exist");
            return;
        }

        log.info("Seeding demo data (password for all demo accounts: {})", DEMO_PASSWORD);

        // --- Patient -------------------------------------------------------
        User aryan = newUser(users, passwordEncoder, "Aryan Mehta", "patient@demo.com", Role.PATIENT, "9876543210");
        PatientProfile aryanProfile = new PatientProfile();
        aryanProfile.setUser(aryan);
        aryanProfile.setDateOfBirth(LocalDate.of(2003, 4, 12));
        aryanProfile.setGender("Male");
        aryanProfile.setBloodGroup("B+");
        aryanProfile.setAddress("12 Rose Avenue, Pune, Maharashtra");
        aryanProfile.setEmergencyContact("Meera Mehta (Mother) - 9812345678");
        aryanProfile.setKnownConditions("Seasonal allergic rhinitis");
        patientProfiles.save(aryanProfile);

        // A second patient so the doctor's search screen has more than one hit.
        User priya = newUser(users, passwordEncoder, "Priya Nair", "priya@demo.com", Role.PATIENT, "9811122233");
        PatientProfile priyaProfile = new PatientProfile();
        priyaProfile.setUser(priya);
        priyaProfile.setDateOfBirth(LocalDate.of(1996, 11, 2));
        priyaProfile.setGender("Female");
        priyaProfile.setBloodGroup("O+");
        priyaProfile.setAddress("44 Lake View Road, Bengaluru, Karnataka");
        priyaProfile.setKnownConditions("Hypothyroidism");
        patientProfiles.save(priyaProfile);

        // --- Doctors -------------------------------------------------------
        User sharma = newUser(users, passwordEncoder, "Dr. Rohan Sharma", "doctor@demo.com", Role.DOCTOR, "9765432109");
        DoctorProfile sharmaProfile = new DoctorProfile();
        sharmaProfile.setUser(sharma);
        sharmaProfile.setSpecialization("General Medicine");
        sharmaProfile.setHospital("Sunrise Multispeciality Hospital, Pune");
        sharmaProfile.setRegistrationNumber("MCI-2011-45872");
        sharmaProfile.setYearsOfExperience(13);
        sharmaProfile.setBio("General physician focusing on preventive care and chronic disease management.");
        sharmaProfile.setVerified(true);
        doctorProfiles.save(sharmaProfile);

        User iyer = newUser(users, passwordEncoder, "Dr. Ananya Iyer", "ananya@demo.com", Role.DOCTOR, "9700011122");
        DoctorProfile iyerProfile = new DoctorProfile();
        iyerProfile.setUser(iyer);
        iyerProfile.setSpecialization("Cardiology");
        iyerProfile.setHospital("City Heart Institute, Mumbai");
        iyerProfile.setRegistrationNumber("MCI-2014-77310");
        iyerProfile.setYearsOfExperience(9);
        doctorProfiles.save(iyerProfile);

        // --- Aryan's medical file -----------------------------------------

        // Medical history (a category the demo deliberately does NOT share).
        MedicalRecord asthma = record(records, aryan, aryan, RecordType.MEDICAL_HISTORY,
                LocalDate.of(2015, 6, 10), "Childhood asthma, managed with inhalers. No attacks since 2021.");
        asthma.setConditionName("Asthma");
        asthma.setCurrentStatus("Resolved / controlled");
        asthma.setConditionYear(2015);
        asthma.setTreatment("Salbutamol inhaler as needed");
        records.save(asthma);

        MedicalRecord thyroid = record(records, aryan, aryan, RecordType.MEDICAL_HISTORY,
                LocalDate.of(2023, 2, 18), "Under annual review.");
        thyroid.setConditionName("Hypothyroidism");
        thyroid.setCurrentStatus("Ongoing");
        thyroid.setConditionYear(2023);
        thyroid.setTreatment("Levothyroxine 50 mcg daily");
        records.save(thyroid);

        // Allergy
        MedicalRecord allergy = record(records, aryan, aryan, RecordType.ALLERGY,
                LocalDate.of(2022, 8, 4), "Avoid penicillin-class antibiotics.");
        allergy.setAllergen("Penicillin");
        allergy.setReaction("Widespread urticaria and facial swelling");
        allergy.setSeverity(Severity.SEVERE);
        records.save(allergy);

        MedicalRecord dustAllergy = record(records, aryan, aryan, RecordType.ALLERGY,
                LocalDate.of(2021, 3, 12), "Worse during winter months.");
        dustAllergy.setAllergen("House dust mite");
        dustAllergy.setReaction("Sneezing, watery eyes");
        dustAllergy.setSeverity(Severity.MILD);
        records.save(dustAllergy);

        // Diagnostic reports
        MedicalRecord mri = record(records, aryan, aryan, RecordType.DIAGNOSTIC_REPORT,
                LocalDate.of(2026, 8, 10), "No disc herniation. Mild muscle spasm noted.");
        mri.setTestName("MRI - Lumbar Spine");
        mri.setFacility("Nova Diagnostics, Pune");
        mri.setDoctorName("Dr. Rohan Sharma");
        mri.setResultSummary("Mild L4-L5 disc bulge without nerve root compression. No surgical indication.");
        records.save(mri);

        MedicalRecord cbc = record(records, aryan, aryan, RecordType.DIAGNOSTIC_REPORT,
                LocalDate.of(2026, 9, 12), "Routine annual screening.");
        cbc.setTestName("Complete Blood Count");
        cbc.setFacility("Nova Diagnostics, Pune");
        cbc.setDoctorName("Dr. Rohan Sharma");
        cbc.setResultSummary("Hemoglobin 13.8 g/dL, WBC 7200 /uL, Platelets 245000 /uL. All values within range.");
        records.save(cbc);

        // Prescription from an earlier visit
        MedicalRecord oldPrescription = record(records, aryan, aryan, RecordType.PRESCRIPTION,
                LocalDate.of(2026, 8, 30), "Complete the full course. Review in two weeks.");
        oldPrescription.setDoctorName("Dr. Rohan Sharma");
        oldPrescription.addMedicine(medicine("Ibuprofen", "400 mg", "Twice daily", "5 days", "Take after food"));
        oldPrescription.addMedicine(medicine("Pantoprazole", "40 mg", "Once daily", "5 days", "Take before breakfast"));
        records.save(oldPrescription);

        // Consultations
        MedicalRecord consultation = record(records, aryan, aryan, RecordType.CONSULTATION,
                LocalDate.of(2026, 9, 25), "Advised rest, hydration and physiotherapy.");
        consultation.setSymptoms("Lower back pain for 3 weeks, worse on sitting");
        consultation.setDiagnosis("Mechanical low back pain");
        consultation.setTreatment("Physiotherapy 3x per week, ergonomic correction, analgesics as needed");
        consultation.setFacility("Sunrise Multispeciality Hospital, Pune");
        consultation.setDoctorName("Dr. Rohan Sharma");
        records.save(consultation);

        MedicalRecord fever = record(records, aryan, aryan, RecordType.CONSULTATION,
                LocalDate.of(2026, 6, 14), "Advised rest and fluids. Blood test ordered.");
        fever.setSymptoms("Fever 101F, sore throat, body ache for 2 days");
        fever.setDiagnosis("Viral upper respiratory tract infection");
        fever.setTreatment("Symptomatic treatment; paracetamol and warm saline gargles");
        fever.setFacility("Sunrise Multispeciality Hospital, Pune");
        fever.setDoctorName("Dr. Rohan Sharma");
        records.save(fever);

        // --- Priya's file (one record so her timeline is not empty) ---------
        MedicalRecord priyaRecord = record(records, priya, priya, RecordType.MEDICAL_HISTORY,
                LocalDate.of(2024, 5, 20), "Annual thyroid panel review.");
        priyaRecord.setConditionName("Hypothyroidism");
        priyaRecord.setCurrentStatus("Ongoing");
        priyaRecord.setConditionYear(2022);
        priyaRecord.setTreatment("Levothyroxine 75 mcg daily");
        records.save(priyaRecord);

        // --- One pending access request so the approval screen is populated --
        AccessGrant pending = new AccessGrant();
        pending.setPatient(aryan);
        pending.setDoctor(sharma);
        pending.setStatus(AccessStatus.PENDING);
        pending.setReason("Reviewing your recent blood test and back pain consultation before the follow-up visit.");
        accessGrants.save(pending);

        log.info("Demo seed complete: {} users, {} records", users.count(), records.count());
    }

    private User newUser(UserRepository users, PasswordEncoder encoder, String name, String email,
                         Role role, String phone) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setPhone(phone);
        user.setPasswordHash(encoder.encode(DEMO_PASSWORD));
        return users.save(user);
    }

    private MedicalRecord record(MedicalRecordRepository records, User patient, User createdBy,
                                 RecordType type, LocalDate date, String notes) {
        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setCreatedBy(createdBy);
        record.setType(type);
        record.setRecordDate(date);
        record.setNotes(notes);
        return record;
    }

    private PrescriptionMedicine medicine(String name, String dosage, String frequency,
                                          String duration, String instructions) {
        PrescriptionMedicine medicine = new PrescriptionMedicine();
        medicine.setName(name);
        medicine.setDosage(dosage);
        medicine.setFrequency(frequency);
        medicine.setDuration(duration);
        medicine.setInstructions(instructions);
        return medicine;
    }
}