export type OutcomeStatus = 'todo' | 'wait' | 'inprogress' | 'done';

export interface Page {
  id: string;
  name: string;
  created_at: string;
}

export interface Outcome {
  id: string;
  page_id: string;
  title: string;
  status: OutcomeStatus;
  strategy: string;
  info: string;
  deadline: string | null;
  position_x: number;
  position_y: number;
  created_at: string;
}

export interface Dependency {
  id: string;
  from_outcome_id: string;
  to_outcome_id: string;
}

export type SaveStatus = 'saved' | 'saving' | 'error' | 'idle';
