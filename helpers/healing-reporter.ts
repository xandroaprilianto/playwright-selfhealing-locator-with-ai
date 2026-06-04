import { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────────

interface HealingEventRecord {
  fileName: string;
  testName: string;
  elementName: string;
  strategy: 'ai-healed' | 'failed';
  originalDescriptor: Record<string, unknown>;
  healedDescriptor?: Record<string, unknown>;
  confidenceScore?: number;
  confidenceBreakdown?: Record<string, number>;
  timestamp: number;
}

export interface SelfHealingSummaryJson {
  generatedAt: string;
  summary: {
    totalTriggers: number;
    healed: number;
    failed: number;
    successRate: number;
  };
  events: Array<{
    file: string;
    testCase: string;
    elementName: string;
    strategy: 'ai-healed' | 'failed';
    oldLocator: Record<string, unknown>;
    aiRecommendedLocator?: Record<string, unknown>;
    confidenceScore?: number;
    confidenceBreakdown?: Record<string, number>;
    timestamp: number;
  }>;
  statistics: {
    byFile: Array<{ file: string; count: number }>;
    byComponent: Array<{ component: string; count: number }>;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function filterEmpty(descriptor: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(descriptor).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
}

// ── Reporter ───────────────────────────────────────────────────────────────────

export default class HealingReporter implements Reporter {
  private records: HealingEventRecord[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const healingAttachments = result.attachments.filter(
      (a) => a.name === 'self-healing-report'
    );

    for (const attachment of healingAttachments) {
      if (!attachment.path) continue;
      try {
        const content = fs.readFileSync(attachment.path, 'utf8');
        const events: Array<{
          elementName: string;
          strategy: 'ai-healed' | 'failed';
          originalDescriptor?: Record<string, unknown>;
          healedDescriptor?: Record<string, unknown>;
          confidenceScore?: number;
          confidenceBreakdown?: Record<string, number>;
          timestamp: number;
        }> = JSON.parse(content);

        for (const event of events) {
          this.records.push({
            fileName: test.location.file,
            testName: test.title,
            elementName: event.elementName,
            strategy: event.strategy,
            originalDescriptor: event.originalDescriptor ?? {},
            healedDescriptor: event.healedDescriptor,
            confidenceScore: event.confidenceScore,
            confidenceBreakdown: event.confidenceBreakdown,
            timestamp: event.timestamp,
          });
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  onEnd(_result: FullResult): void {
    if (this.records.length === 0) return;

    const outputDir = path.join('test-results', 'self-healing-results');
    fs.mkdirSync(outputDir, { recursive: true });

    const json = this.buildJson();

    // 1. Save JSON report
    const jsonPath = path.join(outputDir, 'self-healing-summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
    console.log(`\n[Self-heal] JSON report saved at ${jsonPath}`);

    // 2. Write Allure-compatible attachment so it appears in Allure report
    this.writeAllureAttachment(json);
  }

  // ── JSON builder ─────────────────────────────────────────────────────────────

  private buildJson(): SelfHealingSummaryJson {
    const totalTriggers = this.records.length;
    const healed = this.records.filter((r) => r.strategy === 'ai-healed').length;
    const failed = this.records.filter((r) => r.strategy === 'failed').length;

    const fileStats: Record<string, number> = {};
    const componentStats: Record<string, number> = {};

    const events = this.records.map((r) => {
      const file = path.basename(r.fileName);
      fileStats[file] = (fileStats[file] || 0) + 1;
      componentStats[r.elementName] = (componentStats[r.elementName] || 0) + 1;

      return {
        file,
        testCase: r.testName,
        elementName: r.elementName,
        strategy: r.strategy,
        oldLocator: filterEmpty(r.originalDescriptor),
        aiRecommendedLocator: r.healedDescriptor ? filterEmpty(r.healedDescriptor) : undefined,
        confidenceScore: r.confidenceScore,
        confidenceBreakdown: r.confidenceBreakdown,
        timestamp: r.timestamp,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTriggers,
        healed,
        failed,
        successRate: totalTriggers > 0 ? Math.round((healed / totalTriggers) * 100) : 0,
      },
      events,
      statistics: {
        byFile: Object.entries(fileStats)
          .sort((a, b) => b[1] - a[1])
          .map(([file, count]) => ({ file, count })),
        byComponent: Object.entries(componentStats)
          .sort((a, b) => b[1] - a[1])
          .map(([component, count]) => ({ component, count })),
      },
    };
  }

  // ── Allure attachment ─────────────────────────────────────────────────────────

  private writeAllureAttachment(json: SelfHealingSummaryJson): void {
    const allureResultsDir = 'allure-results';
    if (!fs.existsSync(allureResultsDir)) return; // skip if Allure not enabled

    try {
      const attachmentUuid = crypto.randomUUID();
      const containerUuid = crypto.randomUUID();

      // Write the raw JSON attachment file
      const attachmentFile = path.join(allureResultsDir, `${attachmentUuid}-attachment.json`);
      fs.writeFileSync(attachmentFile, JSON.stringify(json, null, 2));

      // Write an Allure container (suite-level) referencing the attachment
      const container = {
        uuid: containerUuid,
        name: '🩹 Self-Healing Summary',
        children: [],
        befores: [],
        afters: [
          {
            name: 'Self-Healing Report',
            status: json.summary.failed === 0 ? 'passed' : 'broken',
            stage: 'finished',
            start: Date.now() - 1000,
            stop: Date.now(),
            attachments: [
              {
                name: 'self-healing-summary.json',
                source: `${attachmentUuid}-attachment.json`,
                type: 'application/json',
              },
            ],
          },
        ],
      };

      const containerFile = path.join(allureResultsDir, `${containerUuid}-container.json`);
      fs.writeFileSync(containerFile, JSON.stringify(container, null, 2));

      console.log(`[Self-heal] Allure attachment written to ${allureResultsDir}/`);
    } catch (err) {
      console.warn('[Self-heal] Failed to write Allure attachment:', err);
    }
  }

}
