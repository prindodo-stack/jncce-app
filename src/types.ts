export type Department = 'planning' | 'creative' | 'information' | 'general';

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: Department;
  description?: string;
}

export interface MealRecord {
  id: string;
  date: string;
  count: number;
  is_available: boolean;
}

export interface VisitRecord {
  id: string;
  date: string;
  count: number;
}

export interface AppSettings {
  default_meal_count: number;
  meal_available_days: number;
}

export type ViewType = 'dashboard' | 'calendar' | 'entry' | 'settings';
