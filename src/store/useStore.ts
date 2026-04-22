import { create } from 'zustand';
import type { Outcome, Dependency, SaveStatus, Page } from '../types/outcome';
import { supabase } from '../lib/supabase';
import { wouldCreateCycle } from '../lib/cycleDetection';

// --- helpers ---

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.startsWith('https://') && !url.includes('your_supabase');
}

function uuid(): string {
  return crypto.randomUUID();
}

const LS_PAGES    = 'outcomer_pages';
const LS_OUTCOMES = 'outcomer_outcomes';
const LS_DEPS     = 'outcomer_dependencies';

function lsGetPages(): Page[] {
  try { return JSON.parse(localStorage.getItem(LS_PAGES) || '[]'); } catch { return []; }
}
function lsGetOutcomes(): Outcome[] {
  try { return JSON.parse(localStorage.getItem(LS_OUTCOMES) || '[]'); } catch { return []; }
}
function lsGetDeps(): Dependency[] {
  try { return JSON.parse(localStorage.getItem(LS_DEPS) || '[]'); } catch { return []; }
}
function lsSavePages(pages: Page[]) {
  localStorage.setItem(LS_PAGES, JSON.stringify(pages));
}
function lsSaveOutcomes(outcomes: Outcome[]) {
  localStorage.setItem(LS_OUTCOMES, JSON.stringify(outcomes));
}
function lsSaveDeps(deps: Dependency[]) {
  localStorage.setItem(LS_DEPS, JSON.stringify(deps));
}

// --- Store ---

interface Store {
  pages: Page[];
  currentPageId: string | null;
  outcomes: Outcome[];
  dependencies: Dependency[];
  selectedOutcomeId: string | null;
  saveStatus: SaveStatus;
  toastMessage: string | null;

