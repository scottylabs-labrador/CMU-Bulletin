// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  throw new Error("VITE_FIREBASE_API_KEY is not defined. Please check your .env.local file.");
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "cmu-bulletin.firebaseapp.com",
  databaseURL: "https://cmu-bulletin-default-rtdb.firebaseio.com",
  projectId: "cmu-bulletin",
  storageBucket: "cmu-bulletin.firebasestorage.app",
  messagingSenderId: "905377187225",
  appId: "1:905377187225:web:75a2a9e62922a948c93f08",
  measurementId: "G-5ZD2QBFJZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export function parseUserName(name) {
  const trimmed = name.trim();
  const nameParts = trimmed.split(/\s+/);

  return {
    name: trimmed,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
  };
}

export function getUserDisplayName(userData) {
  if (!userData) return 'Unknown';
  if (userData.name) return userData.name;

  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');
  return fullName || 'Unknown';
}

export async function createUserProfile(user, { name, email }) {
  const profile = parseUserName(name);

  await updateProfile(user, { displayName: profile.name });
  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    email,
    createdAt: new Date().toISOString(),
  });
}

export { app, auth, db, storage };
