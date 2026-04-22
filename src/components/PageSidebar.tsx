import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Page } from '../types/outcome';

const PageItem: React.FC<{
  page: Page;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}> = ({ page, isActive, onSelect, onRename, onDelete, canDelete }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(page.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const name = draft.trim() || page.name;
    setEditing(false);
    if (name !== page.name) onRename(name);
  };

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px 7px 16px',
        borderLeft: isActive ? '3px solid #3A3530' : '3px solid transparent',
        background: isActive ? '#F0EDE8' : 'transparent',
        cursor: 'pointer',
        borderRadius: '0 6px 6px 0',
        marginRight: 8,
        position: 'relative',
      }}
    >
      {/* Page icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
        <rect x="1" y="1" width="9" height="12" rx="1.5" stroke="#3A3530" strokeWidth="1.3" />
        <line x1="3.5" y1="4.5" x2="7.5" y2="4.5" stroke="#3A3530" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="3.5" y1="7" x2="7.5" y2="7" stroke="#3A3530" strokeWidth="1.1" strokeLinecap="round" />
        <line x1="3.5" y1="9.5" x2="6" y2="9.5" stroke="#3A3530" strokeWidth="1.1" strokeLinecap="round" />
      </svg>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            border: 'none',
            outline: '1px solid #C8BFB4',
            borderRadius: 4,
            fontSize: 13,
            padding: '1px 4px',
            background: 'white',
            color: '#3A3530',
            minWidth: 0,
          }}
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={startEdit}
          style={{
            flex: 1,
            fontSize: 13,
            color: '#3A3530',
            fontWeight: isActive ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {page.name}
        </span>
      )}

      {canDelete && !editing && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete page"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            color: '#9A9490',
            fontSize: 16,
            lineHeight: 1,
            borderRadius: 4,
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="delete-btn"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const PageSidebar: React.FC = () => {
  const { pages, currentPageId, createPage, switchPage, updatePageName, deletePage } = useStore();
  const [width, setWidth] = useState(200);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const next = Math.max(140, Math.min(400, startWidth.current + ev.clientX - startX.current));
      setWidth(next);
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        height: '100%',
        background: 'white',
        borderRight: '1px solid #E8E2D9',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Section header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pages
        </span>
        <button
          onClick={() => createPage()}
          title="New page"
          style={{
            background: 'none',
            border: '1px solid #E8E2D9',
            borderRadius: 6,
            width: 24,
            height: 24,
            cursor: 'pointer',
            fontSize: 16,
            color: '#3A3530',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Page list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <style>{`.delete-btn { opacity: 0 } div:hover > .delete-btn { opacity: 1 }`}</style>
        {pages.map((page) => (
          <PageItem
            key={page.id}
            page={page}
            isActive={page.id === currentPageId}
            onSelect={() => switchPage(page.id)}
            onRename={(name) => updatePageName(page.id, name)}
            onDelete={() => deletePage(page.id)}
            canDelete={pages.length > 1}
          />
        ))}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 4,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#D0C9C0')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />
    </div>
  );
};
