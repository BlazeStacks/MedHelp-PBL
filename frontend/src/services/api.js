import axios from 'axios';
const ACCESS_TOKEN_KEY = 'medhelp.accessToken';
const REFRESH_TOKEN_KEY = 'medhelp.refreshToken';
const USER_KEY = 'medhelp.user';
export const tokenStore = {
    getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
    getUser: () => {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    save(auth) {
        localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    },
    clear() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
    const token = tokenStore.getAccess();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
/**
 * On a 401 we try exactly one silent refresh, then replay the original request.
 * A shared promise ensures concurrent 401s trigger a single refresh call rather
 * than a stampede that would invalidate the rotated refresh token.
 */
let refreshPromise = null;
async function refreshAccessToken() {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken)
        return null;
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`, { refreshToken });
        tokenStore.save(response.data);
        return response.data.accessToken;
    }
    catch {
        tokenStore.clear();
        return null;
    }
}
api.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
        original._retried = true;
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;
        if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
        }
        // Session is unrecoverable — bounce to login, preserving where they were.
        if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
/** Normalises any axios failure into a predictable ApiError. */
export function toApiError(error) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        return {
            status: error.response?.status ?? 0,
            message: data?.message ??
                (error.code === 'ERR_NETWORK'
                    ? 'Cannot reach the server. Is the backend running?'
                    : 'Something went wrong. Please try again.'),
            fieldErrors: data?.fieldErrors,
        };
    }
    return { status: 0, message: 'Something went wrong. Please try again.' };
}
/**
 * Downloads a protected file by fetching it with the auth header and saving the
 * blob. A plain <a href> would not carry the bearer token, which is exactly why
 * documents are not exposed as public URLs.
 */
export async function downloadProtectedFile(url, fileName) {
    const response = await api.get(url.replace(/^\/api/, ''), { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
}
/** Opens a protected file in a new tab for inline viewing. */
export async function openProtectedFile(url) {
    const response = await api.get(url.replace(/^\/api/, ''), { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(response.data);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    // Give the new tab a moment to load before releasing the object URL.
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
}
