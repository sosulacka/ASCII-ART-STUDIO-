import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: number) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 4500;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration);

    const removeTimer = setTimeout(() => {
      onClose(toast.id);
    }, duration + 500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <XCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div 
      className={`toast toast--${toast.type} ${isExiting ? 'toast--exit' : ''}`}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 300);
      }}
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">
        {toast.message}
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: {
  toasts: ToastData[];
  onClose: (id: number) => void;
}) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
