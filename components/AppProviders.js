'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ── Points (shared balance/streak so the header badge updates immediately
// after any page earns or spends points) ──
const PointsContext = createContext({ balance: null, streak: null, refresh: async () => {} });

export function usePoints() {
  return useContext(PointsContext);
}

function PointsProvider({ children }) {
  const [balance, setBalance] = useState(null);
  const [streak, setStreak] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/points');
      if (!res.ok) return null;
      const data = await res.json();
      setBalance(data.balance);
      setStreak(data.streak);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <PointsContext.Provider value={{ balance, streak, refresh }}>{children}</PointsContext.Provider>;
}

// ── Toasts ──
const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default function AppProviders({ children }) {
  return (
    <PointsProvider>
      <ToastProvider>{children}</ToastProvider>
    </PointsProvider>
  );
}
