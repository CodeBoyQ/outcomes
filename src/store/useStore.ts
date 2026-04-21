import { create } from 'zustand';
import type { Outcome, Dependency, SaveStatus } from '../types/outcome';
import { supabase } from '../lib/supabase';
import { wouldCreateCycle } from '../lib/cycleDetection';

// --- localStorage helpers (fallback when Supabase is not configured) ---

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.startsWith('https://') && !url.includes('your_supabase');
}

function uuid(): string {
  return crypto.randomUUID();
}

const LS_OUTCOMES = 'outcomer_outcomes';
const LS_DEPS = 'outcomer_dependencies';

function lsGetOutcomes(): Outcome[] {
  try { return JSON.parse(localStorage.getItem(LS_OUTCOMES) || '[]'); } catch { return []; }
}
function lsGetDeps(): Dependency[] {
  try { return JSON.parse(localStorage.getItem(LS_DEPS) || '[]'); } catch { return []; }
}
function lsSaveOutcomes(outcomes: Outcome[]) {
  localStorage.setItem(LS_OUTCOMES, JSON.stringify(outcomes));
}
function lsSaveDeps(deps: Dependency[]) {
  localStorage.setItem(LS_DEPS, JSON.stringify(deps));
}

// --- Store ---

interface Store {
  outcomes: Outcome[];
  dependencies: Dependency[];
  selectedOutcomeId: string | null;
  saveStatus: SaveStatus;
  toastMessage: string | null;

  loadAll: () => Promise<void>;
  createOutcome: (position_x: number, position_y: number) => Promise<Outcome | null>;
  updateOutcome: (id: string, updates: Partial<Outcome>) => Promise<void>;
  deleteOutcome: (id: string) => Promise<void>;
  updatePosition: (id: string, x: number, y: number) => Promise<void>;
  addDependency: (fromId: string, toId: string) => Promise<{ success: boolean; error?: string }>;
  deleteDependency: (id: string) => Promise<void>;
  selectOutcome: (id: string | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useStore = create<Store>((set, get) => ({
  outcomes: [],
  dependencies: [],
  selectedOutcomeId: null,
  saveStatus: 'idle',
  toastMessage: null,

  loadAll: async () => {
    if (!isSupabaseConfigured()) {
      set({ outcomes: lsGetOutcomes(), dependencies: lsGetDeps() });
      return;
    }
    const [{ data: outcomes }, { data: deps }] = await Promise.all([
      supabase.from('outcomes').select('*').order('created_at'),
      supabase.from('dependencies').select('*'),
    ]);
    set({ outcomes: outcomes || [], dependencies: deps || [] });
  },

  createOutcome: async (position_x, position_y) => {
    const newOutcome: Outcome = {
      id: uuid(),
      title: 'New outcome',
      status: 'todo',
      strategy: '',
      info: '',
      deadline: null,
      position_x,
      position_y,
      created_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured()) {
      const updated = [...lsGetOutcomes(), newOutcome];
      lsSaveOutcomes(updated);
      set((s) => ({ outcomes: [...s.outcomes, newOutcome] }));
      return newOutcome;
    }

    const { data, error } = await supabase
      .from('outcomes')
      .insert({ title: newOutcome.title, position_x, position_y })
      .select()
      .single();
    if (error || !data) return null;
    set((s) => ({ outcomes: [...s.outcomes, data] }));
    return data;
  },

  updateOutcome: async (id, updates) => {
    set({ saveStatus: 'saving' });

    if (!isSupabaseConfigured()) {
      const updated = lsGetOutcomes().map((o) => (o.id === id ? { ...o, ...updates } : o));
      lsSaveOutcomes(updated);
      set((s) => ({
        outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        saveStatus: 'saved',
      }));
      return;
    }

    const { error } = await supabase.from('outcomes').update(updates).eq('id', id);
    if (error) { set({ saveStatus: 'error' }); return; }
    set((s) => ({
      outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      saveStatus: 'saved',
    }));
  },

  deleteOutcome: async (id) => {
    if (!isSupabaseConfigured()) {
      lsSaveOutcomes(lsGetOutcomes().filter((o) => o.id !== id));
      lsSaveDeps(lsGetDeps().filter((d) => d.from_outcome_id !== id && d.to_outcome_id !== id));
    } else {
      await supabase.from('outcomes').delete().eq('id', id);
    }
    set((s) => ({
      outcomes: s.outcomes.filter((o) => o.id !== id),
      dependencies: s.dependencies.filter((d) => d.from_outcome_id !== id && d.to_outcome_id !== id),
      selectedOutcomeId: s.selectedOutcomeId === id ? null : s.selectedOutcomeId,
    }));
  },

  updatePosition: async (id, x, y) => {
    if (!isSupabaseConfigured()) {
      const updated = lsGetOutcomes().map((o) => (o.id === id ? { ...o, position_x: x, position_y: y } : o));
      lsSaveOutcomes(updated);
    } else {
      await supabase.from('outcomes').update({ position_x: x, position_y: y }).eq('id', id);
    }
    set((s) => ({
      outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, position_x: x, position_y: y } : o)),
    }));
  },

  addDependency: async (fromId, toId) => {
    const { dependencies } = get();
    if (wouldCreateCycle(dependencies, fromId, toId)) {
      return { success: false, error: 'This connection would create a circular dependency.' };
    }
    const exists = dependencies.some((d) => d.from_outcome_id === fromId && d.to_outcome_id === toId);
    if (exists) return { success: false, error: 'Dependency already exists.' };

    const newDep: Dependency = { id: uuid(), from_outcome_id: fromId, to_outcome_id: toId };

    if (!isSupabaseConfigured()) {
      const updated = [...lsGetDeps(), newDep];
      lsSaveDeps(updated);
      set((s) => ({ dependencies: [...s.dependencies, newDep] }));
      return { success: true };
    }

    const { data, error } = await supabase
      .from('dependencies')
      .insert({ from_outcome_id: fromId, to_outcome_id: toId })
      .select()
      .single();
    if (error || !data) return { success: false, error: 'Failed to create dependency.' };
    set((s) => ({ dependencies: [...s.dependencies, data] }));
    return { success: true };
  },

  deleteDependency: async (id) => {
    if (!isSupabaseConfigured()) {
      lsSaveDeps(lsGetDeps().filter((d) => d.id !== id));
    } else {
      await supabase.from('dependencies').delete().eq('id', id);
    }
    set((s) => ({ dependencies: s.dependencies.filter((d) => d.id !== id) }));
  },

  selectOutcome: (id) => set({ selectedOutcomeId: id }),
  setSaveStatus: (status) => set({ saveStatus: status }),

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
  clearToast: () => set({ toastMessage: null }),
}));
