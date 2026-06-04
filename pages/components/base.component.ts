import { Page, Locator } from "@playwright/test";

export abstract class BaseComponent {
  constructor(
    protected readonly page: Page,
    protected readonly container: Locator
  ) {}

  protected find(selector: string): Locator {
    return this.container.locator(selector);
  }

  protected findByRole(
    role: Parameters<Locator['getByRole']>[0],
    options?: Parameters<Locator['getByRole']>[1]
  ): Locator {
    return this.container.getByRole(role, options);
  }

  async isVisible(): Promise<boolean> {
    return this.container.isVisible();
  }

  async waitUntilVisible(): Promise<void> {
    await this.container.waitFor({ state: 'visible' });
  }
}
