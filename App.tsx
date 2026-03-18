
import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, AppState, Status } from './types';
import { storageService } from './services/storage';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import TaskBoard from './components/TaskBoard';
import Dashboard from './components/Dashboard';
import TaskModal from './components/TaskModal';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import { 
  PlusIcon, 
  BarChartIcon, 
  CalendarIcon, 
  LogOutIcon,
  ListIcon,
  SettingsIcon
} from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    tasks: [],
    users: [],
    categories: [],
  });
  const [view, setView] = useState<'board' | 'dashboard'>('board');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    const session = storageService.getSession();
    const tasks = storageService.getTasks();
    const users = storageService.getUsers();
    const categories = storageService.getCategories();
    setState({ currentUser: session, tasks, users, categories });
  }, []);

  useEffect(() => {
    if (state.currentUser?.preferences) {
      const isDark = state.currentUser.preferences.darkMode;
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#f8fafc';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#f8fafc';
        document.body.style.color = '#0f172a';
      }
    } else {
      // Default to dark mode as per initial design
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f8fafc';
    }
  }, [state.currentUser?.preferences?.darkMode]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogin = (user: User) => {
    storageService.setSession(user);
    setState(prev => ({ ...prev, currentUser: user }));
    addToast(`${user.name}としてログインしました`, 'success');
  };

  const handleLogout = () => {
    storageService.setSession(null);
    setState(prev => ({ ...prev, currentUser: null }));
    setView('board');
    addToast('ログアウトしました');
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = state.users.map(u => u.id === updatedUser.id ? updatedUser : u);
    storageService.saveUsers(updatedUsers);
    storageService.setSession(updatedUser);
    setState(prev => ({ ...prev, users: updatedUsers, currentUser: updatedUser }));
    addToast('アカウント情報を更新しました', 'success');
  };

  const handleSaveCategories = (categories: any[]) => {
    storageService.saveCategories(categories);
    setState(prev => ({ ...prev, categories }));
    addToast('カテゴリ設定を保存しました', 'success');
  };

  const saveTasks = useCallback((newTasks: Task[]) => {
    storageService.saveTasks(newTasks);
    setState(prev => ({ ...prev, tasks: newTasks }));
  }, []);

  const handleSaveTask = (taskData: Partial<Task>) => {
    let updatedTasks: Task[];
    if (editingTask) {
      updatedTasks = state.tasks.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...taskData, updatedAt: Date.now() } as Task
          : t
      );
      addToast('タスクを更新しました', 'success');
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...(taskData as Task),
      };
      updatedTasks = [...state.tasks, newTask];
      addToast('新しいタスクを登録しました', 'success');
    }
    saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    setTaskToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      const updatedTasks = state.tasks.filter(t => t.id !== taskToDelete);
      saveTasks(updatedTasks);
      addToast('タスクを削除しました', 'info');
      setTaskToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleUpdateStatus = (id: string, status: Status) => {
    const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t);
    saveTasks(updatedTasks);
    addToast(`状態を更新しました: ${status}`, 'success');
  };

  const handleDateChange = (id: string, date: string) => {
    const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, date, updatedAt: Date.now() } : t);
    saveTasks(updatedTasks);
    addToast(`日付を変更しました`, 'info');
  };

  const handleAuthSuccess = async () => {
    // Supabase セッションからログインユーザーを取得
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    if (profile) {
      const user: User = {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        email: authUser.email,
        role: profile.role,
        preferences: profile.preferences,
      };
      storageService.setSession(user);
      setState(prev => ({ ...prev, currentUser: user }));
      addToast(`${user.name}としてログインしました`, 'success');
    }
  };

  if (!state.currentUser) {
    return <Auth onSuccess={handleAuthSuccess} />;
  }

  const userTasks = state.currentUser.role === 'admin' 
    ? state.tasks 
    : state.tasks.filter(t => t.userId === state.currentUser?.id);

  const isDarkMode = state.currentUser?.preferences?.darkMode ?? true;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 border-r p-6 sticky top-0 h-screen transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <span className="font-black text-xl text-white">TF</span>
          </div>
          <span className={`text-2xl font-black tracking-tight bg-clip-text text-transparent transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-r from-white to-slate-400' : 'bg-gradient-to-r from-slate-900 to-slate-500'}`}>TaskFlow</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('board')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'board' ? 'bg-blue-600/10 text-blue-500 font-bold border border-blue-600/20' : isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <CalendarIcon />
            <span>タスクボード</span>
          </button>
          
          {state.currentUser.role === 'admin' && (
            <button 
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-teal-600/10 text-teal-500 font-bold border border-teal-600/20' : isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <BarChartIcon />
              <span>管理者ダッシュボード</span>
            </button>
          )}
        </nav>

        <div className={`pt-6 border-t mt-auto ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl mb-4 border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isDarkMode ? 'bg-slate-700 border-blue-500/50 text-white' : 'bg-white border-blue-500/50 text-slate-900'}`}>
              {state.currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{state.currentUser.name}</p>
              <p className={`text-[10px] uppercase tracking-tighter ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{state.currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <SettingsIcon />
            <span>設定</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              {view === 'board' ? 'タスク管理' : '分析ダッシュボード'}
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {view === 'board' ? '今日の予定と進捗をチェックしましょう' : 'チームのパフォーマンスを視覚化します'}
            </p>
          </div>
          {view === 'board' && (
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95"
            >
              <PlusIcon />
              <span className="hidden sm:inline">新規追加</span>
            </button>
          )}
        </header>

        {view === 'board' ? (
          <TaskBoard 
            tasks={userTasks} 
            user={state.currentUser} 
            isAdminMode={state.currentUser.role === 'admin'}
            onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onDateChange={handleDateChange}
            categories={state.categories}
          />
        ) : (
          <Dashboard 
            users={state.users} 
            tasks={state.tasks} 
            onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 h-16 border-t flex justify-around items-center px-4 z-40 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <button 
          onClick={() => setView('board')}
          className={`flex flex-col items-center gap-1 ${view === 'board' ? 'text-blue-500' : 'text-slate-500'}`}
        >
          <CalendarIcon />
          <span className="text-[10px]">タスク</span>
        </button>
        {state.currentUser.role === 'admin' && (
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-teal-500' : 'text-slate-500'}`}
          >
            <BarChartIcon />
            <span className="text-[10px]">分析</span>
          </button>
        )}
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-500"
        >
          <SettingsIcon />
          <span className="text-[10px]">設定</span>
        </button>
      </nav>

      {/* Modals & Overlays */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        currentUserId={state.currentUser.id}
        adminUsers={state.currentUser.role === 'admin' ? state.users.filter(u => u.role === 'member') : undefined}
        categories={state.categories}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={state.currentUser}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
        categories={state.categories}
        onSaveCategories={handleSaveCategories}
      />

      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        title="タスクの削除"
        message="このタスクを削除してもよろしいですか？この操作は取り消せません。"
        onConfirm={confirmDeleteTask}
        onCancel={() => { setIsConfirmModalOpen(false); setTaskToDelete(null); }}
        isDarkMode={isDarkMode}
      />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-right-10 duration-300 pointer-events-auto ${
              toast.type === 'success' ? 'bg-teal-900/90 border-teal-500 text-teal-100' : 
              toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 
              'bg-slate-800/90 border-slate-600 text-slate-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-teal-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`} />
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
