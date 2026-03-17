
export type Role = 'admin' | 'member';
export type Priority = 'high' | 'medium' | 'low';
export type Status = 'todo' | 'inprogress' | 'done';

export interface Category {
  id: string;
  label: string;
  color: string; // Hex color for calendar
}

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  role: Role;
  name: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
    language: string;
  };
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: Priority;
  intensity: number; // 1-5
  category: string; // Category ID
  status: Status;
  date: string; // Start Date: YYYY-MM-DD
  endDate: string; // End Date: YYYY-MM-DD
  isAllDay: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  currentUser: User | null;
  tasks: Task[];
  users: User[];
  categories: Category[];
}
