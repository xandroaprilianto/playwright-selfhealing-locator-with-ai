import { BaseComponent } from './base.component';
import { Locator } from '@playwright/test';

export class ModalComponent extends BaseComponent {
  get title(): Locator {
    return this.findByRole('heading');
  }

  get closeButton(): Locator {
    return this.findByRole('button', { name: /close|tutup/i });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
