# Test Reporting Aggregator

[![CI](https://github.com/mustafaautomation/test-reporting-aggregator/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/test-reporting-aggregator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

Merge test results from Playwright, Jest, JUnit, and custom formats into one unified report. Framework-agnostic aggregation with pass rates, failure summaries, and per-framework breakdowns.

---

## Supported Formats

| Format | Auto-Detection |
|--------|---------------|
| JUnit XML | `<testsuites>` or `<testsuite>` tag |
| Playwright JSON | `suites` array with `tests` |
| Jest JSON | `numTotalTests` + `testResults` |
| Custom JSON | Array of `{ name, status, duration }` |

---

## Quick Start

```bash
# Merge results from multiple frameworks
npx test-report merge playwright.json jest.json results.xml

# JSON output
npx test-report merge *.json *.xml --json
```

---

## Library API

```typescript
import { aggregate, parseJunitXml, parseJsonResults } from 'test-reporting-aggregator';

const junit = parseJunitXml(fs.readFileSync('results.xml', 'utf-8'));
const pw = parseJsonResults(fs.readFileSync('playwright.json', 'utf-8'));
const report = aggregate([...junit, ...pw]);

console.log(`Total: ${report.totals.total}, Pass rate: ${report.totals.passRate}%`);
```

---

## Project Structure

```
test-reporting-aggregator/
├── src/
│   ├── core/
│   │   ├── types.ts           # TestResult, FrameworkSummary, AggregatedReport
│   │   └── aggregator.ts      # Merge + compute per-framework stats
│   ├── parsers/
│   │   ├── junit-parser.ts    # JUnit XML parser
│   │   └── json-parser.ts     # Playwright/Jest/custom JSON parser
│   ├── reporters/
│   │   └── console-reporter.ts
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   ├── aggregator.test.ts     # 7 tests
│   └── fixtures/junit.xml
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