  loadAll: () => Promise<void>;
  createPage: (name?: string) => Promise<Page | null>;
  switchPage: (id: string) => Promise<void>;
  updatePageName: (id: string, name: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
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
  _loadPageData: (id: string) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  pages: [],
  currentPageId: null,
  outcomes: [],
  dependencies: [],
  selectedOutcomeId: null,
  saveStatus: 'idle',
  toastMessage: null,

  // ── Bootstrap ──────────────────────────────────────────────

  loadAll: async () => {
    if (!isSupabaseConfigured()) {
      let pages = lsGetPages();
      let allOutcomes = lsGetOutcomes();

      // Migration: no pages yet → create default and assign existing outcomes
      if (pages.length === 0) {
        const defaultPage: Page = { id: uuid(), name: 'My outcomes', created_at: new Date().toISOString() };
        pages = [defaultPage];
        allOutcomes = allOutcomes.map((o) => ({ ...o, page_id: o.page_id || defaultPage.id }));
        lsSavePages(pages);
        lsSaveOutcomes(allOutcomes);
      }

      const first = pages[0];
      const pageOutcomes = allOutcomes.filter((o) => o.page_id === first.id);
      const ids = new Set(pageOutcomes.map((o) => o.id));
      const pageDeps = lsGetDeps().filter((d) => ids.has(d.from_outcome_id));

      set({ pages, currentPageId: first.id, outcomes: pageOutcomes, dependencies: pageDeps });
      return;
    }

    const { data: pages } = await supabase!.from('pages').select('*').order('created_at');
    const allPages: Page[] = pages || [];

    if (allPages.length === 0) {
      const { data: newPage } = await supabase!.from('pages').insert({ name: 'My outcomes' }).select().single();
      if (newPage) set({ pages: [newPage], currentPageId: newPage.id, outcomes: [], dependencies: [] });
      return;
    }

    const first = allPages[0];
    await get()._loadPageData(first.id);
    set({ pages: allPages, currentPageId: first.id });
  },

  // ── Pages ──────────────────────────────────────────────────

  switchPage: async (id) => {
    set({ selectedOutcomeId: null });
    if (!isSupabaseConfigured()) {
      const allOutcomes = lsGetOutcomes();
      const pageOutcomes = allOutcomes.filter((o) => o.page_id === id);
      const ids = new Set(pageOutcomes.map((o) => o.id));
      const pageDeps = lsGetDeps().filter((d) => ids.has(d.from_outcome_id));
      set({ currentPageId: id, outcomes: pageOutcomes, dependencies: pageDeps });
      return;
    }
    await get()._loadPageData(id);
    set({ currentPageId: id });
  },

  // Internal: load outcomes + deps for a page (Supabase)
  _loadPageData: async (id: string) => {
    const { data: outcomes } = await supabase!
      .from('outcomes').select('*').eq('page_id', id).order('created_at');
    const pageOutcomes: Outcome[] = outcomes || [];
    const ids = pageOutcomes.map((o) => o.id);
    let pageDeps: Dependency[] = [];
    if (ids.length > 0) {
      const { data: deps } = await supabase!.from('dependencies').select('*').in('from_outcome_id', ids);
      pageDeps = deps || [];
    }
    set({ outcomes: pageOutcomes, dependencies: pageDeps });
  },

  createPage: async (name = 'Untitled page') => {
    if (!isSupabaseConfigured()) {
      const newPage: Page = { id: uuid(), name, created_at: new Date().toISOString() };
      const pages = [...lsGetPages(), newPage];
      lsSavePages(pages);
      set({ pages, currentPageId: newPage.id, outcomes: [], dependencies: [], selectedOutcomeId: null });
      return newPage;
    }
    const { data, error } = await supabase!.from('pages').insert({ name }).select().single();
    if (error || !data) return null;
    set((s) => ({ pages: [...s.pages, data], currentPageId: data.id, outcomes: [], dependencies: [], selectedOutcomeId: null }));
    return data;
  },

  updatePageName: async (id, name) => {
    if (!isSupabaseConfigured()) {
      const pages = lsGetPages().map((p) => (p.id === id ? { ...p, name } : p));
      lsSavePages(pages);
      set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)) }));
      return;
    }
    await supabase!.from('pages').update({ name }).eq('id', id);
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, name } : p)) }));
  },

  deletePage: async (id) => {
    const { pages, currentPageId } = get();
    if (pages.length <= 1) return; // never delete last page

    if (!isSupabaseConfigured()) {
      const remaining = pages.filter((p) => p.id !== id);
      lsSavePages(remaining);
      const allOutcomes = lsGetOutcomes().filter((o) => o.page_id !== id);
      const remainingIds = new Set(allOutcomes.map((o) => o.id));
      lsSaveOutcomes(allOutcomes);
      lsSaveDeps(lsGetDeps().filter((d) => remainingIds.has(d.from_outcome_id)));
      set({ pages: remaining });
    } else {
      await supabase!.from('pages').delete().eq('id', id); // cascade deletes outcomes + deps
      set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }));
    }

    if (currentPageId === id) {
      const next = get().pages[0];
      if (next) await get().switchPage(next.id);
    }
  },

  // ── Outcomes ───────────────────────────────────────────────

  createOutcome: async (position_x, position_y) => {
    const { currentPageId } = get();
    if (!currentPageId) return null;

    const newOutcome: Outcome = {
      id: uuid(),
      page_id: currentPageId,
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
      lsSaveOutcomes([...lsGetOutcomes(), newOutcome]);
      set((s) => ({ outcomes: [...s.outcomes, newOutcome] }));
      return newOutcome;
    }

    const { data, error } = await supabase!
      .from('outcomes')
      .insert({ title: newOutcome.title, page_id: currentPageId, position_x, position_y })
      .select().single();
    if (error || !data) return null;
    set((s) => ({ outcomes: [...s.outcomes, data] }));
    return data;
  },

  updateOutcome: async (id, updates) => {
    set({ saveStatus: 'saving' });
    if (!isSupabaseConfigured()) {
      const updated = lsGetOutcomes().map((o) => (o.id === id ? { ...o, ...updates } : o));
      lsSaveOutcomes(updated);
      set((s) => ({ outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...updates } : o)), saveStatus: 'saved' }));
      return;
    }
    const { error } = await supabase!.from('outcomes').update(updates).eq('id', id);
    if (error) { set({ saveStatus: 'error' }); return; }
    set((s) => ({ outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, ...updates } : o)), saveStatus: 'saved' }));
  },

  deleteOutcome: async (id) => {
    if (!isSupabaseConfigured()) {
      lsSaveOutcomes(lsGetOutcomes().filter((o) => o.id !== id));
      lsSaveDeps(lsGetDeps().filter((d) => d.from_outcome_id !== id && d.to_outcome_id !== id));
    } else {
      await supabase!.from('outcomes').delete().eq('id', id);
    }
    set((s) => ({
      outcomes: s.outcomes.filter((o) => o.id !== id),
      dependencies: s.dependencies.filter((d) => d.from_outcome_id !== id && d.to_outcome_id !== id),
      selectedOutcomeId: s.selectedOutcomeId === id ? null : s.selectedOutcomeId,
    }));
  },

  updatePosition: async (id, x, y) => {
    if (!isSupabaseConfigured()) {
      lsSaveOutcomes(lsGetOutcomes().map((o) => (o.id === id ? { ...o, position_x: x, position_y: y } : o)));
    } else {
      await supabase!.from('outcomes').update({ position_x: x, position_y: y }).eq('id', id);
    }
    set((s) => ({ outcomes: s.outcomes.map((o) => (o.id === id ? { ...o, position_x: x, position_y: y } : o)) }));
  },

  // ── Dependencies ───────────────────────────────────────────

  addDependency: async (fromId, toId) => {
    const { dependencies } = get();
    if (wouldCreateCycle(dependencies, fromId, toId))
      return { success: false, error: 'This connection would create a circular dependency.' };
    if (dependencies.some((d) => d.from_outcome_id === fromId && d.to_outcome_id === toId))
      return { success: false, error: 'Dependency already exists.' };

    const newDep: Dependency = { id: uuid(), from_outcome_id: fromId, to_outcome_id: toId };

    if (!isSupabaseConfigured()) {
      lsSaveDeps([...lsGetDeps(), newDep]);
      set((s) => ({ dependencies: [...s.dependencies, newDep] }));
      return { success: true };
    }

    const { data, error } = await supabase!
      .from('dependencies')
      .insert({ from_outcome_id: fromId, to_outcome_id: toId })
      .select().single();
    if (error || !data) return { success: false, error: 'Failed to create dependency.' };
    set((s) => ({ dependencies: [...s.dependencies, data] }));
    return { success: true };
  },

  deleteDependency: async (id) => {
    if (!isSupabaseConfigured()) {
      lsSaveDeps(lsGetDeps().filter((d) => d.id !== id));
    } else {
      await supabase!.from('dependencies').delete().eq('id', id);
    }
    set((s) => ({ dependencies: s.dependencies.filter((d) => d.id !== id) }));
  },

  // ── Misc ───────────────────────────────────────────────────

  selectOutcome: (id) => set({ selectedOutcomeId: id }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
  clearToast: () => set({ toastMessage: null }),
} as Store));
