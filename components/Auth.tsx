
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('ユーザー名またはパスワードが正しくありません');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-2xl shadow-blue-500/20">
            <span className="text-white text-3xl font-black">TF</span>
          </div>
          <h1 className="text-4xl font-black mb-2 text-slate-900 dark:text-white">TaskFlow</h1>
          <p className="text-slate-500 dark:text-slate-400">チームのタスク管理をよりシンプルに、効率的に。</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm px-4 py-3 rounded-xl animate-bounce">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">ユーザー名</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                placeholder="admin / alice / bob"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">パスワード</label>
              <input
                type="password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              ログイン
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 mb-4 text-center">デモ用アカウント情報</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-700 dark:text-slate-300">Admin</p>
                <p>U: admin / P: admin123</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-700 dark:text-slate-300">Member</p>
                <p>U: alice / P: pass123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
