
import React, { useState, useEffect } from 'react';
import { User, Category } from '../types';
import { LogOutIcon, SettingsIcon, CheckIcon, TrashIcon, PlusIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onLogout, onUpdateUser, categories, onSaveCategories }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(user.preferences?.notifications ?? true);
  const [darkMode, setDarkMode] = useState(user.preferences?.darkMode ?? true);
  const [language, setLanguage] = useState(user.preferences?.language ?? 'ja');
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setEmail(user.email || '');
      setNotifications(user.preferences?.notifications ?? true);
      setDarkMode(user.preferences?.darkMode ?? true);
      setLanguage(user.preferences?.language ?? 'ja');
      setLocalCategories(categories);
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, user, categories]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    const updatedUser: User = {
      ...user,
      name,
      email,
      preferences: {
        darkMode,
        notifications,
        language,
      }
    };

    if (password) {
      updatedUser.password = password;
    }

    onUpdateUser(updatedUser);
    onSaveCategories(localCategories);
    setSuccess(true);
    setPassword('');
    setConfirmPassword('');
    
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
              <SettingsIcon />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">アカウント設定</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-6">
            {/* User Profile Section */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">プロフィール</p>
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">表示名</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">メールアドレス</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">セキュリティ</p>
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">新しいパスワード</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="変更する場合のみ入力"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                  />
                </div>
                {password && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 ml-1">パスワード（確認）</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Category Management Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">カテゴリ設定</p>
                <button 
                  type="button"
                  onClick={() => {
                    const newCat = { id: `cat_${Date.now()}`, label: '新カテゴリ', color: '#3b82f6' };
                    setLocalCategories([...localCategories, newCat]);
                  }}
                  className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-xs font-bold"
                >
                  <PlusIcon /> 追加
                </button>
              </div>
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {localCategories.map((cat, idx) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={cat.color}
                      onChange={(e) => {
                        const next = [...localCategories];
                        next[idx].color = e.target.value;
                        setLocalCategories(next);
                      }}
                      className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={cat.label}
                      onChange={(e) => {
                        const next = [...localCategories];
                        next[idx].label = e.target.value;
                        setLocalCategories(next);
                      }}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-white"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (localCategories.length > 1) {
                          setLocalCategories(localCategories.filter((_, i) => i !== idx));
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings Items */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">アプリ設定</p>
              <button 
                type="button"
                onClick={() => setNotifications(!notifications)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all group"
              >
                <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-sm">通知設定</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${notifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
              <button 
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all group"
              >
                <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-sm">ダークモード</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`} />
                </div>
              </button>
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl group">
                <span className="text-slate-600 dark:text-slate-300 text-sm">言語</span>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-xs text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-xs px-2">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs px-2">
                <CheckIcon />
                <span>設定を保存しました</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              変更を保存
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-bold transition-all"
            >
              <LogOutIcon />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
