import React, { createContext, useState, useContext, useCallback } from 'react';
import NotificationModal from '../components/NotificationModal';

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    message: null,
    type: 'success', // 'success', 'error', 'confirm'
    onConfirm: () => {},
  });

  const hideNotification = () => {
    setNotification({ message: null, type: 'success', onConfirm: () => {} });
  };

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type, onConfirm: () => {} });
  }, []);

  const showConfirmation = useCallback((message, onConfirmCallback) => {
    setNotification({
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirmCallback();
        hideNotification();
      },
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirmation }}>
      {children}
      {notification.message && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onConfirm={notification.onConfirm}
          onCancel={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};
