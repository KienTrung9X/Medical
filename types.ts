export interface ParsedMedication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
  totalQuantity: number | null;
}

export interface Reminder {
  times: string[]; // Changed from `time: string` to support multiple times
  frequency: 'daily' | 'specific_days';
  days?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Medication extends ParsedMedication {
  id: string;
  taken: boolean;
  reminder: Reminder | null;
}

export interface HistoryEntry {
  id: string;
  medicationId: string;
  medicationName: string;
  takenAt: Date;
}

export enum AppState {
  Idle,
  Loading,
  Success,
  Error,
}