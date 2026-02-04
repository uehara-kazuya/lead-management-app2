
import React, { useMemo, useState } from 'react';
import { SpreadsheetRow } from '../types';

interface DashboardOverviewProps {
  data: SpreadsheetRow[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ data }) => {
  // フィルタ状態
  const [selectedStage, setSelectedStage] = useState<string>('active_only');
  const [filterStageCard, setFilterStageCard] = useState<string | null>(null);
  const [filterProbCard, setFilterProbCard] = useState<string | null>(null);

  // Helper to calculate days between two date strings
  const getDaysBetween = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return null;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const analytics = useMemo(() => {
    const stageCounts: Record<string, number> = {};
    const probabilityCounts: Record<string, number> = {};
    const categories: Record<string, number> = {};
    const sources: Record<string, number> = {};
    
    const uniqueStages = new Set<string>();

    data.forEach(row => {
      const stage = String(row['ステージ'] || '未設定'); 
      const prob = String(row['確度'] || '未設定');
      const cat = String(row['事業内容'] || 'その他');
      const source = String(row['経路'] || '不明');

      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      probabilityCounts[prob] = (probabilityCounts[prob] || 0) + 1;
      categories[cat] = (categories[cat] || 0) + 1;
      sources[source] = (sources[source] || 0) + 1;
      
      if (stage && stage !== '未設定') uniqueStages.add(stage);
    });

    // Lead Time Analytics - フィルタリングと最新順ソート
    const leadTimes = data
      .filter(row => row['アプローチ日'] && String(row['アプローチ日']).trim() !== '')
      .map(row => {
        const approachDate = String(row['アプローチ日']);
        return {
          company: String(row['企業名'] || '未設定'),
          stage: String(row['ステージ'] || '未設定'),
          probability: String(row['確度'] || '未設定'),
          approachDate: approachDate,
          daysToM1: getDaysBetween(approachDate, String(row['商談日1'] || '')),
          daysToM2: getDaysBetween(approachDate, String(row['商談日2'] || '')),
          daysToM3: getDaysBetween(approachDate, String(row['商談日3'] || '')),
          daysToM4: getDaysBetween(approachDate, String(row['商談日4'] || '')),
          daysToM5: getDaysBetween(approachDate, String(row['商談日5'] || '')),
        };
      })
      // 絞り込みロジック
      .filter(item => {
        // ステージドロップダウンフィルタ
        if (selectedStage === 'active_only') {
          if (item.stage === '失注') return false;
        } else if (selectedStage !== 'all') {
          if (item.stage !== selectedStage) return false;
        }

        // カードクリックフィルタ (ステージ)
        if (filterStageCard && item.stage !== filterStageCard) return false;

        // カードクリックフィルタ (確度)
        if (filterProbCard && item.probability !== filterProbCard) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.approachDate).getTime();
        const dateB = new Date(b.approachDate).getTime();
        return dateB - dateA;
      });

    return {
      stages: Object.entries(stageCounts).sort(),
      probability: Object.entries(probabilityCounts).sort((a, b) => b[1] - a[1]),
      categories: Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 6),
      sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6),
      leadTimes,
      allStages: Array.from(uniqueStages).sort()
    };
  }, [data, selectedStage, filterStageCard, filterProbCard]);

  const handleStageCardClick = (stage: string) => {
    setFilterStageCard(prev => prev === stage ? null : stage);
  };

  const handleProbCardClick = (prob: string) => {
    setFilterProbCard(prev => prev === prob ? null : prob);
  };

  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];

  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Interactive Stage Cards */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
            <i className="fas fa-layer-group mr-2 text-indigo-500"></i>
            ステージ別件数
            {(filterStageCard || filterProbCard) && (
              <button 
                onClick={() => { setFilterStageCard(null); setFilterProbCard(null); }}
                className="ml-4 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all"
              >
                フィルタを解除
              </button>
            )}
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">カードをクリックで表を絞り込み</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {analytics.stages.map(([name, count], i) => (
            <div 
              key={name} 
              onClick={() => handleStageCardClick(name)}
              className={`flex-1 min-w-[100px] border p-3 rounded-xl transition-all cursor-pointer group relative overflow-hidden ${
                filterStageCard === name 
                  ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 border-slate-100 hover:border-indigo-300 hover:bg-white'
              }`}
            >
              <p className={`text-[10px] font-bold truncate mb-1 ${filterStageCard === name ? 'text-indigo-100' : 'text-slate-400'}`} title={name}>{name}</p>
              <div className="flex items-baseline justify-between">
                <span className={`text-lg font-black ${filterStageCard === name ? 'text-white' : 'text-slate-700'}`}>{count}</span>
                <span className={`text-[10px] font-medium ${filterStageCard === name ? 'text-indigo-200' : 'text-slate-400'}`}>件</span>
              </div>
              <div className={`w-full h-1 mt-2 rounded-full overflow-hidden ${filterStageCard === name ? 'bg-indigo-400/30' : 'bg-slate-200'}`}>
                <div 
                  className={`${filterStageCard === name ? 'bg-white' : colors[i % colors.length]} h-full transition-all duration-1000`} 
                  style={{ width: `${(count / data.length) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Probability Cards Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
            <i className="fas fa-chart-line mr-2 text-emerald-500"></i>
            確度別件数
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {analytics.probability.map(([name, count], i) => (
            <div 
              key={name} 
              onClick={() => handleProbCardClick(name)}
              className={`border p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                filterProbCard === name 
                  ? 'bg-emerald-600 border-emerald-600 shadow-emerald-100' 
                  : 'bg-emerald-50/30 border-emerald-100 hover:bg-white hover:border-emerald-300'
              }`}
            >
              <p className={`text-[10px] font-bold truncate mb-1 ${filterProbCard === name ? 'text-emerald-100' : 'text-emerald-700'}`}>{name}</p>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-black ${filterProbCard === name ? 'text-white' : 'text-emerald-800'}`}>{count}</span>
                <span className={`text-[9px] uppercase font-black ${filterProbCard === name ? 'text-emerald-200' : 'text-emerald-600'}`}>RECORDS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Time Analysis Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 bg-white sticky top-0 z-10">
          <div className="flex items-center">
            <i className="fas fa-hourglass-half mr-3 text-violet-500 text-lg"></i>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                リードタイム分析 (アプローチ日から商談までの経過日数)
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  アプローチ日のある全レコードを最新順に表示中
                </p>
                {filterStageCard && <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">ステージ: {filterStageCard}</span>}
                {filterProbCard && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">確度: {filterProbCard}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-72 shadow-inner">
              <i className="fas fa-filter text-slate-400 mr-2 text-xs"></i>
              <select 
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-transparent text-[11px] font-black text-slate-600 uppercase tracking-wider outline-none w-full cursor-pointer py-1"
              >
                <option value="active_only">失注を除く (デフォルト)</option>
                <option value="all">すべてのステージを表示</option>
                <optgroup label="ステージ別絞り込み">
                  {analytics.allStages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-2 rounded-full whitespace-nowrap">
              表示数: {analytics.leadTimes.length} 件
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[700px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-20 shadow-sm">
                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-200 whitespace-nowrap">企業名 / ステージ・確度</th>
                <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center bg-slate-50 border-b border-slate-200 whitespace-nowrap">アプローチ日</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/50 border-b border-indigo-100 whitespace-nowrap">商談1まで</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/50 border-b border-indigo-100 whitespace-nowrap">商談2まで</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/50 border-b border-indigo-100 whitespace-nowrap">商談3まで</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/50 border-b border-indigo-100 whitespace-nowrap">商談4まで</th>
                <th className="py-3 px-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/50 border-b border-indigo-100 whitespace-nowrap">商談5まで</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {analytics.leadTimes.length > 0 ? (
                analytics.leadTimes.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/10 transition-colors group">
                    <td className="py-3.5 px-4 border-b border-slate-50">
                      <p className="text-xs font-black text-slate-800 truncate max-w-[220px]" title={item.company}>{item.company}</p>
                      <div className="flex items-center mt-1 space-x-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none uppercase tracking-tighter ${item.stage === '失注' ? 'text-slate-400 bg-slate-100' : 'text-indigo-500 bg-indigo-50'}`}>
                          {item.stage}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none uppercase tracking-tighter">
                          {item.probability}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-[11px] font-bold text-slate-500 whitespace-nowrap border-b border-slate-50">
                      {item.approachDate}
                    </td>
                    {[item.daysToM1, item.daysToM2, item.daysToM3, item.daysToM4, item.daysToM5].map((days, i) => (
                      <td key={i} className={`py-3.5 px-4 text-center border-b border-slate-50 ${i % 2 === 0 ? 'bg-indigo-50/5' : ''}`}>
                        {days !== null ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black ${days > 30 ? 'text-rose-500' : days > 14 ? 'text-amber-500' : 'text-slate-700'}`}>
                              {days} <span className="text-[9px] font-bold opacity-60">日</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-200 text-xs">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-slate-400 text-xs italic font-bold">
                    条件に一致する案件が見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-start space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <i className="fas fa-circle-info mt-0.5 text-indigo-400"></i>
            <span>経過日数アラート基準 / ステージ分類 (S=ステージ, D=確度詳細)</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
               30日以上 (要注意)
             </div>
             <div className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded border border-amber-100 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
               14日以上
             </div>
             <div className="flex items-center text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 shadow-sm">
               <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
               通常
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
