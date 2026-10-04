import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/Feedback';
/**
 * Client-side guards are for navigation only.
 *
 * <p>Redirecting a patient away from a doctor page is a UX nicety, not a
 * security boundary: the backend rejects the underlying API calls regardless
 * of what the browser renders.
 */
export function RequireAuth() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading)
        return <PageLoader />;
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    }
    return <Outlet />;
}
export function RequireRole({ role }) {
    const { user, loading } = useAuth();
    if (loading)
        return <PageLoader />;
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    if (user.role !== role) {
        // Send them to their own home rather than showing a dead end.
        return <Navigate to={user.role === 'PATIENT' ? '/patient' : '/doctor'} replace/>;
    }
    return <Outlet />;
}
