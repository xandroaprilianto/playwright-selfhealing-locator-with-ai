import { Page, Locator } from '@playwright/test';

export interface ElementDescriptor {
  role?: string;
  name?: string | RegExp;
  testId?: string;
  text?: string | RegExp;
  label?: string;
  css?: string; // last resort — isi hanya jika tidak ada alternatif
}

export class ResilientLocator {
  constructor(
    protected readonly page: Page,
    protected readonly descriptor: ElementDescriptor,
    public readonly debugName: string
  ) {}

  protected getCandidateLocators(): Locator[] {
    const locators: Locator[] = [];
    const { role, name, testId, label, text, css } = this.descriptor;

    // 1. role + name (most semantic and stable)
    if (role && name !== undefined) {
      locators.push(this.page.getByRole(role as any, { name }));
    }
    // 2. testId (explicit, no visual changes impact)
    if (testId) {
      locators.push(this.page.getByTestId(testId));
    }
    // 3. label (good for form elements)
    if (label) {
      locators.push(this.page.getByLabel(label));
    }
    // 4. role only (without name)
    if (role && name === undefined) {
      locators.push(this.page.getByRole(role as any));
    }
    // 5. text (prone to copy changes)
    if (text !== undefined) {
      locators.push(this.page.getByText(text));
    }
    // 6. css (last resort fallback)
    if (css) {
      locators.push(this.page.locator(css));
    }

    return locators;
  }

  /**
   * Resolves to the first working locator from candidate list.
   */
  async resolve(): Promise<Locator> {
    const candidates = this.getCandidateLocators();
    if (candidates.length === 0) {
      throw new Error(`[ResilientLocator] Element "${this.debugName}" has no valid attributes in ElementDescriptor.`);
    }

    // Iterate through candidates and find the first one that exists in the DOM
    for (const locator of candidates) {
      try {
        const count = await locator.count();
        if (count > 0) {
          return locator;
        }
      } catch {
        // Continue to the next fallback candidate
      }
    }

    // Default to the first candidate if all fail (this will trigger standard Playwright error with trace)
    return candidates[0];
  }

  // Delegated Actions
  async click(options?: Parameters<Locator['click']>[0]): Promise<void> {
    const locator = await this.resolve();
    await locator.click(options);
  }

  async fill(value: string, options?: Parameters<Locator['fill']>[1]): Promise<void> {
    const locator = await this.resolve();
    await locator.fill(value, options);
  }

  async clear(options?: Parameters<Locator['clear']>[0]): Promise<void> {
    const locator = await this.resolve();
    await locator.clear(options);
  }

  async isVisible(options?: Parameters<Locator['isVisible']>[0]): Promise<boolean> {
    try {
      const locator = await this.resolve();
      return await locator.isVisible(options);
    } catch {
      return false;
    }
  }

  async waitFor(options?: Parameters<Locator['waitFor']>[0]): Promise<void> {
    const locator = await this.resolve();
    await locator.waitFor(options);
  }

  async selectOption(
    values: Parameters<Locator['selectOption']>[0],
    options?: Parameters<Locator['selectOption']>[1]
  ): Promise<string[]> {
    const locator = await this.resolve();
    return await locator.selectOption(values, options);
  }

  async textContent(options?: Parameters<Locator['textContent']>[0]): Promise<string | null> {
    const locator = await this.resolve();
    return await locator.textContent(options);
  }

  async isEditable(options?: Parameters<Locator['isEditable']>[0]): Promise<boolean> {
    try {
      const locator = await this.resolve();
      return await locator.isEditable(options);
    } catch {
      return false;
    }
  }

  async check(options?: Parameters<Locator['check']>[0]): Promise<void> {
    const locator = await this.resolve();
    await locator.check(options);
  }

  async inputValue(options?: Parameters<Locator['inputValue']>[0]): Promise<string> {
    const locator = await this.resolve();
    return await locator.inputValue(options);
  }
}
