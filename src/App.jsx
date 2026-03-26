import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Footer from './components/Layout/Footer';
import './App.css';

function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <div className="app-loading-logo">🛠️</div>
                <LoadingSpinner text="Initializing..." />
            </div>
        );
    }

    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <AppContent />
                    <Footer />
                </div>
            </ToastProvider>
        </AuthProvider>
    );
}
