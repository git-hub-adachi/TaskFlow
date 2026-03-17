
import { Priority, Category, Status } from './types';

export const INITIAL_USERS = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin' as const, name: '管理者' },
  { id: 'u2', username: 'alice', password: 'pass123', role: 'member' as const, name: 'Alice' },
  { id: 'u3', username: 'bob', password: 'pass123', role: 'member' as const, name: 'Bob' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: '高', color: 'text-red-400', bg: 'bg-red-900/40' },
  medium: { label: '中', color: 'text-orange-400', bg: 'bg-orange-900/40' },
  low: { label: '低', color: 'text-green-400', bg: 'bg-green-900/40' },
};

export const INITIAL_CATEGORIES = [
  { id: 'work', label: '仕事', color: '#3b82f6' },
  { id: 'learning', label: '学習', color: '#8b5cf6' },
  { id: 'other', label: 'その他', color: '#64748b' },
];

export const STATUS_LABELS: Record<Status, string> = {
  todo: '未着手',
  inprogress: '進行中',
  done: '完了',
};

export const INTENSITY_ICON = '🔥';
