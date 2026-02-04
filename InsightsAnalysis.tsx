
import React, { useMemo } from 'react';
import { SpreadsheetRow } from '../types';

interface InsightsAnalysisProps {
  data: SpreadsheetRow[];
}

const InsightsAnalysis: React.FC<InsightsAnalysisProps> = ({ data }) => {
  const analytics = useMemo(() => {
    // 1. Pipeline Funnel Calculation
    const stages = ['S3', 'S4', 'S5', 'S6', '契約'];
    const funnelCounts = stages.map(s => ({
      stage: s,
      count: data.filter(row => String(row['ステージ']).includes(s)).length
    }));
    // Note: Actual '契約' might be a separate field but here we check stage inclusion
    const contractCount = data.filter(row => String(row['ステージ']).includes('契約') || row['契約']).length;
    funnelCounts[4] = { stage: '契約', count: contractCount };

    // 2. Staff Workload
    const staffStats: Record<string, { total: number, active: number }> = {};
    data.forEach(row => {
      const staff = String(row['担当者'] || '未設定');
      if (!staffStats[staff]) staffStats[staff] = { total: 0, active: 0 };
      staffStats[staff].total++;
      if (row['ステージ'] !== '失注') staffStats[staff].active++;
    });

    // 3. Stagnant Leads (Alert System)
    // Logic: If approach date is > 14 days ago and no Meeting 1, or Meeting 1 happened > 30 days ago and no Meeting 2
    const now = new Date();
    const stagnantLeads = data
      .filter(row => row['ステージ'] !== '失注' && row['ステージ'] !== '契約')
      .map(row => {
        const approachDate = row['アプローチ日'] ? new Date(String(row['アプローチ日'])) : null;
        const m1 = row['商談日1'] ? new Date(String(row['商談日1'])) : null;
        const m2 = row['商談日2'] ? new Date(String(row['商談日2'])) : null;
        
        let riskScore = 0;
        let reason = '';

        if (approachDate && !m1) {
          const diff = (now.getTime() - approachDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diff > 14) {
            riskScore = Math.min(100, Math.floor(diff * 2));
            reason = 'アプローチ後、初回商談なし';
          }
        } else if (m1 && !m2) {
          const diff = (now.getTime() - m1.getTime()) / (1000 * 60 * 60 * 24);
          if (diff > 30) {
            riskScore = Math.min(100, Math.floor(diff * 1.5));
            reason = '商談1から進展なし';
          }
        }

        return {
          company: String(row['企業名']),
          staff: String(row['担当者']),
          stage: String(row['ステージ']),
          riskScore,
          reason
        };
      })
      .filter(l => l.riskScore > 30)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return { funnelCounts, staffStats, stagnantLeads };
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales Pipeline Funnel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-8 flex items-center">
            <i className="fas fa-filter mr-2 text-indigo-500"></i>
            受注プロセス・ファネル
          </h3>
          <div className="space-y-4">
            {analytics.funnelCounts.map((item, i) => {
              const max = Math.max(...analytics.funnelCounts.map(f => f.count));
              const width = (item.count / max) * 100;
              const nextCount = analytics.funnelCounts[i+1]?.count || 0;
              const convRate = item.count > 0 ? Math.round((nextCount / item.count) * 100) : 0;

              return (
                <div key={item.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">{item.stage}</span>
                    <span className="text-xs font-black text-slate-800">{item.count} <span className="text-[10px] text-slate-400">LEADS</span></span>
                  </div>
                  <div className="w-full h-8 bg-slate-50 rounded-lg overflow-hidden flex items-center px-1">
                    <div 
                      className="h-6 bg-indigo-500 rounded-md transition-all duration-1000 flex items-center justify-end px-2"
                      style={{ width: `${width}%` }}
                    >
                      {width > 20 && <span className="text-[9px] text-white font-bold">{Math.round(width)}%</span>}
                    </div>
                  </div>
                  {i < analytics.funnelCounts.length - 1 && (
                    <div className="flex justify-center -my-1 relative z-10">
                      <div className="bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                        <span className="text-[9px] font-black text-emerald-600">
                          <i className="fas fa-arrow-down mr-1"></i>
                          CVR: {convRate}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Performance Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-8 flex items-center">
            <i className="fas fa-users-gear mr-2 text-emerald-500"></i>
            担当者別アクティブ案件負荷
          </h3>
          <div className="space-y-6">
            {/* Fix: Explicitly cast Object.entries to ensure correct property access on stats object */}
            {(Object.entries(analytics.staffStats) as [string, { total: number, active: number }][])
              .sort((a,b) => b[1].active - a[1].active)
              .slice(0, 5)
              .map(([name, stats], i) => (
              <div key={name}>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 mr-2 border border-slate-200">
                      {name.substring(0, 2)}
                    </div>
                    <span className="text-xs font-black text-slate-700">{name}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {stats.active} <span className="text-[10px] opacity-60">ACTIVE</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${(stats.active / data.length) * 100}%` }}
                  ></div>
                  <div 
                    className="h-full bg-slate-300 transition-all duration-1000"
                    style={{ width: `${((stats.total - stats.active) / data.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stagnant Leads Table - The New Decision Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-triangle-exclamation mr-3 text-rose-500 text-lg"></i>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  滞留案件アラート（放置リスクが高いリード）
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  最終アクションから一定期間経過した案件を自動スコアリング
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 animate-pulse">
              ACTION REQUIRED: {analytics.stagnantLeads.length}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">企業名</th>
                <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">担当者</th>
                <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">現在のステージ</th>
                <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">アラート内容</th>
                <th className="py-3 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">リスクスコア</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics.stagnantLeads.map((lead, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-xs font-black text-slate-800">{lead.company}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[11px] font-bold text-slate-600">{lead.staff}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[11px] font-medium text-rose-600">{lead.reason}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500" 
                          style={{ width: `${lead.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-black text-slate-800">{lead.riskScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {analytics.stagnantLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold italic uppercase tracking-widest">
                    すべての案件が順調に進行しています
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InsightsAnalysis;
