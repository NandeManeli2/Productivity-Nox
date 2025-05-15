export interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date?: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  water_goal: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  timestamp: string;
} 