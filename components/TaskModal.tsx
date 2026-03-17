
import React, { useState, useEffect } from 'react';
import { Task, Priority, Category, Status, User } from '../types';
import { PRIORITY_CONFIG, STATUS_LABELS } from '../constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialTask?: Task | null;
  currentUserId: string;
  adminUsers?: User[]; // Only for admin mode
  categories: Category[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask, currentUserId, adminUsers, categories }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    intensity: 3,
    category: categories[0]?.id || 'work',
    status: 'todo',
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isAllDay: false,
    startTime: '09:00',
    endTime: '10:00',
    userId: currentUserId,
  });

  useEffect(() => {
    if (initialTask) {
      setFormData(initialTask);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        intensity: 3,
        category: categories[0]?.id || 'work',
        status: 'todo',
        date: today,
        endDate: today,
        isAllDay: false,
        startTime: '09:00',
        endTime: '10:00',
        userId: currentUserId,
      });
    }
  }, [initialTask, currentUserId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{initialTask ? 'タスクを編集' : '新規タスク登録'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {adminUsers && (
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">担当者</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                value={formData.userId}
                onChange={e => setFormData({ ...formData, userId: e.target.value })}
              >
                {adminUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">タイトル <span className="text-red-400">*</span></label>
            <input
              required
              type="text"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              placeholder="何をする？"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">説明</label>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-900 dark:text-white"
              placeholder="詳細メモ..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">優先度</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                      formData.priority === p 
                        ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border-current` 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">強度 (1-5)</label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData({ ...formData, intensity: v })}
                    className={`text-xl transition-transform hover:scale-125 ${formData.intensity! >= v ? 'grayscale-0' : 'grayscale opacity-30'}`}
                  >
                    🔥
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">カテゴリ</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">ステータス</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="isAllDay"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={formData.isAllDay}
              onChange={e => setFormData({ ...formData, isAllDay: e.target.checked })}
            />
            <label htmlFor="isAllDay" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              終日
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">開始日</label>
              <input
                type="date"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">終了日</label>
              <input
                type="date"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">開始時間</label>
                <input
                  type="time"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">終了時間</label>
                <input
                  type="time"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              {initialTask ? '更新する' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
