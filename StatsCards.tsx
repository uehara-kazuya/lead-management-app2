
import React from 'react';

interface StatsCardsProps {
  count: number;
  lastUpdated: Date | null;
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  availableWeeks: string[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ count, lastUpdated, selectedWeek, onWeekChange, availableWeeks }) => {
  const formatTime = (date: Date | null) => {
    if (!date) return '---';
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '---';
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      {/* Record Count Card */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 shrink-0">
          <i className="fas fa-database text-xl"></i>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">レコード件数</p>
          <h3 className="text-2xl font-bold text-slate-800 leading-none truncate">
            {count.toLocaleString()} <span className="text-sm font-normal text-slate-400">件</span>
          </h3>
        </div>
      </div>

      {/* Week Selection Card (Middle) */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-indigo-100 flex items-center space-x-4 transition-all hover:shadow-md ring-2 ring-indigo-50/50">
        <div className="bg-indigo-600 p-3 rounded-lg text-white shrink-0">
          <i className="fas fa-calendar-week text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">週で検索</p>
          <div className="relative">
            <select
              value={selectedWeek}
              onChange={(e) => onWeekChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-2 pr-8 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">すべての期間</option>
              {availableWeeks.map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
              <i className="fas fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Card */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 transition-all hover:shadow-md">
        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600 shrink-0">
          <i className="fas fa-clock-rotate-left text-xl"></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">最終更新日時</p>
          <div className="flex items-baseline space-x-2 truncate">
            <h3 className="text-xl font-bold text-slate-800 leading-none">{formatTime(lastUpdated)}</h3>
            <p className="text-[10px] text-slate-400 font-medium leading-none truncate">{formatDate(lastUpdated)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
