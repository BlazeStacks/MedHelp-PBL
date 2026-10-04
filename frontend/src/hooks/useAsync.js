import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError } from '../services/api';
/**
 * Runs an async loader and tracks loading/error state.
 *
 * <p>Used by every page instead of a data-fetching library so the pattern stays
 * easy to read and explain. The ref guard prevents state updates after unmount.
 */
export function useAsync(loader, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nonce, setNonce] = useState(0);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await loader();
            if (mounted.current)
                setData(result);
        }
        catch (err) {
            if (mounted.current)
                setError(toApiError(err));
        }
        finally {
            if (mounted.current)
                setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, nonce]);
    useEffect(() => {
        void load();
    }, [load]);
    const reload = useCallback(() => setNonce((value) => value + 1), []);
    return { data, loading, error, reload, setData };
}
