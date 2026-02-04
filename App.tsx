
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, SpreadsheetRow } from './types';
import { fetchSpreadsheetData } from './services/spreadsheetService';
import StatsCards from './components/StatsCards';
import DataTable from './components/DataTable';
import DashboardOverview from './components/DashboardOverview';
import InsightsAnalysis from './components/InsightsAnalysis';
import ProgressTracker from './components/ProgressTracker';
import KPIDashboard from './components/KPIDashboard';
import { DISPLAY_HEADERS } from './constants';

type ViewMode = 'summary' | 'database' | 'insights' | 'progress' | 'kpi';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('summary');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [state, setState] = useState<AppState>({
    data: [],
    headers: [],
    isLoading: true,
    lastUpdated: null,
    error: null,
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { rows, headers } = await fetchSpreadsheetData();
      setState(prev => ({
        ...prev,
        data: rows,
        headers: headers,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'データの取得に失敗しました。シートの公開設定を確認してください。',
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getWeekKey = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return `${monday.getFullYear()}/${(monday.getMonth() + 1).toString().padStart(2, '0')}/${monday.getDate().toString().padStart(2, '0')}の週`;
  };

  const availableWeeks = useMemo(() => {
    const weeks = new Set<string>();
    state.data.forEach(row => {
      const weekKey = getWeekKey(String(row['アプローチ日'] || ''));
      if (weekKey) weeks.add(weekKey);
    });
    return Array.from(weeks).sort().reverse();
  }, [state.data]);

  const filteredData = useMemo(() => {
    if (selectedWeek === 'all') return state.data;
    return state.data.filter(row => getWeekKey(String(row['アプローチ日'] || '')) === selectedWeek);
  }, [state.data, selectedWeek]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10 flex flex-col text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 sm:px-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <i className="fas fa-database text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Enterprise Console</h1>
              <div className="flex items-center space-x-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global CRM Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {state.isLoading && (
              <span className="flex items-center text-[10px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-100">
                <i className="fas fa-sync fa-spin mr-2"></i> 同期中...
              </span>
            )}
            <button
              onClick={loadData}
              disabled={state.isLoading}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                state.isLoading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 hover:shadow-lg hover:shadow-slate-200'
              }`}
            >
              <i className="fas fa-rotate text-[10px]"></i>
              <span>データ更新</span>
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 overflow-x-auto">
        <div className="max-w-[1600px] mx-auto flex">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeView === 'summary'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-chart-pie mr-2.5"></i>
            サマリー
          </button>
          <button
            onClick={() => setActiveView('kpi')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeView === 'kpi'
                ? 'border-rose-600 text-rose-600 bg-rose-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-bullseye mr-2.5"></i>
            KPI達成率
          </button>
          <button
            onClick={() => setActiveView('progress')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeView === 'progress'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-list-check mr-2.5"></i>
            マイルストーン
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeView === 'insights'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-lightbulb mr-2.5"></i>
            インサイト
          </button>
          <button
            onClick={() => setActiveView('database')}
            className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${
              activeView === 'database'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-table-list mr-2.5"></i>
            データベース
          </button>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {state.error ? (
          <div className="bg-white border-2 border-red-50 p-12 rounded-3xl text-center shadow-2xl shadow-red-100/20 max-w-2xl mx-auto">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <i className="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">接続エラーが発生しました</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{state.error}</p>
            <button onClick={loadData} className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 uppercase tracking-widest text-xs">
              再試行する
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeView === 'summary' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">ビジネスサマリー分析</h2>
                </div>
                <StatsCards count={filteredData.length} lastUpdated={state.lastUpdated} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} availableWeeks={availableWeeks} />
                {!state.isLoading && <DashboardOverview data={filteredData} />}
              </div>
            )}
            {activeView === 'kpi' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 bg-rose-600 rounded-full"></div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">KPI目標管理・達成状況</h2>
                </div>
                {!state.isLoading && <KPIDashboard data={filteredData} />}
              </div>
            )}
            {activeView === 'progress' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 bg-sky-500 rounded-full"></div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">AJ:BY リアルタイム・アクション進捗</h2>
                </div>
                {!state.isLoading && <ProgressTracker data={filteredData} headers={state.headers} />}
              </div>
            )}
            {activeView === 'insights' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">インサイト・戦略分析</h2>
                </div>
                {!state.isLoading && <InsightsAnalysis data={filteredData} />}
              </div>
            )}
            {activeView === 'database' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">マスターデータビュー</h2>
                  </div>
                </div>
                <DataTable headers={DISPLAY_HEADERS} data={filteredData} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 border-t border-slate-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
            Professional Enterprise Data Management Platform
          </p>
          <p className="text-slate-300 text-[9px] font-medium">
            &copy; 2024 CRM Operations Center. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
