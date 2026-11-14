import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/** Normalize an email for the admins/<email> document id. */
export function normalizeAdminEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Returns true when the signed-in user has a matching admins/<email> doc
 * and a verified email. Doc ids are lowercase emails (not Firebase UIDs).
 */
export async function checkIsAdmin(user) {
  if (!user?.email || !user.emailVerified) return false;

  const email = normalizeAdminEmail(user.email);
  if (!email) return false;

  // Firebase Auth usually lowercases emails, but the admins doc id is always lowercase.
  // Prefer the exact Auth token email when it already matches the normalized form.
  const docId = user.email === email ? user.email : email;

  try {
    const snap = await getDoc(doc(db, 'admins', docId));
    if (snap.exists()) return true;

    // Retry with forced lowercase if Auth preserved mixed case.
    if (docId !== email) {
      const lowerSnap = await getDoc(doc(db, 'admins', email));
      return lowerSnap.exists();
    }
    return false;
  } catch (err) {
    console.error('Admin check failed:', err);
    return false;
  }
}
