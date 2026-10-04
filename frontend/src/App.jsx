import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { RequireAuth, RequireRole } from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/ui/Feedback';
// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
// Patient
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import PatientTimelinePage from './pages/patient/PatientTimelinePage';
import PatientDoctorsPage from './pages/patient/PatientDoctorsPage';
import PatientAccessHistoryPage from './pages/patient/PatientAccessHistoryPage';
import PatientUploadPage from './pages/patient/PatientUploadPage';
import PatientNotificationsPage from './pages/patient/PatientNotificationsPage';
import PatientSettingsPage from './pages/patient/PatientSettingsPage';
import { PatientAllergiesPage, PatientHistoryPage, PatientPrescriptionsPage, PatientReportsPage, } from './pages/patient/categoryPages';
// Doctor
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorRequestsPage from './pages/doctor/DoctorRequestsPage';
import DoctorAuthorizedPage from './pages/doctor/DoctorAuthorizedPage';
import DoctorPatientRecordsPage from './pages/doctor/DoctorPatientRecordsPage';
import DoctorAccessHistoryPage from './pages/doctor/DoctorAccessHistoryPage';
import DoctorSettingsPage from './pages/doctor/DoctorSettingsPage';
import { DoctorPrescriptionsPage, DoctorRecordsPage, DoctorTreatmentsPage } from './pages/doctor/doctorLists';
/** Sends "/" to the right home for the signed-in role. */
function HomeRedirect() {
    const { user, loading, isAuthenticated } = useAuth();
    if (loading)
        return <PageLoader />;
    if (!isAuthenticated || !user)
        return <Navigate to="/login" replace/>;
    return <Navigate to={user.role === 'PATIENT' ? '/patient' : '/doctor'} replace/>;
}
export default function App() {
    return (<Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />}/>

      {/* Authenticated shell */}
      <Route element={<RequireAuth />}>
        {/* Patient */}
        <Route element={<RequireRole role="PATIENT"/>}>
          <Route path="/patient" element={<AppLayout />}>
            <Route index element={<PatientDashboardPage />}/>
            <Route path="timeline" element={<PatientTimelinePage />}/>
            <Route path="history" element={<PatientHistoryPage />}/>
            <Route path="prescriptions" element={<PatientPrescriptionsPage />}/>
            <Route path="reports" element={<PatientReportsPage />}/>
            <Route path="allergies" element={<PatientAllergiesPage />}/>
            <Route path="doctors" element={<PatientDoctorsPage />}/>
            <Route path="access-history" element={<PatientAccessHistoryPage />}/>
            <Route path="upload" element={<PatientUploadPage />}/>
            <Route path="notifications" element={<PatientNotificationsPage />}/>
            <Route path="settings" element={<PatientSettingsPage />}/>
          </Route>
        </Route>

        {/* Doctor */}
        <Route element={<RequireRole role="DOCTOR"/>}>
          <Route path="/doctor" element={<AppLayout />}>
            <Route index element={<DoctorDashboardPage />}/>
            <Route path="patients" element={<DoctorPatientsPage />}/>
            <Route path="patients/:patientId" element={<DoctorPatientRecordsPage />}/>
            <Route path="requests" element={<DoctorRequestsPage />}/>
            <Route path="authorized" element={<DoctorAuthorizedPage />}/>
            <Route path="records" element={<DoctorRecordsPage />}/>
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />}/>
            <Route path="treatments" element={<DoctorTreatmentsPage />}/>
            <Route path="access-history" element={<DoctorAccessHistoryPage />}/>
            <Route path="settings" element={<DoctorSettingsPage />}/>
          </Route>
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<HomeRedirect />}/>
      <Route path="*" element={<HomeRedirect />}/>
    </Routes>);
}
