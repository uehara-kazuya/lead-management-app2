
import React, { useMemo, useState } from 'react';
import { SpreadsheetRow } from '../types';

interface ProgressTrackerProps {
  data: SpreadsheetRow[];
  headers: string[];
}

interface ActionDetail {
  company: string;
  milestone: string;
  comment: string;
  staff: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ data, headers }) => {
  const [selectedAction, setSelectedAction] = useState<ActionDetail | null>(null);

  // AJ:BY represents detailed progress milestones.
  const milestoneHeaders = useMemo(() => {
    return headers.slice(35, 77).filter(h => h && h.trim() !== '');
  }, [headers]);

  const processedData = useMemo(() => {
    return data
      .filter(row => row['企業名'] && row['企業名'] !== '')
      .map(row => {
        let lastMilestoneIndex = -1;
        let lastActionText = '未着手';
        
        milestoneHeaders.forEach((h, idx) => {
          const val = String(row[h] || '').trim();
          if (val !== '' && val !== '0' && val.toLowerCase() !== 'false') {
            lastMilestoneIndex = idx;
            // Capture the actual cell content
            lastActionText = val;
          }
        });

        const completionRate = milestoneHeaders.length > 0 
          ? Math.round(((lastMilestoneIndex + 1) / milestoneHeaders.length) * 100) 
          : 0;

        return {
          company: String(row['企業名']),
          staff: String(row['担当者'] || '未設定'),
          stage: String(row['ステージ'] || '未設定'),
          lastAction: lastActionText,
          lastMilestoneIndex,
          completionRate,
          milestones: milestoneHeaders.map((h, i) => {
             const val = String(row[h] || '').trim();
             return {
               header: h,
               val: val,
               isDone: val !== '' && val !== '0' && val.toLowerCase() !== 'false'
             };
          })
        };
      })
      .sort((a, b) => b.lastMilestoneIndex - a.lastMilestoneIndex);
  }, [data, milestoneHeaders]);

  const milestoneStats = useMemo(() => {
    return milestoneHeaders.map((h, i) => {
      const activeInThisStage = processedData.filter(row => row.lastMilestoneIndex === i).length;
      return {
        header: h,
        activeCount: activeInThisStage,
        rate: processedData.length > 0 ? Math.round((processedData.filter(r => r.milestones[i].isDone).length / processedData.length) * 100) : 0
      };
    });
  }, [processedData, milestoneHeaders]);

  const closeDetail = () => setSelectedAction(null);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
      <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center">
              <i className="fas fa-stairs mr-2 text-sky-500"></i>
              リアルタイム・アクション進捗 (AJ:BY)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              最新アクションのアイコンをクリックすると、詳細なコメントを確認できます
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase">最新アクション (クリック可能)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase">完了済み</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-40 bg-slate-50 p-4 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[220px]">
                <span className="text-[9px] font-black text-slate-400 uppercase">ボトルネック・チェック</span>
              </th>
              <th className="sticky left-[220px] z-40 bg-slate-50 p-4 border-b border-r border-slate-200 min-w-[150px]">
                <span className="text-[9px] font-black text-slate-400 uppercase">現時点のフェーズ</span>
              </th>
              {milestoneStats.map((stat, i) => (
                <th key={i} className="p-4 border-b border-slate-200 min-w-[70px] text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-[11px] font-black mb-1 ${stat.activeCount > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {stat.activeCount} <span className="text-[8px] opacity-60">件</span>
                    </span>
                    <div className="w-full h-1 bg-slate-100 rounded-full">
                      <div className="h-full bg-indigo-500" style={{ width: `${stat.rate}%` }}></div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50 sticky top-0 z-30">
              <th className="sticky left-0 z-40 bg-slate-100 p-4 border-b border-r border-slate-200 whitespace-nowrap min-w-[220px]">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">企業名 / 担当</span>
              </th>
              <th className="sticky left-[220px] z-40 bg-slate-100 p-4 border-b border-r border-slate-200 whitespace-nowrap min-w-[150px]">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">最新ステータス</span>
              </th>
              {milestoneHeaders.map((header, i) => (
                <th key={i} className="p-4 border-b border-slate-200 min-w-[70px] text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase vertical-text whitespace-nowrap overflow-hidden text-ellipsis max-h-[100px]" style={{ writingMode: 'vertical-rl' }}>
                    {header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {processedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-4 border-b border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                  <p className="text-xs font-black text-slate-800 truncate max-w-[200px]">{row.company}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">{row.staff} • {row.stage}</p>
                </td>
                <td className="sticky left-[220px] z-20 bg-white group-hover:bg-slate-50 p-4 border-b border-r border-slate-100 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-600 truncate max-w-[130px] uppercase">
                      {row.lastAction.length > 2 ? row.lastAction : (milestoneHeaders[row.lastMilestoneIndex] || '未着手')}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${row.completionRate}%` }}></div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">{row.completionRate}%</span>
                    </div>
                  </div>
                </td>
                {row.milestones.map((m, i) => {
                  const isLast = i === row.lastMilestoneIndex;
                  return (
                    <td key={i} className={`p-2 border-b border-slate-50 text-center ${isLast ? 'bg-indigo-50/30' : ''}`}>
                      <div className="flex justify-center">
                        <button 
                          onClick={() => isLast && setSelectedAction({
                            company: row.company,
                            milestone: m.header,
                            comment: m.val,
                            staff: row.staff
                          })}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isLast 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 hover:scale-125 hover:bg-indigo-700 cursor-pointer' 
                            : m.isDone 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-50 text-slate-200'
                        }`}
                        title={isLast ? "クリックして詳細を表示" : ""}
                        >
                          {isLast ? <i className="fas fa-bullseye text-[10px]"></i> : m.isDone ? <i className="fas fa-check text-[10px]"></i> : <i className="fas fa-minus text-[8px]"></i>}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Detail Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-600 px-8 py-6 text-white relative">
              <button 
                onClick={closeDetail}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Latest Milestone Detail</p>
              <h4 className="text-xl font-black tracking-tight leading-tight pr-12">{selectedAction.company}</h4>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full">{selectedAction.staff}</span>
                <span className="text-[10px] font-bold bg-emerald-400/30 text-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-400/20">Active Now</span>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">現在進行中のマイルストーン</label>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center">
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                      <i className="fas fa-bullseye text-sm"></i>
                   </div>
                   <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedAction.milestone}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">アクション詳細・コメント</label>
                <div className="bg-white border-2 border-slate-50 p-6 rounded-2xl min-h-[150px] shadow-inner text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">
                  {selectedAction.comment.length > 2 ? (
                    selectedAction.comment
                  ) : (
                    <span className="text-slate-300">詳細なコメントは記録されていません。マイルストーン項目「{selectedAction.milestone}」が完了しています。</span>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={closeDetail}
                  className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
          {/* Backdrop closer */}
          <div className="absolute inset-0 -z-10" onClick={closeDetail}></div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
