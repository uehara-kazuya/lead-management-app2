
import React, { useState, useMemo, useEffect } from 'react';
import { SpreadsheetRow, KPITargets } from '../types';

interface KPIDashboardProps {
  data: SpreadsheetRow[];
}

type AnalysisDimension = '担当者' | '事業内容' | '経路';

const KPIDashboard: React.FC<KPIDashboardProps> = ({ data }) => {
  const [dimension, setDimension] = useState<AnalysisDimension>('担当者');
  const [targets, setTargets] = useState<KPITargets>(() => {
    const saved = localStorage.getItem('crm_kpi_targets');
    return saved ? JSON.parse(saved) : {
      revenue: 10000000,
      dealCount: 20,
      conversionRate: 15,
      avgDealSize: 500000
    };
  });

  useEffect(() => {
    localStorage.setItem('crm_kpi_targets', JSON.stringify(targets));
  }, [targets]);

  const parseCurrency = (val: any) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    return parseFloat(clean) || 0;
  };

  const stats = useMemo(() => {
    const wonDeals = data.filter(row => 
      String(row['ステージ']).includes('契約') || 
      String(row['契約']).trim() !== ''
    );

    const actualRevenue = wonDeals.reduce((sum, row) => sum + parseCurrency(row['見積り・提案'] || row['プラン']), 0);
    
    // 着地予測 (現在の売上 + 商談中案件の確度加重平均)
    const pipelineRevenue = data
      .filter(row => !String(row['ステージ']).includes('失注') && !String(row['ステージ']).includes('契約'))
      .reduce((sum, row) => {
        const amount = parseCurrency(row['見積り・提案'] || row['プラン']);
        const probabilityStr = String(row['確度'] || '0%');
        const prob = (parseFloat(probabilityStr) || 0) / 100;
        return sum + (amount * prob);
      }, 0);

    const actualDealCount = wonDeals.length;
    const actualConvRate = data.length > 0 ? (actualDealCount / data.length) * 100 : 0;
    const actualAvgSize = actualDealCount > 0 ? actualRevenue / actualDealCount : 0;

    return {
      revenue: actualRevenue,
      forecast: actualRevenue + pipelineRevenue,
      dealCount: actualDealCount,
      convRate: actualConvRate,
      avgSize: actualAvgSize
    };
  }, [data]);

  // セグメント別分析データの算出
  const dimensionData = useMemo(() => {
    const groups: Record<string, { revenue: number, count: number, total: number }> = {};
    
    data.forEach(row => {
      const key = String(row[dimension] || '未設定');
      if (!groups[key]) groups[key] = { revenue: 0, count: 0, total: 0 };
      
      groups[key].total++;
      if (String(row['ステージ']).includes('契約') || String(row['契約']).trim() !== '') {
        groups[key].count++;
        groups[key].revenue += parseCurrency(row['見積り・提案'] || row['プラン']);
      }
    });

    return Object.entries(groups)
      .map(([name, g]) => ({
        name,
        revenue: g.revenue,
        dealCount: g.count,
        convRate: (g.count / g.total) * 100,
        avgSize: g.count > 0 ? g.revenue / g.count : 0,
        contribution: (g.revenue / (stats.revenue || 1)) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data, dimension, stats.revenue]);

  const handleTargetChange = (key: keyof KPITargets, val: string) => {
    const num = parseFloat(val) || 0;
    setTargets(prev => ({ ...prev, [key]: num }));
  };

  const KPICard = ({ title, icon, actual, target, suffix, isCurrency = false, forecast }: any) => {
    const percent = Math.min(100, Math.round((actual / target) * 100)) || 0;
    const isOver = actual >= target;

    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full transition-all hover:shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${isOver ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-indigo-600'}`}>
            <i className={`fas ${icon}`}></i>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline justify-end space-x-1">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {isCurrency ? actual.toLocaleString() : actual.toFixed(actual > 100 ? 0 : 1)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{suffix}</span>
            </div>
          </div>
        </div>

        {forecast && (
          <div className="mb-4 px-3 py-1.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
            <div className="flex justify-between items-center text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              <span>着地予測 (Forecast)</span>
              <span className="text-indigo-600">{forecast.toLocaleString()}円</span>
            </div>
          </div>
        )}

        <div className="mt-auto space-y-2">
          <div className="flex justify-between items-end">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isOver ? 'text-emerald-600' : 'text-slate-500'}`}>
              達成率: {percent}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-tight">目標: {isCurrency ? target.toLocaleString() : target}{suffix}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isOver ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ターゲット設定 & フォアキャスト・サマリー */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard title="実績売上" icon="fa-yen-sign" actual={stats.revenue} target={targets.revenue} suffix="円" isCurrency={true} forecast={stats.forecast} />
          <KPICard title="成約数" icon="fa-handshake" actual={stats.dealCount} target={targets.dealCount} suffix="件" />
        </div>
        
        {/* 目標入力パネル */}
        <div className="xl:col-span-4 bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-rose-900/40">
              <i className="fas fa-bullseye"></i>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">目標数値管理</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">売上目標 (¥)</label>
              <input 
                type="number" value={targets.revenue} 
                onChange={(e) => handleTargetChange('revenue', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">成約目標 (件)</label>
              <input 
                type="number" value={targets.dealCount} 
                onChange={(e) => handleTargetChange('dealCount', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CVR目標 (%)</label>
              <input 
                type="number" value={targets.conversionRate} 
                onChange={(e) => handleTargetChange('conversionRate', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">単価目標 (¥)</label>
              <input 
                type="number" value={targets.avgDealSize} 
                onChange={(e) => handleTargetChange('avgDealSize', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* セグメント別パフォーマンス分析テーブル */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">セグメント別・収益性分析</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">どの軸が最も目標達成に寄与しているかを表示</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['担当者', '事業内容', '経路'] as AnalysisDimension[]).map(d => (
              <button
                key={d}
                onClick={() => setDimension(d)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  dimension === d 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{dimension}</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">確定売上</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">成約数</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">CVR</th>
                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">平均単価</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">売上貢献度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dimensionData.map((item, i) => (
                <tr key={item.name} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-xs font-black text-slate-800 tracking-tight">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className="text-xs font-black text-slate-700">{item.revenue.toLocaleString()}円</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{item.dealCount}件</span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-black text-indigo-600">{item.convRate.toFixed(1)}%</span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${item.convRate}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className="text-xs font-medium text-slate-500">{item.avgSize.toLocaleString()}円</span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-slate-800">{item.contribution.toFixed(1)}%</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" 
                          style={{ width: `${item.contribution}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><i className="fas fa-info-circle text-indigo-400"></i> 売上貢献度は「全体の確定売上」に対する割合です</span>
            </div>
            <span>TOTAL ANALYZED: {dimensionData.length} SEGMENTS</span>
          </div>
        </div>
      </div>

      {/* 目標達成までのギャップ（簡易版） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">売上着地見込み・ギャップ</h4>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-500">達成予測進捗</span>
                <span className="text-sm font-black text-indigo-600">{( (stats.forecast / targets.revenue) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative p-0.5">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.revenue / targets.revenue) * 100)}%` }}></div>
                <div className="absolute h-full bg-indigo-300/30 top-0 rounded-full" style={{ left: `${(stats.revenue / targets.revenue) * 100}%`, width: `${Math.min(100 - (stats.revenue / targets.revenue) * 100, ((stats.forecast - stats.revenue) / targets.revenue) * 100)}%` }}></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">不足額 (vs目標)</p>
              <p className="text-xl font-black text-rose-500">▲ {Math.max(0, targets.revenue - stats.forecast).toLocaleString()}円</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">KPI品質チェック</h4>
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1">現状単価 vs 目標</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${stats.avgSize >= targets.avgDealSize ? 'text-emerald-500' : 'text-slate-800'}`}>
                  {stats.avgSize.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">円</span>
              </div>
            </div>
            <div className="flex flex-col border-l border-slate-100 pl-8">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1">現状CVR vs 目標</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${stats.convRate >= targets.conversionRate ? 'text-emerald-500' : 'text-slate-800'}`}>
                  {stats.convRate.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
