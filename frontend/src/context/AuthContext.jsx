import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/apiEndpoints';
import { tokenStore } from '../services/api';
const AuthContext = createContext(null);
/**
 * Holds the signed-in identity.
 *
 * <p>The role here only drives which dashboard the router shows. It is never
 * treated as proof of permission — the backend re-checks every request, so a
 * patient who tampered with this state would still be refused by the API.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Restore the session from localStorage on first paint.
        setUser(tokenStore.getUser());
        setLoading(false);
    }, []);
    const login = useCallback(async (payload) => {
        const auth = await authApi.login(payload);
        tokenStore.save(auth);
        setUser(auth.user);
        return auth.user;
    }, []);
    const register = useCallback(async (payload) => {
        const auth = await authApi.register(payload);
        tokenStore.save(auth);
        setUser(auth.user);
        return auth.user;
    }, []);
    const logout = useCallback(async () => {
        const refreshToken = tokenStore.getRefresh() ?? undefined;
        try {
            await authApi.logout(refreshToken);
        }
        catch {
            // A failed logout call should still clear the local session.
        }
        tokenStore.clear();
        setUser(null);
    }, []);
    const value = useMemo(() => ({
        user,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
    }), [user, loading, login, register, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }
    return context;
}
