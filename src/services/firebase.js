import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy",
};

let app, auth;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export default app;
