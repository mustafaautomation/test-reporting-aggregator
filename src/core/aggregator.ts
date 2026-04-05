import { TestResult, FrameworkSummary, AggregatedReport } from './types';

export function aggregate(results: TestResult[]): AggregatedReport {
  const byFramework = new Map<string, TestResult[]>();

  for (const test of results) {
    const existing = byFramework.get(test.framework) || [];
    existing.push(test);
    byFramework.set(test.framework, existing);
  }

  const frameworks: FrameworkSummary[] = [...byFramework.entries()].map(([fw, tests]) => {
    const passed = tests.filter((t) => t.status === 'passed').length;
    const failed = tests.filter((t) => t.status === 'failed').length;
    const skipped = tests.filter((t) => t.status === 'skipped').length;
    const duration = tests.reduce((s, t) => s + t.duration, 0);
    return {
      framework: fw,
      total: tests.length,
      passed,
      failed,
      skipped,
      passRate: tests.length > 0 ? Math.round((passed / tests.length) * 1000) / 10 : 0,
      duration,
    };
  });

  const total = results.length;
  const passed = results.filter((t) => t.status === 'passed').length;
  const failed = results.filter((t) => t.status === 'failed').length;
  const skipped = results.filter((t) => t.status === 'skipped').length;
  const duration = results.reduce((s, t) => s + t.duration, 0);

  return {
    timestamp: new Date().toISOString(),
    frameworks,
    tests: results,
    totals: {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? Math.round((passed / total) * 1000) / 10 : 0,
      duration,
    },
  };
}
