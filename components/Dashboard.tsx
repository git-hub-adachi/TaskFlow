
import React from 'react';
import { User, Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

// Removed unused imports of TrashIcon, EditIcon, and PRIORITY_CONFIG which were incorrectly pointing to ../constants

interface DashboardProps {
  users: User[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ users, tasks, onEditTask, onDeleteTask, isDarkMode }) => {
  const members = users.filter(u => u.role === 'member');
  
  const memberStats = members.map(user => {
    const userTasks = tasks.filter(t => t.userId === user.id);
    const completed = userTasks.filter(t => t.status === 'done').length;
    const inProgress = userTasks.filter(t => t.status === 'inprogress').length;
    const todo = userTasks.filter(t => t.status === 'todo').length;
    const total = userTasks.length;
    const intensitySum = userTasks.reduce((acc, t) => acc + t.intensity, 0);
    const workloadScore = total > 0 ? (intensitySum / total).toFixed(1) : '0';
    
    // This week tasks
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    const thisWeek = userTasks.filter(t => new Date(t.date) >= lastWeek).length;

    return {
      user,
      total,
      completed,
      inProgress,
      todo,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      intensitySum,
      workloadScore,
      thisWeek,
      high: userTasks.filter(t => t.priority === 'high').length,
      medium: userTasks.filter(t => t.priority === 'medium').length,
      low: userTasks.filter(t => t.priority === 'low').length,
    };
  });

  const overallCompleted = tasks.filter(t => t.status === 'done').length;
  const overallRemaining = tasks.length - overallCompleted;
  
  const pieData = [
    { name: '完了', value: overallCompleted, color: '#14b8a6' },
    { name: '未完了', value: overallRemaining, color: '#475569' },
  ];

  const workloadChartData = memberStats.map(s => ({
    name: s.user.name,
    score: parseFloat(s.workloadScore),
    total: s.total
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">総タスク数</p>
          <p className="text-3xl font-bold">{tasks.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">平均完了率</p>
          <p className="text-3xl font-bold">
            {tasks.length > 0 ? Math.round((overallCompleted / tasks.length) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">活動中メンバー</p>
          <p className="text-3xl font-bold">{members.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">今週の新規</p>
          <p className="text-3xl font-bold">{memberStats.reduce((a, b) => a + b.thisWeek, 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <h3 className="text-lg font-bold mb-6">メンバー別ワークロード比較</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChartData}>
                <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={12} />
                <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '8px',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                  itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                />
                <Bar dataKey="score" name="平均負荷スコア" radius={[4, 4, 0, 0]}>
                   {workloadChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#14b8a6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center transition-colors">
          <h3 className="text-lg font-bold mb-4">全体完了率</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                     backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                     border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
                     borderRadius: '8px',
                     color: isDarkMode ? '#f8fafc' : '#0f172a'
                   }}
                   itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-teal-500 rounded-full"></div>完了</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 dark:bg-slate-600 rounded-full"></div>未完了</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">メンバー進捗状況</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberStats.map(stat => (
            <div key={stat.user.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{stat.user.name}</h4>
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Member ID: {stat.user.id}</p>
                </div>
                <div className="bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                  Workload: {stat.workloadScore}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>完了率</span>
                  <span className="font-bold">{stat.rate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-1000" 
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-500">完了</p>
                    <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{stat.completed}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-500">進行</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stat.inProgress}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded text-center">
                    <p className="text-xs text-slate-500">未着手</p>
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-400">{stat.todo}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">高: {stat.high}</span>
                   <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">中: {stat.medium}</span>
                   <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">低: {stat.low}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
