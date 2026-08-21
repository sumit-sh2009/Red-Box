import React, { createContext, useContext, useState, useCallback } from 'react';
import { PixelIcon } from '../components/PixelIcon.js';
import { sound } from '../utils/sound.js';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  dismissing?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type === 'success') {
      sound.playNotification();
    } else if (type === 'error') {
      sound.playDelete();
    } else {
      sound.playClick();
    }

    setTimeout(() => {
      dismissToast(id);
    }, 3200);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toast-countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      {/* Toast Render Overlay */}
      <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative overflow-hidden pointer-events-auto flex items-center gap-3 p-3.5 border border-retro-border rounded-[3px] shadow-pixel-sm font-body text-sm leading-relaxed select-none ${
              toast.dismissing ? 'animate-slide-out' : 'animate-slide-in'
            } ${
              toast.type === 'error'
                ? 'bg-retro-danger text-white'
                : toast.type === 'info'
                ? 'bg-retro-accent text-black'
                : 'bg-retro-card text-retro-text border-retro-primary'
            }`}
          >
            {toast.type === 'error' ? (
              <PixelIcon name="close" size={16} color="#ffffff" />
            ) : toast.type === 'info' ? (
              <PixelIcon name="sparkles" size={16} color="#000000" />
            ) : (
              <PixelIcon name="check" size={16} color="var(--color-primary)" />
            )}
            <span className="flex-1 break-words">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 opacity-70 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Dismiss notification"
            >
              <PixelIcon
                name="close"
                size={12}
                color={
                  toast.type === 'error'
                    ? '#ffffff'
                    : toast.type === 'info'
                    ? '#000000'
                    : 'var(--color-text)'
                }
              />
            </button>
            {/* Progress / Countdown Bar */}
            <div
              className={`absolute bottom-0 left-0 h-1 ${
                toast.type === 'error'
                  ? 'bg-white/40'
                  : toast.type === 'info'
                  ? 'bg-black/30'
                  : 'bg-retro-primary/50'
              }`}
              style={{
                animation: 'toast-countdown 3200ms steps(32) forwards',
              }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
