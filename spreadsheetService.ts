
import { SpreadsheetRow } from '../types';

/**
 * Robust CSV parser that handles quotes and multi-line fields.
 */
export const parseCSV = (csvText: string): { headers: string[], rows: SpreadsheetRow[] } => {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentCol = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCol += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCol += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCol.trim());
        currentCol = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCol.trim());
        result.push(currentRow);
        currentRow = [];
        currentCol = '';
        if (char === '\r') i++; // skip \n
      } else {
        currentCol += char;
      }
    }
  }

  // Handle final residue
  if (currentCol !== '' || currentRow.length > 0) {
    currentRow.push(currentCol.trim());
    result.push(currentRow);
  }

  if (result.length === 0) return { headers: [], rows: [] };

  const headers = result[0].map(h => h.trim());
  const rows = result.slice(1).map(lineValues => {
    const rowObj: SpreadsheetRow = {};
    headers.forEach((header, index) => {
      rowObj[header] = lineValues[index] || '';
    });
    return rowObj;
  });

  return { headers, rows };
};

export const fetchSpreadsheetData = async () => {
  const url = `https://docs.google.com/spreadsheets/d/1u0G7TMRniwvqh3ReLCxi68qlrbeHNkJbGdXL_z93JP4/export?format=csv&gid=0`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
  }
  const text = await response.text();
  return parseCSV(text);
};
