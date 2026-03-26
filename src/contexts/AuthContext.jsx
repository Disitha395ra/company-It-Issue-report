import { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [empNo, setEmpNo] = useState(localStorage.getItem('empNo') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    empNo: localStorage.getItem('empNo') || '',
                });
            } else {
                setUser(null);
                setEmpNo('');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (employeeNumber, email) => {
        setError('');
        setLoading(true);
        try {
            if (!auth) throw new Error("Firebase Auth is not configured.");
            // Use Employee Number as password
            const password = employeeNumber;
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem('empNo', employeeNumber);
            setEmpNo(employeeNumber);
            setUser({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                empNo: employeeNumber,
            });
            return userCredential.user;
        } catch (err) {
            let message = 'Login failed. Please try again.';
            switch (err.code) {
                case 'auth/user-not-found':
                    message = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address format.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/invalid-credential':
                    message = 'Invalid credentials. Please check your email and password.';
                    break;
                default:
                    message = err.message || message;
            }
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('empNo');
            setUser(null);
            setEmpNo('');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const clearError = () => setError('');

    const value = {
        user,
        empNo,
        loading,
        error,
        login,
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
