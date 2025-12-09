import React, { useEffect, useState } from 'react';

export type AlertType = 'critical' | 'warning' | 'info' | 'death' | 'starvation';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: number;
}

interface AlertNotificationProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ alerts, onDismiss }) => {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setVisibleAlerts(alerts);
  }, [alerts]);

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-900/95',
          border: 'border-red-500',
          text: 'text-red-100',
          icon: '🚨',
        };
      case 'death':
        return {
          bg: 'bg-black/95',
          border: 'border-red-700',
          text: 'text-red-200',
          icon: '💀',
        };
      case 'starvation':
        return {
          bg: 'bg-orange-900/95',
          border: 'border-orange-500',
          text: 'text-orange-100',
          icon: '🍞',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-900/95',
          border: 'border-yellow-500',
          text: 'text-yellow-100',
          icon: '⚠️',
        };
      case 'info':
        return {
          bg: 'bg-blue-900/95',
          border: 'border-blue-500',
          text: 'text-blue-100',
          icon: 'ℹ️',
        };
    }
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {visibleAlerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={`${styles.bg} ${styles.text} border-2 ${styles.border} rounded-lg shadow-2xl p-4 animate-slide-in-right`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-shrink-0 text-3xl">{styles.icon}</div>
              <div className="flex-grow">
                <h3 className="font-bold text-lg mb-1">{alert.title}</h3>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
              <button
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 text-xl opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertNotification;
