/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ListTodo, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flame,
  X,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Priority = 'high' | 'medium' | 'low';
type Category = string;
type Status = 'todo' | 'inprogress' | 'done';
type Role = 'admin' | 'member';

interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
}

interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: Priority;
  intensity: number;
  category: Category;
  status: Status;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- Constants & Defaults ---

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { id: 'u2', username: 'alice', password: 'pass123', role: 'member', name: 'Alice Smith' },
  { id: 'u3', username: 'bob', password: 'pass123', role: 'member', name: 'Bob Jones' },
];

const DEFAULT_CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'work', label: '仕事', color: 'bg-blue-500' },
  { value: 'personal', label: '個人', color: 'bg-purple-500' },
  { value: 'learning', label: '学習', color: 'bg-emerald-500' },
  { value: 'other', label: 'その他', color: 'bg-text-muted' },
];

const PRIORITIES: { value: Priority; label: string; class: string }[] = [
  { value: 'high', label: '高', class: 'priority-high' },
  { value: 'medium', label: '中', class: 'priority-medium' },
  { value: 'low', label: '低', class: 'priority-low' },
];

// --- Helper Functions ---

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getToday = () => formatDate(new Date());
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
};

// --- Components ---

export default function App() {
  // --- State ---
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'day' | 'calendar' | 'admin'>('day');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    category: 'all',
    status: 'all'
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [categories, setCategories] = useState<{ value: string; label: string; color: string }[]>(DEFAULT_CATEGORIES);
  
  // Modal specific local states
  const [modalIntensity, setModalIntensity] = useState(3);
  const [modalIsAllDay, setModalIsAllDay] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- Initialization ---
  useEffect(() => {
    const storedUsers = localStorage.getItem('taskflow_users');
    const storedTasks = localStorage.getItem('taskflow_tasks');
    const storedSession = localStorage.getItem('taskflow_session');
    const storedTheme = localStorage.getItem('taskflow_theme') as 'light' | 'dark';
    const storedCategories = localStorage.getItem('taskflow_categories');

    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem('taskflow_users', JSON.stringify(DEFAULT_USERS));
    }

    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }

    if (storedSession) {
      const sessionUser = JSON.parse(storedSession);
      setCurrentUser(sessionUser);
      if (sessionUser.role === 'admin') setView('admin');
    }
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('taskflow_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('taskflow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Toast Handler ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword as User);
      localStorage.setItem('taskflow_session', JSON.stringify(userWithoutPassword));
      addToast(`${user.name}としてログインしました`, 'success');
      if (user.role === 'admin') setView('admin');
      else setView('day');
    } else {
      addToast('ユーザー名またはパスワードが違います', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('taskflow_session');
    addToast('ログアウトしました');
  };

  // --- Task Handlers ---
  const saveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let category = formData.get('category') as string;
    if (category === 'add_new' && newCategoryName.trim()) {
      const newCatValue = 'cat_' + Date.now();
      const newCat = { value: newCatValue, label: newCategoryName.trim(), color: 'bg-blue-500' };
      setCategories(prev => [...prev, newCat]);
      category = newCatValue;
    }

    const taskData: Partial<Task> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as Priority,
      intensity: modalIntensity,
      category: category,
      status: formData.get('status') as Status,
      date: formData.get('date') as string,
      startTime: modalIsAllDay ? '00:00' : formData.get('startTime') as string,
      endTime: modalIsAllDay ? '23:59' : formData.get('endTime') as string,
      isAllDay: modalIsAllDay,
      updatedAt: Date.now(),
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as Task : t));
      addToast('タスクを更新しました', 'success');
    } else {
      const newTask: Task = {
        ...taskData as Task,
        id: 't' + Date.now(),
        userId: currentUser?.id || 'u1',
        createdAt: Date.now(),
      };
      setTasks(prev => [...prev, newTask]);
      addToast('タスクを追加しました', 'success');
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const deleteTask = (id: string) => {
    if (confirm('このタスクを削除しますか？')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('タスクを削除しました', 'info');
    }
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus: Status = t.status === 'todo' ? 'inprogress' : t.status === 'inprogress' ? 'done' : 'todo';
        return { ...t, status: nextStatus, updatedAt: Date.now() };
      }
      return t;
    }));
  };

  // --- Filtering ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Admin sees all, member sees only theirs
      const userMatch = currentUser?.role === 'admin' ? true : t.userId === currentUser?.id;
      const searchMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const priorityMatch = filters.priority === 'all' || t.priority === filters.priority;
      const categoryMatch = filters.category === 'all' || t.category === filters.category;
      const statusMatch = filters.status === 'all' || t.status === filters.status;
      
      return userMatch && searchMatch && priorityMatch && categoryMatch && statusMatch;
    });
  }, [tasks, currentUser, searchQuery, filters]);

  const dayTasks = useMemo(() => {
    return filteredTasks.filter(t => t.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredTasks, selectedDate]);

  // --- Render Login ---
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 bg-app-bg ${theme}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-500 mb-4">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-2xl font-bold text-text-main">TaskFlow</h1>
            <p className="text-text-muted">チームTODO管理アプリ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text-main">ユーザー名</label>
              <input 
                name="username"
                type="text" 
                required 
                className="input-field w-full"
                placeholder="admin / alice / bob"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text-main">パスワード</label>
              <input 
                name="password"
                type="password" 
                required 
                className="input-field w-full"
                placeholder="admin123 / pass123"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-4 py-3 font-semibold">
              ログイン
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-main text-center text-xs text-text-muted">
            <p>デモ用アカウント:</p>
            <p>管理者: admin / admin123</p>
            <p>メンバー: alice / pass123</p>
          </div>
        </motion.div>
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-app-bg overflow-hidden ${theme}`}>
      {/* Sidebar (Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-bg border-r border-border-main transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <LayoutDashboard size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-text-main">TaskFlow</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-text-muted">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <NavItem 
              active={view === 'day'} 
              onClick={() => setView('day')} 
              icon={<ListTodo size={20} />} 
              label="今日のタスク" 
            />
            <NavItem 
              active={view === 'calendar'} 
              onClick={() => setView('calendar')} 
              icon={<CalendarIcon size={20} />} 
              label="カレンダー" 
            />
            {currentUser.role === 'admin' && (
              <NavItem 
                active={view === 'admin'} 
                onClick={() => setView('admin')} 
                icon={<Users size={20} />} 
                label="管理パネル" 
              />
            )}
          </nav>

          <div className="p-4 mt-auto border-t border-border-main">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg/50 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                {currentUser.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{currentUser.name}</p>
                <p className="text-xs text-text-muted capitalize">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border-main bg-app-bg/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-text-muted">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-text-main">
              {view === 'day' ? '日表示' : view === 'calendar' ? 'カレンダー' : '管理者ダッシュボード'}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-input-bg border border-border-main text-text-muted hover:text-text-main transition-colors"
              title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden sm:flex items-center bg-input-bg border border-border-main rounded-lg px-3 py-1.5">
              <Search size={16} className="text-text-muted mr-2" />
              <input 
                type="text" 
                placeholder="検索..." 
                className="bg-transparent border-none focus:outline-none text-sm w-32 md:w-48 text-text-main"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingTask(null);
                setModalIntensity(3);
                setModalIsAllDay(false);
                setIsAddingCategory(false);
                setNewCategoryName('');
                setIsTaskModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2 px-3 md:px-4 py-2"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">タスク追加</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            {view === 'day' && (
              <motion.div 
                key="day"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 1);
                        setSelectedDate(formatDate(d));
                      }}
                      className="p-2 hover:bg-input-bg rounded-full text-text-muted"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-text-main">
                        {new Date(selectedDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                      </h3>
                      {selectedDate === getToday() && <span className="text-xs text-blue-400 font-medium">今日</span>}
                    </div>
                    <button 
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        setSelectedDate(formatDate(d));
                      }}
                      className="p-2 hover:bg-input-bg rounded-full text-text-muted"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <FilterSelect 
                      icon={<AlertCircle size={14} />}
                      value={filters.priority}
                      onChange={(v) => setFilters(f => ({ ...f, priority: v }))}
                      options={[{ value: 'all', label: '全優先度' }, ...PRIORITIES]}
                    />
                    <FilterSelect 
                      icon={<Filter size={14} />}
                      value={filters.category}
                      onChange={(v) => setFilters(f => ({ ...f, category: v }))}
                      options={[{ value: 'all', label: '全カテゴリ' }, ...categories]}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {dayTasks.length === 0 ? (
                    <div className="text-center py-20 glass-card">
                      <div className="w-16 h-16 rounded-full bg-input-bg flex items-center justify-center mx-auto mb-4 text-text-muted">
                        <ListTodo size={32} />
                      </div>
                      <p className="text-text-muted">この日のタスクはありません</p>
                    </div>
                  ) : (
                    dayTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        categories={categories}
                        onToggle={() => toggleTaskStatus(task.id)}
                        onEdit={() => {
                          setEditingTask(task);
                          setModalIntensity(task.intensity);
                          setModalIsAllDay(task.isAllDay);
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                          setIsTaskModalOpen(true);
                        }}
                        onDelete={() => deleteTask(task.id)}
                        showUser={currentUser.role === 'admin'}
                        userName={users.find(u => u.id === task.userId)?.name}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {view === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <CalendarView 
                  tasks={filteredTasks} 
                  onDateClick={setSelectedDate} 
                  onTaskClick={(task) => {
                    setEditingTask(task);
                    setModalIntensity(task.intensity);
                    setModalIsAllDay(task.isAllDay);
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                    setIsTaskModalOpen(true);
                  }}
                  onTaskDrop={(taskId, newDate) => {
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, date: newDate, updatedAt: Date.now() } : t));
                    addToast('日付を変更しました', 'success');
                  }}
                />
              </motion.div>
            )}

            {view === 'admin' && currentUser.role === 'admin' && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                    <Users size={24} className="text-blue-400" />
                    メンバー状況
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.filter(u => u.role !== 'admin').map(user => (
                      <MemberCard 
                        key={user.id} 
                        user={user} 
                        tasks={tasks.filter(t => t.userId === user.id)} 
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-text-main">全タスク一覧</h3>
                  <div className="glass-card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-input-bg/50 text-text-muted text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3 font-medium">担当者</th>
                          <th className="px-6 py-3 font-medium">タイトル</th>
                          <th className="px-6 py-3 font-medium">期限</th>
                          <th className="px-6 py-3 font-medium">優先度</th>
                          <th className="px-6 py-3 font-medium">ステータス</th>
                          <th className="px-6 py-3 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main">
                        {filteredTasks.map(task => (
                          <tr key={task.id} className="hover:bg-text-main/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">
                                  {users.find(u => u.id === task.userId)?.name[0]}
                                </div>
                                <span className="text-sm text-text-main">{users.find(u => u.id === task.userId)?.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm font-medium text-text-main ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                                {task.title}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">
                              {task.date}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`badge ${PRIORITIES.find(p => p.value === task.priority)?.class}`}>
                                {PRIORITIES.find(p => p.value === task.priority)?.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-md ${
                                task.status === 'done' ? 'bg-green-500/10 text-green-400' :
                                task.status === 'inprogress' ? 'bg-blue-500/10 text-blue-400' : 'bg-input-bg text-text-muted'
                              }`}>
                                {task.status === 'done' ? '完了' : task.status === 'inprogress' ? '進行中' : '未着手'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingTask(task);
                                    setModalIntensity(task.intensity);
                                    setModalIsAllDay(task.isAllDay);
                                    setIsAddingCategory(false);
                                    setNewCategoryName('');
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded-md"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1.5 hover:bg-red-500/10 text-red-400 rounded-md"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden h-16 border-t border-border-main bg-sidebar-bg flex items-center justify-around px-4 z-40">
          <MobileNavItem active={view === 'day'} onClick={() => setView('day')} icon={<ListTodo size={20} />} label="タスク" />
          <MobileNavItem active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarIcon size={20} />} label="カレンダー" />
          {currentUser.role === 'admin' && (
            <MobileNavItem active={view === 'admin'} onClick={() => setView('admin')} icon={<Users size={20} />} label="管理" />
          )}
          <MobileNavItem active={false} onClick={handleLogout} icon={<LogOut size={20} />} label="終了" />
        </nav>
      </main>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-lg p-6 relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-main">
                  {editingTask ? 'タスクを編集' : '新しいタスク'}
                </h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="text-text-muted hover:text-text-main">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={saveTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text-main">タイトル *</label>
                  <input 
                    name="title"
                    type="text" 
                    required 
                    defaultValue={editingTask?.title}
                    className="input-field w-full"
                    placeholder="タスク名を入力..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text-main">説明</label>
                  <textarea 
                    name="description"
                    rows={3}
                    defaultValue={editingTask?.description}
                    className="input-field w-full resize-none"
                    placeholder="詳細を入力..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-text-main">優先度</label>
                    <select name="priority" defaultValue={editingTask?.priority || 'medium'} className="input-field w-full">
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-text-main">カテゴリ</label>
                    <div className="space-y-2">
                      <select 
                        name="category" 
                        defaultValue={editingTask?.category || 'work'} 
                        className="input-field w-full"
                        onChange={(e) => setIsAddingCategory(e.target.value === 'add_new')}
                      >
                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        <option value="add_new">+ 新規追加...</option>
                      </select>
                      {isAddingCategory && (
                        <input 
                          type="text"
                          placeholder="新しいカテゴリ名..."
                          className="input-field w-full text-sm"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2 text-text-main">
                    強度 (作業負荷)
                    <span className="text-xs text-text-muted">{modalIntensity}</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      name="intensity"
                      type="range" 
                      min="1" 
                      max="5" 
                      step="1"
                      value={modalIntensity}
                      onChange={(e) => setModalIntensity(parseInt(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <div className="flex gap-1 text-orange-500">
                      {[1,2,3,4,5].map(i => <Flame key={i} size={16} fill={i <= modalIntensity ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isAllDay" 
                      checked={modalIsAllDay}
                      onChange={(e) => setModalIsAllDay(e.target.checked)}
                      className="w-4 h-4 rounded border-border-main text-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="isAllDay" className="text-sm font-medium text-text-main cursor-pointer">終日タスク</label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-text-main">日付</label>
                      <input 
                        name="date"
                        type="date" 
                        required
                        defaultValue={editingTask?.date || selectedDate}
                        className="input-field w-full"
                      />
                    </div>
                    {!modalIsAllDay && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-text-main">開始</label>
                          <input 
                            name="startTime"
                            type="time" 
                            required
                            defaultValue={editingTask?.startTime || '09:00'}
                            className="input-field w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-text-main">終了</label>
                          <input 
                            name="endTime"
                            type="time" 
                            required
                            defaultValue={editingTask?.endTime || '10:00'}
                            className="input-field w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text-main">ステータス</label>
                  <div className="flex gap-2">
                    {['todo', 'inprogress', 'done'].map((s) => (
                      <label key={s} className="flex-1">
                        <input 
                          type="radio" 
                          name="status" 
                          value={s} 
                          className="sr-only peer" 
                          defaultChecked={editingTask?.status === s || (!editingTask && s === 'todo')}
                        />
                        <div className="text-center py-2 rounded-lg border border-border-main bg-input-bg cursor-pointer peer-checked:bg-blue-500 peer-checked:border-blue-500 peer-checked:text-white text-sm transition-all text-text-main">
                          {s === 'todo' ? '未着手' : s === 'inprogress' ? '進行中' : '完了'}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary flex-1">
                    キャンセル
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTask ? '更新する' : '追加する'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

// --- Sub-components ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full p-3 rounded-xl transition-all
        ${active ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'text-text-muted hover:text-text-main hover:bg-text-main/5'}
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1 h-4 rounded-full bg-blue-500" />}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 ${active ? 'text-blue-500 dark:text-blue-400' : 'text-text-muted'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete, showUser, userName, categories }: { 
  task: Task, 
  onToggle: () => void, 
  onEdit: () => void, 
  onDelete: () => void,
  showUser?: boolean,
  userName?: string,
  categories: { value: string; label: string; color: string }[],
  key?: React.Key
}) {
  const isPast = new Date(task.date) < new Date(getToday()) && task.status !== 'done';
  const isUpcoming = task.date === getToday() || task.date === getTomorrow();
  const category = categories.find(c => c.value === task.category) || categories.find(c => c.value === 'other');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        glass-card p-4 flex gap-4 group relative overflow-hidden
        ${isPast ? 'border-red-500/30 bg-red-500/5' : ''}
      `}
    >
      {isUpcoming && task.status !== 'done' && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 bg-blue-500 text-[10px] font-bold text-white py-1 px-10 transform rotate-45 translate-x-4 -translate-y-1">
            {task.date === getToday() ? '今日' : '明日'}
          </div>
        </div>
      )}

      <button 
        onClick={onToggle}
        className={`
          mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
          ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-border-main hover:border-blue-500'}
        `}
      >
        {task.status === 'done' && <CheckCircle2 size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`badge ${PRIORITIES.find(p => p.value === task.priority)?.class}`}>
            {PRIORITIES.find(p => p.value === task.priority)?.label}
          </span>
          <span className={`text-[10px] uppercase font-bold text-text-muted`}>
            {category?.label}
          </span>
          {showUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-input-bg text-text-muted">
              {userName}
            </span>
          )}
        </div>
        
        <h4 className={`text-base font-semibold text-text-main mb-1 truncate ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-text-muted line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {task.isAllDay ? '終日' : `${task.startTime} - ${task.endTime}`}
          </div>
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-orange-500" />
            {task.intensity}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 hover:bg-text-main/10 rounded-lg text-text-muted hover:text-text-main">
          <Edit2 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-400">
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function FilterSelect({ icon, value, onChange, options }: { icon: React.ReactNode, value: string, onChange: (v: string) => void, options: any[] }) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-input-bg border border-border-main rounded-lg px-3 py-1.5 text-sm text-text-muted cursor-pointer hover:border-text-muted/30">
        {icon}
        <span>{options.find(o => o.value === value)?.label}</span>
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CalendarView({ tasks, onDateClick, onTaskClick, onTaskDrop }: { 
  tasks: Task[], 
  onDateClick: (d: string) => void,
  onTaskClick: (t: Task) => void,
  onTaskDrop: (id: string, date: string) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Padding for previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), current: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), current: true });
    }
    
    // Padding for next month
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), current: false });
    }
    
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div className="flex-1 flex flex-col min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-text-main">
          {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-input-bg rounded-lg text-text-muted"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-xs bg-input-bg rounded-lg text-text-muted hover:text-text-main">今日</button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-input-bg rounded-lg text-text-muted"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="calendar-grid flex-1 rounded-xl overflow-hidden border border-border-main">
        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
          <div key={d} className="bg-input-bg/50 py-2 text-center text-xs font-bold text-text-muted uppercase">
            {d}
          </div>
        ))}
        {daysInMonth.map(({ date, current }, idx) => {
          const dateStr = formatDate(date);
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const isToday = dateStr === getToday();

          return (
            <div 
              key={idx} 
              className={`calendar-day ${!current ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onDateClick(dateStr)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('taskId');
                if (taskId) onTaskDrop(taskId, dateStr);
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-medium ${isToday ? 'w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center' : 'text-text-muted'}`}>
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-text-muted font-bold">{dayTasks.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className={`
                      text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all
                      ${task.status === 'done' ? 'bg-green-500/10 text-green-500/70 line-through' : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/30'}
                    `}
                  >
                    {task.isAllDay ? '🕒 ' : ''}{task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-text-muted font-medium pl-1">他 {dayTasks.length - 3} 件...</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberCard({ user, tasks }: { user: User, tasks: Task[], key?: React.Key }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'inprogress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    
    // Intensity stats
    const intensitySum = tasks.reduce((acc, t) => acc + t.intensity, 0);
    const intensityAvg = total > 0 ? (intensitySum / total).toFixed(1) : 0;

    // Weekly tasks
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weeklyTasks = tasks.filter(t => new Date(t.date) >= startOfWeek).length;

    // Priority breakdown
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;

    return { total, done, inProgress, todo, completionRate, intensitySum, intensityAvg, weeklyTasks, high, medium, low };
  }, [tasks]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold">
          {user.name[0]}
        </div>
        <div>
          <h4 className="text-text-main font-bold">{user.name}</h4>
          <p className="text-xs text-text-muted">ワークロードスコア: {stats.intensitySum}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-muted">完了率</span>
            <span className="text-text-main font-medium">{stats.completionRate}%</span>
          </div>
          <div className="h-2 bg-input-bg rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              className="h-full bg-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox label="全タスク" value={stats.total} />
          <StatBox label="今週" value={stats.weeklyTasks} />
          <StatBox label="進行中" value={stats.inProgress} color="text-blue-400" />
          <StatBox label="平均強度" value={stats.intensityAvg} />
        </div>

        <div className="flex gap-2 pt-2">
          <PriorityBadge count={stats.high} type="high" />
          <PriorityBadge count={stats.medium} type="medium" />
          <PriorityBadge count={stats.low} type="low" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-text-main" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-input-bg/30 p-2 rounded-lg border border-border-main">
      <p className="text-[10px] text-text-muted uppercase font-bold mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function PriorityBadge({ count, type }: { count: number, type: Priority }) {
  const config = PRIORITIES.find(p => p.value === type);
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold ${config?.class}`}>
      {config?.label}: {count}
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div 
            key={toast.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
              px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 min-w-[200px] pointer-events-auto
              ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                'bg-blue-500/10 border-blue-500/20 text-blue-400'}
            `}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : 
             toast.type === 'error' ? <AlertCircle size={18} /> : <Clock size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
