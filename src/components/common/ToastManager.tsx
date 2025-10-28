import React, { useEffect, useState } from 'react';
import { GlobalContext, type ToastNotification } from '../../services/GlobalContext';
import Toast from './Toast';

const ToastManager: React.FC = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const handleNotificationsChange = () => {
      setNotifications(GlobalContext.instance.getNotifications());
    };

    // Initial load
    handleNotificationsChange();

    // Subscribe to changes
    GlobalContext.instance.addNotificationsChangedListener(handleNotificationsChange);

    return () => {
      GlobalContext.instance.removeNotificationsChangedListener(handleNotificationsChange);
    };
  }, []);

  const handleToastClose = (id: string) => {
    GlobalContext.instance.removeNotification(id);
  };

  return (
    <>
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={() => handleToastClose(notification.id)}
          duration={notification.duration}
        />
      ))}
    </>
  );
};

export default ToastManager;

