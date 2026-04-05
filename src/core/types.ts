export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestResult {
  name: string;
  suite: string;
  framework: string;
  status: TestStatus;
  duration: number;
  error?: string;
}

export interface FrameworkSummary {
  framework: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  duration: number;
}

export interface AggregatedReport {
  timestamp: string;
  frameworks: FrameworkSummary[];
  tests: TestResult[];
  totals: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    duration: number;
  };
}
