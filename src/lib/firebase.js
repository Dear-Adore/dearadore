import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "dearadoredb",
  appId: "1:586295331421:web:cde0593a9e72c0778b5bb4",
  storageBucket: "dearadoredb.firebasestorage.app",
  apiKey: "AIzaSyDqHLTMwZRoDLJn248kwDRF60LE_NCVX_M",
  authDomain: "dearadoredb.firebaseapp.com",
  messagingSenderId: "586295331421",
  measurementId: "G-R9QBQSLZ8X"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
