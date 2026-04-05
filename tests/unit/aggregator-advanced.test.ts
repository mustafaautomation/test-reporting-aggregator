import { describe, it, expect } from 'vitest';
import { aggregate } from '../../src/core/aggregator';
import { TestResult } from '../../src/core/types';

function makeResult(
  name: string,
  framework: string,
  status: TestResult['status'],
  duration = 100,
): TestResult {
  return { name, suite: 'Suite', framework, status, duration };
}

describe('aggregate — multi-framework', () => {
  it('should group by framework', () => {
    const results = [
      makeResult('a', 'playwright', 'passed'),
      makeResult('b', 'playwright', 'passed'),
      makeResult('c', 'jest', 'passed'),
      makeResult('d', 'jest', 'failed'),
      makeResult('e', 'vitest', 'passed'),
    ];

    const report = aggregate(results);
    expect(report.frameworks).toHaveLength(3);

    const pw = report.frameworks.find((f) => f.framework === 'playwright')!;
    expect(pw.total).toBe(2);
    expect(pw.passed).toBe(2);
    expect(pw.passRate).toBe(100);

    const jest = report.frameworks.find((f) => f.framework === 'jest')!;
    expect(jest.total).toBe(2);
    expect(jest.passed).toBe(1);
    expect(jest.failed).toBe(1);
    expect(jest.passRate).toBe(50);
  });

  it('should calculate totals across all frameworks', () => {
    const results = [
      makeResult('a', 'pw', 'passed', 100),
      makeResult('b', 'pw', 'failed', 200),
      makeResult('c', 'jest', 'passed', 50),
      makeResult('d', 'jest', 'skipped', 0),
    ];

    const report = aggregate(results);
    expect(report.totals.total).toBe(4);
    expect(report.totals.passed).toBe(2);
    expect(report.totals.failed).toBe(1);
    expect(report.totals.skipped).toBe(1);
    expect(report.totals.duration).toBe(350);
    expect(report.totals.passRate).toBe(50);
  });
});

describe('aggregate — pass rate calculation', () => {
  it('should calculate 100% for all passed', () => {
    const results = Array.from({ length: 10 }, (_, i) => makeResult(`test-${i}`, 'pw', 'passed'));
    const report = aggregate(results);
    expect(report.totals.passRate).toBe(100);
  });

  it('should calculate 0% for all failed', () => {
    const results = Array.from({ length: 5 }, (_, i) => makeResult(`test-${i}`, 'pw', 'failed'));
    const report = aggregate(results);
    expect(report.totals.passRate).toBe(0);
  });

  it('should handle 1 decimal precision', () => {
    // 2 passed out of 3 = 66.7%
    const results = [
      makeResult('a', 'pw', 'passed'),
      makeResult('b', 'pw', 'passed'),
      makeResult('c', 'pw', 'failed'),
    ];
    const report = aggregate(results);
    expect(report.totals.passRate).toBeCloseTo(66.7, 0);
  });
});

describe('aggregate — duration tracking', () => {
  it('should sum durations per framework', () => {
    const results = [
      makeResult('a', 'pw', 'passed', 100),
      makeResult('b', 'pw', 'passed', 200),
      makeResult('c', 'jest', 'passed', 50),
    ];

    const report = aggregate(results);
    const pw = report.frameworks.find((f) => f.framework === 'pw')!;
    expect(pw.duration).toBe(300);

    const jest = report.frameworks.find((f) => f.framework === 'jest')!;
    expect(jest.duration).toBe(50);
  });

  it('should sum total duration', () => {
    const results = [
      makeResult('a', 'pw', 'passed', 100),
      makeResult('b', 'jest', 'passed', 200),
      makeResult('c', 'k6', 'passed', 300),
    ];
    const report = aggregate(results);
    expect(report.totals.duration).toBe(600);
  });
});

describe('aggregate — edge cases', () => {
  it('should handle empty results', () => {
    const report = aggregate([]);
    expect(report.totals.total).toBe(0);
    expect(report.totals.passRate).toBe(0);
    expect(report.frameworks).toHaveLength(0);
    expect(report.tests).toHaveLength(0);
  });

  it('should handle single test', () => {
    const report = aggregate([makeResult('solo', 'pw', 'passed')]);
    expect(report.totals.total).toBe(1);
    expect(report.frameworks).toHaveLength(1);
  });

  it('should include all test results', () => {
    const results = Array.from({ length: 50 }, (_, i) =>
      makeResult(`test-${i}`, i % 2 === 0 ? 'pw' : 'jest', 'passed'),
    );
    const report = aggregate(results);
    expect(report.tests).toHaveLength(50);
  });

  it('should include timestamp', () => {
    const report = aggregate([]);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('should handle many frameworks', () => {
    const results = [
      makeResult('a', 'playwright', 'passed'),
      makeResult('b', 'jest', 'passed'),
      makeResult('c', 'vitest', 'passed'),
      makeResult('d', 'junit', 'passed'),
      makeResult('e', 'k6', 'passed'),
      makeResult('f', 'cypress', 'passed'),
    ];
    const report = aggregate(results);
    expect(report.frameworks).toHaveLength(6);
  });
});
