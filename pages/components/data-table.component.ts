import { BaseComponent } from './base.component';
import { Locator } from '@playwright/test';

export class DataTableComponent<T extends Record<string, string>> extends BaseComponent {
  get rows(): Locator {
    return this.find('tbody tr');
  }

  async findRowBy(columnText: string, value: string): Promise<Locator> {
    // Basic implementation: find a row that contains the value
    return this.rows.filter({ hasText: value }).first();
  }
}
