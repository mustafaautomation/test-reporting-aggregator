#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { aggregate } from './core/aggregator';
import { parseJunitXml } from './parsers/junit-parser';
import { parseJsonResults } from './parsers/json-parser';
import { printReport } from './reporters/console-reporter';
import { TestResult } from './core/types';

const program = new Command();
program
  .name('test-report')
  .description('Aggregate test results from multiple frameworks')
  .version('1.0.0');

program
  .command('merge')
  .description('Merge test result files into one report')
  .argument('<files...>', 'Test result files (JSON or XML)')
  .option('--json', 'Output as JSON')
  .action((files: string[], options) => {
    const allResults: TestResult[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`Not found: ${file}`);
        continue;
      }
      const content = fs.readFileSync(file, 'utf-8');

      try {
        if (file.endsWith('.xml')) {
          allResults.push(...parseJunitXml(content));
        } else {
          allResults.push(...parseJsonResults(content));
        }
        console.log(`Parsed: ${file}`);
      } catch (err) {
        console.error(`Failed to parse ${file}: ${(err as Error).message}`);
      }
    }

    const report = aggregate(allResults);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    if (report.totals.failed > 0) process.exit(1);
  });

program.parse();
