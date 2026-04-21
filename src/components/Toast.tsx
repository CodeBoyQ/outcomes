import React from 'react';
import { useStore } from '../store/useStore';

export const Toast: React.FC = () => {
  const toastMessage = useStore((s) => s.toastMessage);
  if (!toastMessage) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg z-50 animate-fade-in">
      {toastMessage}
    </div>
  );
};
