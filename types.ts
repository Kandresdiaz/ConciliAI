
export enum TransactionSource {
  BANK = 'BANK',
  LEDGER = 'LEDGER'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  DISCREPANCY = 'DISCREPANCY'
}


export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
  LIFETIME = 'LIFETIME'  // VIP users with unlimited access
}

export interface UserProfile {
  id: string;
  email: string;
  tier: UserTier;
  credits_remaining: number;
  total_processed_pages: number;
  reconciliations_count: number;
}

export interface Transaction {
  id: string;
  batchId: string;
  date: string;
  description: string;
  amount: number;
  source: TransactionSource;
  status: TransactionStatus;
  matchedWithId?: string;
  notes?: string;
  isEdited?: boolean;
}

export interface ImportBatch {
  id: string;
  filename: string;
  source: TransactionSource;
  timestamp: number;
  count: number;
  expectedFinalBalance?: number;
  actualFinalBalance?: number;
}

export interface AccountSummary {
  initialBalance: number;
  totalCredits: number;
  totalDebits: number;
  finalBalance: number;
}

export interface ImportResult {
  summary: AccountSummary | null;
  transactions: Partial<Transaction>[];
}

export interface MatchSuggestion {
  bankId: string;
  ledgerId: string;
  confidence: number;
  reason: string;
}

export interface AppState {
  activeTab: 'dashboard' | 'reconcile' | 'report' | 'history';
  initialBankBalance: number;
  initialLedgerBalance: number;
  userTier: UserTier;
}
