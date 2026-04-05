import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { aggregate } from '../../src/core/aggregator';
import { parseJunitXml } from '../../src/parsers/junit-parser';
import { parseJsonResults } from '../../src/parsers/json-parser';
import { TestResult } from '../../src/core/types';

describe('aggregate', () => {
  it('should aggregate results from multiple frameworks', () => {
    const results: TestResult[] = [
      { name: 'a', suite: 's', framework: 'playwright', status: 'passed', duration: 100 },
      {
        name: 'b',
        suite: 's',
        framework: 'playwright',
        status: 'failed',
        duration: 200,
        error: 'x',
      },
      { name: 'c', suite: 's', framework: 'jest', status: 'passed', duration: 50 },
    ];

    const report = aggregate(results);
    expect(report.frameworks).toHaveLength(2);
    expect(report.totals.total).toBe(3);
    expect(report.totals.passed).toBe(2);
    expect(report.totals.failed).toBe(1);
  });

  it('should calculate pass rate per framework', () => {
    const results: TestResult[] = [
      { name: 'a', suite: 's', framework: 'pw', status: 'passed', duration: 0 },
      { name: 'b', suite: 's', framework: 'pw', status: 'passed', duration: 0 },
      { name: 'c', suite: 's', framework: 'pw', status: 'failed', duration: 0 },
    ];

    const report = aggregate(results);
    expect(report.frameworks[0].passRate).toBeCloseTo(66.7, 0);
  });

  it('should handle empty results', () => {
    const report = aggregate([]);
    expect(report.totals.total).toBe(0);
    expect(report.totals.passRate).toBe(0);
  });
});

describe('parseJunitXml', () => {
  it('should parse JUnit XML file', () => {
    const content = fs.readFileSync(path.join(__dirname, 'fixtures/junit.xml'), 'utf-8');
    const results = parseJunitXml(content);
    expect(results).toHaveLength(3);
    expect(results.filter((r) => r.status === 'passed')).toHaveLength(2);
    expect(results.filter((r) => r.status === 'failed')).toHaveLength(1);
    expect(results[1].error).toContain('Expected 401');
  });
});

describe('parseJsonResults', () => {
  it('should parse generic JSON array', () => {
    const json = JSON.stringify([
      { name: 'test1', status: 'passed', duration: 100, framework: 'custom' },
      { name: 'test2', status: 'failed', duration: 50, framework: 'custom', error: 'oops' },
    ]);
    const results = parseJsonResults(json);
    expect(results).toHaveLength(2);
    expect(results[0].framework).toBe('custom');
    expect(results[1].error).toBe('oops');
  });

  it('should detect Playwright format', () => {
    const json = JSON.stringify({
      suites: [
        {
          title: 'Auth',
          tests: [
            { title: 'login', status: 'passed', duration: 500 },
            { title: 'logout', status: 'failed', duration: 200 },
          ],
          suites: [],
        },
      ],
    });
    const results = parseJsonResults(json);
    expect(results).toHaveLength(2);
    expect(results[0].framework).toBe('playwright');
  });

  it('should detect Jest format', () => {
    const json = JSON.stringify({
      numTotalTests: 2,
      testResults: [
        {
          testFilePath: '/tests/a.test.ts',
          testResults: [
            { title: 'works', ancestorTitles: ['Suite'], status: 'passed', duration: 10 },
          ],
        },
      ],
    });
    const results = parseJsonResults(json);
    expect(results).toHaveLength(1);
    expect(results[0].framework).toBe('jest');
  });
});
