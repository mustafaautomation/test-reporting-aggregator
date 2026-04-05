import { AggregatedReport } from '../core/types';

const R = '\x1b[0m',
  B = '\x1b[1m',
  D = '\x1b[2m';
const RED = '\x1b[31m',
  GRN = '\x1b[32m',
  YEL = '\x1b[33m',
  CYN = '\x1b[36m';

export function printReport(report: AggregatedReport): void {
  console.log();
  console.log(`${B}${CYN}Test Report${R}  ${D}${report.timestamp}${R}`);
  console.log();

  const { totals } = report;
  const rateColor = totals.passRate >= 95 ? GRN : totals.passRate >= 80 ? YEL : RED;
  console.log(
    `  ${B}Total:${R} ${totals.total} tests  ${GRN}${totals.passed} passed${R}  ${RED}${totals.failed} failed${R}  ${D}${totals.skipped} skipped${R}  ${rateColor}${totals.passRate}%${R}  ${D}${totals.duration}ms${R}`,
  );
  console.log();

  if (report.frameworks.length > 1) {
    console.log(`  ${B}Frameworks:${R}`);
    for (const fw of report.frameworks) {
      const fwColor = fw.passRate >= 95 ? GRN : fw.passRate >= 80 ? YEL : RED;
      console.log(
        `    ${fw.framework.padEnd(15)} ${String(fw.total).padEnd(5)} ${fwColor}${fw.passRate}%${R}  ${GRN}${fw.passed}${R}/${RED}${fw.failed}${R}`,
      );
    }
    console.log();
  }

  const failures = report.tests.filter((t) => t.status === 'failed');
  if (failures.length > 0) {
    console.log(`  ${B}${RED}Failures (${failures.length}):${R}`);
    for (const f of failures.slice(0, 10)) {
      console.log(`    ${RED}x${R} [${f.framework}] ${f.name} ${D}(${f.suite})${R}`);
    }
    if (failures.length > 10) console.log(`    ${D}... and ${failures.length - 10} more${R}`);
    console.log();
  }
}
