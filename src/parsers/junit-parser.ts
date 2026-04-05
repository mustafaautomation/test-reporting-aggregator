import { XMLParser } from 'fast-xml-parser';
import { TestResult } from '../core/types';

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

export function parseJunitXml(content: string, framework = 'junit'): TestResult[] {
  const data = xmlParser.parse(content);
  const results: TestResult[] = [];

  const suites = toArray(data.testsuites?.testsuite || data.testsuite);

  for (const suite of suites) {
    const suiteName = suite['@_name'] || 'Unknown';
    const cases = toArray(suite.testcase);

    for (const tc of cases) {
      const duration = Math.round(parseFloat(tc['@_time'] || '0') * 1000);
      let status: TestResult['status'] = 'passed';
      let error: string | undefined;

      if (tc.skipped !== undefined) {
        status = 'skipped';
      } else if (tc.failure !== undefined) {
        status = 'failed';
        error = typeof tc.failure === 'string' ? tc.failure : tc.failure['@_message'];
      } else if (tc.error !== undefined) {
        status = 'failed';
        error = typeof tc.error === 'string' ? tc.error : tc.error['@_message'];
      }

      results.push({
        name: tc['@_name'] || 'Unknown',
        suite: tc['@_classname'] || suiteName,
        framework,
        status,
        duration,
        error,
      });
    }
  }

  return results;
}

function toArray<T>(item: T | T[] | undefined): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}
