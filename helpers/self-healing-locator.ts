import { Page, Locator } from '@playwright/test';
import { ElementDescriptor, ResilientLocator } from './resilient-locator';
import { runAiLocatorRepair } from './ai-locator-repair';
import { ConfidenceEngine, ConfidenceBreakdown } from './confidence-engine';

export interface HealingEvent {
  elementName: string;
  strategy: 'ai-healed' | 'failed';
  originalDescriptor: ElementDescriptor;
  healedDescriptor?: ElementDescriptor;
  confidenceScore?: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  timestamp: number;
}

export const healingRegistry: HealingEvent[] = [];

export class SelfHealingLocator extends ResilientLocator {
  override async resolve(): Promise<Locator> {
    const candidates = this.getCandidateLocators();

    // 1. Try static fallbacks first
    for (const locator of candidates) {
      try {
        const count = await locator.count();
        if (count > 0) {
          return locator;
        }
      } catch {
        // ignore and continue
      }
    }

    // 2. Try AI Repair
    try {
      console.warn(`[Self-heal] All static fallbacks failed for "${this.debugName}". Triggering AI repair...`);
      
      let snapshot;
      try {
        snapshot = await this.page.locator('body').ariaSnapshot();
      } catch (e) {
        snapshot = await this.page.evaluate(() => document.body.innerText);
      }
      
      const repairedDescriptor = await runAiLocatorRepair(snapshot, this.descriptor, this.debugName);

      if (repairedDescriptor) {
        // Validate with Confidence Engine
        const confidence = ConfidenceEngine.validateRepair(this.descriptor, repairedDescriptor, snapshot);

        if (!confidence.accepted) {
          const errMsg = `Self-healing rejected for "${this.debugName}": Confidence score ${confidence.finalScore} is below threshold.`;
          console.error(`[Self-heal] ${errMsg}`);
          console.error(`[Self-heal] Breakdown:`, confidence.breakdown);
          
          healingRegistry.push({
            elementName: this.debugName,
            strategy: 'failed',
            originalDescriptor: this.descriptor,
            healedDescriptor: repairedDescriptor,
            confidenceScore: confidence.finalScore,
            confidenceBreakdown: confidence.breakdown,
            timestamp: Date.now()
          });

          throw new Error(errMsg);
        }

        // Construct the healed locator
        let healedLocator: Locator | null = null;
        
        if (repairedDescriptor.role && repairedDescriptor.name) {
          healedLocator = this.page.getByRole(repairedDescriptor.role as any, { name: repairedDescriptor.name });
        } else if (repairedDescriptor.testId) {
          healedLocator = this.page.getByTestId(repairedDescriptor.testId);
        } else if (repairedDescriptor.label) {
          healedLocator = this.page.getByLabel(repairedDescriptor.label);
        } else if (repairedDescriptor.role) {
          healedLocator = this.page.getByRole(repairedDescriptor.role as any);
        } else if (repairedDescriptor.text) {
          healedLocator = this.page.getByText(repairedDescriptor.text);
        } else if (repairedDescriptor.css) {
          healedLocator = this.page.locator(repairedDescriptor.css);
        }

        if (healedLocator && (await healedLocator.count()) > 0) {
          console.warn(`[Self-heal] Successfully AI-healed "${this.debugName}" with score ${confidence.finalScore} using: ${JSON.stringify(repairedDescriptor)}`);
          
          healingRegistry.push({
            elementName: this.debugName,
            strategy: 'ai-healed',
            originalDescriptor: this.descriptor,
            healedDescriptor: repairedDescriptor,
            confidenceScore: confidence.finalScore,
            confidenceBreakdown: confidence.breakdown,
            timestamp: Date.now()
          });

          return healedLocator;
        }
      }
    } catch (aiError) {
      if (aiError instanceof Error && aiError.message.includes('Self-healing rejected')) {
        throw aiError; // Re-throw rejection error so it fails the test immediately
      }
      console.error(`[Self-heal] AI Repair failed with error:`, aiError);
    }

    // Register failure event if AI healing failed or was not run
    healingRegistry.push({
      elementName: this.debugName,
      strategy: 'failed',
      originalDescriptor: this.descriptor,
      timestamp: Date.now()
    });

    // Fallback to the first candidate so standard playwright error is thrown
    return candidates[0] || this.page.locator(this.descriptor.css || 'unknown');
  }
}
