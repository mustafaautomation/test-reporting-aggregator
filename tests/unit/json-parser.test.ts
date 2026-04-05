import { describe, it, expect } from 'vitest';
import { parseJsonResults } from '../../src/parsers/json-parser';

describe('parseJsonResults — Playwright format', () => {
  it('should parse flat Playwright JSON', () => {
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
    expect(results[0].name).toBe('login');
    expect(results[0].status).toBe('passed');
    expect(results[1].status).toBe('failed');
  });

  it('should parse nested Playwright suites', () => {
    const json = JSON.stringify({
      suites: [
        {
          title: 'E2E',
          tests: [],
          suites: [
            {
              title: 'Auth',
              tests: [{ title: 'login', status: 'passed', duration: 100 }],
              suites: [
                {
                  title: 'OAuth',
                  tests: [{ title: 'google', status: 'passed', duration: 200 }],
                  suites: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const results = parseJsonResults(json);
    expect(results).toHaveLength(2);
    expect(results[0].suite).toContain('Auth');
    expect(results[1].suite).toContain('OAuth');
  });

  it('should handle expected/unexpected status', () => {
    const json = JSON.stringify({
      suites: [
        {
          title: 'Suite',
          tests: [
            { title: 'a', status: 'expected', duration: 10 },
            { title: 'b', status: 'unexpected', duration: 20 },
            { title: 'c', status: 'timedOut', duration: 30000 },
            { title: 'd', status: 'skipped', duration: 0 },
          ],
          suites: [],
        },
      ],
    });

    const results = parseJsonResults(json);
    expect(results[0].status).toBe('passed');
    expect(results[1].status).toBe('failed');
    expect(results[2].status).toBe('failed');
    expect(results[3].status).toBe('skipped');
  });
});

describe('parseJsonResults — Jest format', () => {
  it('should parse Jest JSON output', () => {
    const json = JSON.stringify({
      numTotalTests: 3,
      testResults: [
        {
          testFilePath: '/tests/auth.test.ts',
          testResults: [
            { title: 'login works', ancestorTitles: ['Auth'], status: 'passed', duration: 50 },
            { title: 'logout works', ancestorTitles: ['Auth'], status: 'passed', duration: 30 },
          ],
        },
        {
          testFilePath: '/tests/api.test.ts',
          testResults: [
            {
              title: 'creates user',
              ancestorTitles: ['API', 'Users'],
              status: 'failed',
              duration: 100,
              failureMessages: ['Expected 201 got 500'],
            },
          ],
        },
      ],
    });

    const results = parseJsonResults(json);
    expect(results).toHaveLength(3);
    expect(results[0].framework).toBe('jest');
    expect(results[0].suite).toBe('Auth');
    expect(results[2].error).toContain('500');
    expect(results[2].suite).toContain('API > Users');
  });

  it('should handle Jest pending status', () => {
    const json = JSON.stringify({
      numTotalTests: 1,
      testResults: [
        {
          testFilePath: 'test.ts',
          testResults: [{ title: 'todo', ancestorTitles: [], status: 'pending', duration: 0 }],
        },
      ],
    });

    const results = parseJsonResults(json);
    expect(results[0].status).toBe('skipped');
  });
});

describe('parseJsonResults — generic array', () => {
  it('should parse custom array format', () => {
    const json = JSON.stringify([
      { name: 'test1', status: 'passed', duration: 100, framework: 'vitest' },
      { name: 'test2', status: 'failed', duration: 50, framework: 'vitest', error: 'oops' },
    ]);

    const results = parseJsonResults(json);
    expect(results).toHaveLength(2);
    expect(results[0].framework).toBe('vitest');
    expect(results[1].error).toBe('oops');
  });

  it('should handle missing fields with defaults', () => {
    const json = JSON.stringify([{ name: 'minimal' }]);

    const results = parseJsonResults(json);
    expect(results[0].status).toBe('passed');
    expect(results[0].duration).toBe(0);
    expect(results[0].framework).toBe('custom');
  });

  it('should handle empty array', () => {
    expect(parseJsonResults('[]')).toHaveLength(0);
  });
});

describe('parseJsonResults — edge cases', () => {
  it('should return empty for unrecognized JSON object', () => {
    expect(parseJsonResults('{"random": true}')).toHaveLength(0);
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseJsonResults('not json')).toThrow();
  });
});
