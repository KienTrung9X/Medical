export interface ParsedMedication {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

export interface Reminder {
  time: string;
  frequency: 'daily' | 'specific_days';
  days?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Medication extends ParsedMedication {
  id: string;
  taken: boolean;
  reminder: Reminder | null;
}

export enum AppState {
  Idle,
  Loading,
  Success,
  Error,
}