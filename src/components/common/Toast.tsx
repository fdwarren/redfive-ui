import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastClass = () => {
    const baseClass = 'toast-notification';
    const typeClass = {
      success: 'toast-success',
      error: 'toast-error',
      info: 'toast-info'
    }[type];
    
    return `${baseClass} ${typeClass} ${isAnimating ? 'toast-show' : 'toast-hide'}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle-fill me-2"></i>;
      case 'error':
        return <i className="bi bi-exclamation-triangle-fill me-2"></i>;
      case 'info':
        return <i className="bi bi-info-circle-fill me-2"></i>;
      default:
        return null;
    }
  };

  return (
    <div className={getToastClass()}>
      <div className="toast-content">
        {getIcon()}
        <span>{message}</span>
        <button 
          className="toast-close" 
          onClick={onClose}
          type="button"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;

