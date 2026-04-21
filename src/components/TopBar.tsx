import React from 'react';
import { useStore } from '../store/useStore';

export const TopBar: React.FC = () => {
  const saveStatus = useStore((s) => s.saveStatus);

  const statusEl = () => {
    if (saveStatus === 'saving') return <span className="text-amber-600 text-sm">Saving...</span>;
    if (saveStatus === 'saved') return <span className="text-green-600 text-sm">Saved ✓</span>;
    if (saveStatus === 'error') return <span className="text-red-500 text-sm">Error saving</span>;
    return null;
  };

  return (
    <div className="h-12 flex items-center justify-between px-6 border-b border-stone-200 bg-[#F5F2EE] z-10">
      <span className="font-semibold text-stone-700 tracking-tight text-lg">Outcomer</span>
      <div>{statusEl()}</div>
    </div>
  );
};
