import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, title, message, duration = 5000) => {
        const id = ++toastIdCounter;
        setToasts((prev) => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (title, message) => addToast('success', title, message),
        error: (title, message) => addToast('error', title, message, 8000),
        info: (title, message) => addToast('info', title, message),
        warning: (title, message) => addToast('warning', title, message, 6000),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container" role="alert" aria-live="polite">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }) {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    };

    return (
        <div className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{icons[toast.type]}</span>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Close notification">
                ×
            </button>
            <div className="toast-progress"></div>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastProvider;
