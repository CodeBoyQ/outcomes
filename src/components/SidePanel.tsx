import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { OutcomeStatus } from '../types/outcome';

const statusOptions: { value: OutcomeStatus; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'wait', label: 'Wait' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const statusColors: Record<OutcomeStatus, string> = {
  todo: '#E8E2D9',
  wait: '#C4B8D4',
  inprogress: '#D4A87A',
  done: '#9AB89A',
};

export const SidePanel: React.FC = () => {
  const { outcomes, dependencies, selectedOutcomeId, selectOutcome, updateOutcome, deleteOutcome } = useStore();
  const outcome = outcomes.find((o) => o.id === selectedOutcomeId);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<OutcomeStatus>('todo');
  const [deadline, setDeadline] = useState('');
  const [strategy, setStrategy] = useState('');
  const [info, setInfo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (outcome) {
      setTitle(outcome.title);
      setStatus(outcome.status);
      setDeadline(outcome.deadline || '');
      setStrategy(outcome.strategy || '');
      setInfo(outcome.info || '');
      setShowDeleteConfirm(false);
    }
  }, [outcome?.id]);

  if (!outcome) return null;

  // Find outcomes this one depends on (from_outcome_id entries where to_outcome_id = this)
  const dependsOnIds = dependencies
    .filter((d) => d.to_outcome_id === outcome.id)
    .map((d) => d.from_outcome_id);
  const dependsOnOutcomes = outcomes.filter((o) => dependsOnIds.includes(o.id));

  // Check if all dependencies are done
  const allDepsDone = dependsOnOutcomes.every((o) => o.status === 'done');
  const canComplete = dependsOnOutcomes.length === 0 || allDepsDone;

  const handleSave = async () => {
    await updateOutcome(outcome.id, {
      title,
      status,
      deadline: deadline || null,
      strategy,
      info,
    });
  };

  const handleDelete = async () => {
    await deleteOutcome(outcome.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="absolute top-0 right-0 h-full w-80 bg-white border-l border-stone-200 flex flex-col z-20 shadow-xl"
      style={{ animation: 'slideIn 0.2s ease' }}
    >
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Outcome</span>
        <button
          onClick={() => selectOutcome(null)}
          className="text-stone-400 hover:text-stone-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Outcome title..."
            className="w-full text-lg font-semibold text-stone-800 bg-transparent border-0 border-b-2 border-stone-200 focus:border-stone-400 focus:outline-none pb-1 placeholder:text-stone-300"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">Status</label>
          <div className="flex gap-1 flex-wrap">
            {statusOptions.map((opt) => {
              const isSelected = status === opt.value;
              const isDisabled = opt.value === 'done' && !canComplete;
              return (
                <button
                  key={opt.value}
                  onClick={() => !isDisabled && setStatus(opt.value)}
                  title={isDisabled ? 'Dependencies not yet done' : ''}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isSelected ? statusColors[opt.value] : '#F0EDE8',
                    color: isSelected ? '#3A3530' : '#9A9490',
                    border: isSelected ? `1.5px solid ${statusColors[opt.value]}` : '1.5px solid transparent',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {!canComplete && status !== 'done' && (
            <p className="text-xs text-amber-600 mt-1">
              Blocked by: {dependsOnOutcomes.filter((o) => o.status !== 'done').map((o) => o.title).join(', ')}
            </p>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
          />
        </div>

        {/* Strategy */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">How will you achieve this?</label>
          <textarea
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            rows={3}
            placeholder="Describe your strategy..."
            className="w-full text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400 resize-none placeholder:text-stone-300"
          />
        </div>

        {/* Info */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">Background info & context</label>
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            rows={3}
            placeholder="Background info..."
            className="w-full text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400 resize-none placeholder:text-stone-300"
          />
        </div>

        {/* Dependencies */}
        {dependsOnOutcomes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2 uppercase tracking-wider">Depends on</label>
            <div className="space-y-1">
              {dependsOnOutcomes.map((dep) => (
                <button
                  key={dep.id}
                  onClick={() => selectOutcome(dep.id)}
                  className="w-full text-left text-sm text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dep.status === 'done' ? '#9AB89A' : dep.status === 'inprogress' ? '#D4A87A' : dep.status === 'wait' ? '#C4B8D4' : '#E8E2D9' }}
                  />
                  {dep.title || 'Untitled'}
                  {dep.status !== 'done' && <span className="ml-auto text-xs text-amber-500">blocking</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-stone-100 space-y-2">
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          Save
        </button>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 text-red-400 text-sm hover:text-red-600 transition-colors"
          >
            Delete outcome
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
