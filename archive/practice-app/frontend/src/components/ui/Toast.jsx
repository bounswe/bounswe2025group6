import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import '../../styles/Toast.css'; // import the new CSS

// Context
const ToastContext = createContext(null);

// Single Toast Component
const Toast = ({
  message,
  type = 'success',
  onClose,
  duration = 3000
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // for CSS transition
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration, onClose]);

  const typeClass = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info'
  }[type] || 'toast-success';

  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  return (
    <div className={`toast-container ${typeClass} ${visible ? 'show' : 'hide'}`}>
      <div className="toast-content">
        <span className="toast-icon">{icon}</span>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, options) => addToast({ message, type: 'success', ...options }),
    error: (message, options) => addToast({ message, type: 'error', ...options }),
    warning: (message, options) => addToast({ message, type: 'warning', ...options }),
    info: (message, options) => addToast({ message, type: 'info', ...options })
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-wrapper">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
};

export default Toast;