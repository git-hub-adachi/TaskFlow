
import { Task, User, Category } from '../types';
import { INITIAL_USERS, INITIAL_CATEGORIES } from '../constants';

const KEYS = {
  TASKS: 'taskflow_tasks',
  USERS: 'taskflow_users',
  SESSION: 'taskflow_session',
  CATEGORIES: 'taskflow_categories',
};

export const storageService = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  },
  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    if (!data) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },
  getSession: (): User | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  },
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (!data) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(data);
  },
  saveCategories: (categories: Category[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },
};
