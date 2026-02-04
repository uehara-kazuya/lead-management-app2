
import React, { useState, useMemo } from 'react';
import { SpreadsheetRow } from '../types';

interface DataTableProps {
  headers: string[];
  data: SpreadsheetRow[];
}

const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let sorted = [...data];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      sorted = sorted.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearch))
      );
    }

    if (sortConfig) {
      sorted.sort((a, b) => {
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
        
        const aNum = parseFloat(aVal.replace(/,/g, ''));
        const bNum = parseFloat(bVal.replace(/,/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [data, searchTerm, sortConfig]);

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[850px] max-h-[90vh]">
      {/* Search and Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <i className="fas fa-search text-xs"></i>
          </span>
          <input
            type="text"
            placeholder="A列〜AI列内から検索..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center bg-slate-200/50 px-2 py-1 rounded">
            Columns: <span className="text-slate-900 ml-1">{headers.length}</span>
          </div>
          <div className="flex items-center bg-indigo-100 px-2 py-1 rounded text-indigo-700">
            Records: <span className="ml-1">{filteredData.length}</span>
          </div>
        </div>
      </div>

      {/* Database Viewport - Sized to comfortably show ~20 records */}
      <div className="overflow-x-auto overflow-y-auto flex-1 relative border-b border-slate-100 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
          <thead className="bg-slate-50 sticky top-0 z-30 shadow-sm">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`px-4 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200 select-none group whitespace-nowrap
                    ${index === 0 ? 'sticky left-0 z-40 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                >
                  <div className="flex items-center justify-between min-w-[120px]">
                    <span>{header}</span>
                    <span className={`ml-2 transition-opacity ${sortConfig?.key === header ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? <i className="fas fa-sort-up"></i> : <i className="fas fa-sort-down"></i>
                      ) : <i className="fas fa-sort"></i>}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                  {headers.map((header, colIdx) => {
                    const value = String(row[header] || '');
                    return (
                      <td 
                        key={header} 
                        className={`px-4 py-3 text-xs text-slate-600 font-medium border-b border-slate-50 align-top
                          ${colIdx === 0 ? 'sticky left-0 z-20 bg-white group-hover:bg-indigo-50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] font-bold text-slate-900' : ''}`}
                      >
                        <div className="max-w-[300px] min-w-[100px] max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed break-words">
                          {value === '#REF!' ? <span className="text-red-400 italic font-normal">#REF!</span> : (value || '-')}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center opacity-40">
                    <div className="bg-slate-100 p-6 rounded-full mb-4">
                      <i className="fas fa-database text-4xl text-slate-400"></i>
                    </div>
                    <p className="text-slate-600 font-bold text-lg">表示可能なレコードがありません</p>
                    <p className="text-slate-400 text-sm">フィルタ条件を確認してください</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Enhanced Footer */}
      <div className="px-6 py-3 bg-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-indigo-500">
            <i className="fas fa-arrows-left-right mr-1.5"></i>
            <span>A列 ~ AI列を表示中</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center">
            <i className="fas fa-keyboard mr-1.5"></i>
            <span>クリックでソート可能</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-1">
          <i className="fas fa-check-circle text-emerald-500"></i>
          <span>DATABASE ENGINE CONNECTED</span>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
