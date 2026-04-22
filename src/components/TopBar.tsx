import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const TopBar: React.FC = () => {
  const saveStatus   = useStore((s) => s.saveStatus);
  const pages        = useStore((s) => s.pages);
  const currentPageId = useStore((s) => s.currentPageId);
  const updatePageName = useStore((s) => s.updatePageName);

  const currentPage = pages.find((p) => p.id === currentPageId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditing(false);
  }, [currentPageId]);

  const startEdit = () => {
    setDraft(currentPage?.name ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const name = draft.trim();
    setEditing(false);
    if (name && currentPageId && name !== currentPage?.name) {
      updatePageName(currentPageId, name);
    }
  };

  const statusEl = () => {
    if (saveStatus === 'saving') return <span style={{ color: '#D97706', fontSize: 13 }}>Saving…</span>;
    if (saveStatus === 'saved')  return <span style={{ color: '#16A34A', fontSize: 13 }}>Saved ✓</span>;
    if (saveStatus === 'error')  return <span style={{ color: '#DC2626', fontSize: 13 }}>Error saving</span>;
    return null;
  };

  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid #E8E2D9',
        background: '#F5F2EE',
        zIndex: 10,
        flexShrink: 0,
        gap: 8,
      }}
    >
      {/* Left: brand + page name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: '#3A3530', fontSize: 16, letterSpacing: '-0.01em', flexShrink: 0 }}>
          Outcomer
        </span>

        {currentPage && (
          <>
            <span style={{ color: '#C8BFB4', fontSize: 14, flexShrink: 0 }}>/</span>
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
                style={{
                  border: 'none',
                  outline: '1px solid #C8BFB4',
                  borderRadius: 4,
                  fontSize: 14,
                  color: '#3A3530',
                  background: 'white',
                  padding: '2px 6px',
                  minWidth: 80,
                  maxWidth: 220,
                }}
                autoFocus
              />
            ) : (
              <span
                onClick={startEdit}
                title="Click to rename"
                style={{
                  fontSize: 14,
                  color: '#9A9490',
                  cursor: 'text',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}
              >
                {currentPage.name}
              </span>
            )}
          </>
        )}
      </div>

      {/* Right: save status */}
      <div style={{ flexShrink: 0 }}>{statusEl()}</div>
    </div>
  );
};
