
export interface SpreadsheetRow {
  [key: string]: string | number | boolean;
}

export interface AppState {
  data: SpreadsheetRow[];
  headers: string[];
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

export interface Stats {
  totalRecords: number;
  lastSync: string;
}

export interface KPITargets {
  revenue: number;
  dealCount: number;
  conversionRate: number;
  avgDealSize: number;
}
