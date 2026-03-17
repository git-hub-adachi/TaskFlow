
import React, { useState, useMemo } from 'react';
import { Task, User, Status, Category, Priority } from '../types';
import { 
  PRIORITY_CONFIG, 
  STATUS_LABELS, 
  INTENSITY_ICON 
} from '../constants';
import { 
  EditIcon, 
  TrashIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckIcon 
} from './Icons';

interface TaskBoardProps {
  tasks: Task[];
  user: User;
  isAdminMode?: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onDateChange: (id: string, date: string) => void;
  categories: Category[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  user, 
  isAdminMode = false, 
  onEditTask, 
  onDeleteTask, 
  onUpdateStatus,
  onDateChange,
  categories
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchStatus = filter.status === 'all' || t.status === filter.status;
      const matchPriority = filter.priority === 'all' || t.priority === filter.priority;
      const matchCategory = filter.category === 'all' || t.category === filter.category;
      const matchSearch = t.title.toLowerCase().includes(filter.search.toLowerCase()) || 
                          t.description.toLowerCase().includes(filter.search.toLowerCase());
      return matchStatus && matchPriority && matchCategory && matchSearch;
    });
  }, [tasks, filter]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + offset);
    setCurrentDate(next);
  };

  const changeDay = (offset: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    setCurrentDate(next);
  };

  const renderTaskCard = (task: Task, isSmall = false) => {
    const isDone = task.status === 'done';
    const isOverdue = new Date(task.endDate || task.date) < new Date(new Date().setHours(0,0,0,0)) && !isDone;
    const isSoon = !isDone && (task.date === new Date().toISOString().split('T')[0] || 
                    task.date === new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    const category = categories.find(c => c.id === task.category);

    return (
      <div 
        key={task.id} 
        className={`group relative bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer ${isOverdue ? 'border-red-500/50 bg-red-50 dark:bg-red-950/10' : ''}`}
        style={!isDone ? { borderLeft: `4px solid ${category?.color || '#3b82f6'}` } : {}}
        onClick={() => onEditTask(task)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-teal-500' : task.status === 'inprogress' ? 'bg-blue-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
              <h4 className={`font-medium truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-200'}`}>
                {task.title}
              </h4>
              {isSoon && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded animate-pulse font-bold">Soon</span>}
            </div>
            {!isSmall && task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, isDone ? 'todo' : 'done'); }}
              className={`p-1.5 rounded-lg transition-colors ${isDone ? 'bg-teal-500/20 text-teal-600 dark:text-teal-500' : 'bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-teal-500/20 hover:text-teal-600 dark:hover:text-teal-500'}`}
            >
              <CheckIcon />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-500 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color}`}>
            {PRIORITY_CONFIG[task.priority].label}
          </span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
            {category?.label || '不明'}
          </span>
          <span className="text-[10px] flex items-center gap-0.5">
            {Array.from({ length: task.intensity }).map((_, i) => <span key={i}>{INTENSITY_ICON}</span>)}
          </span>
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
            {task.isAllDay ? '終日' : `${task.startTime} - ${task.endTime}`}
          </span>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const selectedDateStr = currentDate.toISOString().split('T')[0];
    const dayTasks = filteredTasks.filter(t => {
      const startDate = t.date;
      const endDate = t.endDate || t.date;
      return startDate <= selectedDateStr && endDate >= selectedDateStr;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronLeftIcon /></button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </h2>
          <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronRightIcon /></button>
        </div>

        {dayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500">この日の予定はありません</p>
          </div>
        ) : (
          <div className="relative pl-8 border-l border-slate-200 dark:border-slate-700 space-y-6">
            {dayTasks.map(task => (
              <div key={task.id} className="relative">
                <div className="absolute -left-[41px] top-4 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <div className="absolute -left-[45px] -top-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">{task.startTime}</div>
                {renderTaskCard(task)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, month: month - 1, year, isCurrent: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, isCurrent: true });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, isCurrent: false });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <div className="animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronLeftIcon /></button>
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ChevronRightIcon /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['日', '月', '火', '水', '木', '金', '土'].map(d => (
            <div key={d} className="text-center text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 py-1 md:py-2">{d}</div>
          ))}
          {days.map((d, i) => {
            const dateObj = new Date(d.year, d.month, d.day);
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const dayTasks = filteredTasks.filter(t => {
              const startDate = t.date;
              const endDate = t.endDate || t.date;
              return startDate <= dateStr && endDate >= dateStr;
            });

            return (
              <div 
                key={i} 
                className={`min-h-[80px] md:min-h-[100px] p-0.5 md:p-1 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-800 transition-colors ${d.isCurrent ? 'bg-white dark:bg-slate-800/40' : 'bg-slate-50 dark:bg-slate-900/20 opacity-40'} ${isToday ? 'ring-2 ring-blue-500 border-blue-500 z-10' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) onDateChange(taskId, dateStr);
                }}
              >
                <div className="flex justify-between items-center mb-0.5 md:mb-1">
                  <span className={`text-[10px] md:text-xs font-bold px-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {d.day}
                  </span>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  {dayTasks.slice(0, 3).map(t => {
                    const cat = categories.find(c => c.id === t.category);
                    return (
                      <div 
                        key={t.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                        onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
                        className={`text-[8px] md:text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer shadow-sm transition-transform hover:scale-105 ${t.status === 'done' ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-500 line-through' : 'border font-medium'}`}
                        style={t.status !== 'done' ? { backgroundColor: `${cat?.color}20`, color: cat?.color, borderColor: `${cat?.color}40` } : {}}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[8px] text-center text-slate-400 dark:text-slate-500">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            カレンダー
          </button>
          <button 
            onClick={() => setViewMode('day')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'day' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            デイリー
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="タスクを検索..." 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 transition-colors"
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
          />
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="all">すべての状態</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={filter.priority}
            onChange={e => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="all">すべての優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/40 rounded-2xl md:rounded-3xl p-2 md:p-6 border border-slate-200 dark:border-slate-800 min-h-[500px] md:min-h-[600px] transition-colors">
        {viewMode === 'day' ? renderDayView() : renderCalendarView()}
      </div>
    </div>
  );
};

export default TaskBoard;
