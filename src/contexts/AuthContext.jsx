import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from '../services/firebase';

const ALLOWED_DOMAIN = 'scot.lk';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const email = firebaseUser.email || '';
                const domain = email.split('@')[1];
                if (domain !== ALLOWED_DOMAIN) {
                    // Sign out unauthorized domain users immediately
                    signOut(auth);
                    setUser(null);
                    setError(`Access denied. Only @${ALLOWED_DOMAIN} accounts are allowed.`);
                } else {
                    setUser({
                        uid: firebaseUser.uid,
                        email: email,
                        displayName: firebaseUser.displayName || email.split('@')[0],
                        photoURL: firebaseUser.photoURL || null,
                    });
                    setError('');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            if (!auth) throw new Error('Firebase Auth is not configured.');
            const result = await signInWithPopup(auth, googleProvider);
            const email = result.user.email || '';
            const domain = email.split('@')[1];

            if (domain !== ALLOWED_DOMAIN) {
                await signOut(auth);
                const msg = `Access denied. Only @${ALLOWED_DOMAIN} email accounts are permitted.`;
                setError(msg);
                setLoading(false);
                throw new Error(msg);
            }

            return result.user;
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                // User cancelled — no error display
                setLoading(false);
                return;
            }
            const message = err.message || 'Google Sign-In failed. Please try again.';
            setError(message);
            setLoading(false);
            throw new Error(message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const clearError = () => setError('');

    const value = {
        user,
        loading,
        error,
        loginWithGoogle,
        logout,
        clearError,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
