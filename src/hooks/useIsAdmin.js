import { useEffect, useState } from 'react';
import { checkIsAdmin } from '../utils/adminAuth';

/**
 * Resolves whether the current Firebase user is on the admins list.
 * status: 'loading' | 'yes' | 'no' | 'signed-out'
 */
export function useIsAdmin(user) {
  const [status, setStatus] = useState(user === undefined ? 'loading' : user ? 'loading' : 'signed-out');

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setStatus('signed-out');
      return undefined;
    }

    setStatus('loading');
    checkIsAdmin(user).then((isAdmin) => {
      if (!cancelled) setStatus(isAdmin ? 'yes' : 'no');
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return {
    isAdmin: status === 'yes',
    isLoading: status === 'loading',
    isSignedOut: status === 'signed-out',
    status,
  };
}
