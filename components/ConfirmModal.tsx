
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`rounded-3xl w-full max-w-sm shadow-2xl border overflow-hidden animate-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>
        </div>
        <div className={`px-6 py-4 flex justify-end gap-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
          <button 
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            キャンセル
          </button>
          <button 
            onClick={onConfirm}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
