import { TestResult } from '../core/types';

/**
 * Parse JSON test results from Playwright, Jest, or custom format.
 * Auto-detects format based on structure.
 */
export function parseJsonResults(content: string): TestResult[] {
  const data = JSON.parse(content);

  // Playwright format: { suites: [...] }
  if (Array.isArray(data.suites)) {
    return parsePlaywrightJson(data);
  }

  // Jest format: { numTotalTests, testResults: [...] }
  if (data.numTotalTests !== undefined && Array.isArray(data.testResults)) {
    return parseJestJson(data);
  }

  // Generic array of test results
  if (Array.isArray(data)) {
    return data.map((t: Record<string, unknown>) => ({
      name: String(t.name || t.title || 'Unknown'),
      suite: String(t.suite || t.file || 'Unknown'),
      framework: String(t.framework || 'custom'),
      status: normalizeStatus(String(t.status || 'passed')),
      duration: Number(t.duration || 0),
      error: t.error ? String(t.error) : undefined,
    }));
  }

  return [];
}

function parsePlaywrightJson(data: Record<string, unknown>): TestResult[] {
  const results: TestResult[] = [];
  const suites = data.suites as Array<Record<string, unknown>>;

  function extract(spec: Record<string, unknown>, suitePath: string): void {
    const suite = suitePath ? `${suitePath} > ${spec.title}` : String(spec.title || '');
    const tests = (spec.tests || []) as Array<Record<string, unknown>>;
    for (const test of tests) {
      results.push({
        name: String(test.title || ''),
        suite,
        framework: 'playwright',
        status: normalizeStatus(String(test.status || 'passed')),
        duration: Number(test.duration || 0),
      });
    }
    for (const child of (spec.suites || []) as Array<Record<string, unknown>>) {
      extract(child, suite);
    }
  }

  for (const suite of suites) extract(suite, '');
  return results;
}

function parseJestJson(data: Record<string, unknown>): TestResult[] {
  const results: TestResult[] = [];
  const files = data.testResults as Array<Record<string, unknown>>;

  for (const file of files) {
    const tests = (file.testResults || file.assertionResults || []) as Array<
      Record<string, unknown>
    >;
    for (const test of tests) {
      results.push({
        name: String(test.title || ''),
        suite:
          ((test.ancestorTitles as string[]) || []).join(' > ') || String(file.testFilePath || ''),
        framework: 'jest',
        status: normalizeStatus(String(test.status || 'passed')),
        duration: Number(test.duration || 0),
        error: Array.isArray(test.failureMessages)
          ? (test.failureMessages as string[]).join('\n')
          : undefined,
      });
    }
  }

  return results;
}

function normalizeStatus(status: string): TestResult['status'] {
  switch (status.toLowerCase()) {
    case 'passed':
    case 'expected':
      return 'passed';
    case 'failed':
    case 'unexpected':
    case 'timedout':
      return 'failed';
    case 'skipped':
    case 'pending':
    case 'fixme':
      return 'skipped';
    default:
      return 'passed';
  }
}
