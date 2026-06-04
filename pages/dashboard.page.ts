import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly pageUrl = '/dashboard';

  readonly totalProductsStat: Locator;
  readonly totalCategoriesStat: Locator;
  readonly lowStockStat: Locator;
  readonly totalValueStat: Locator;

  constructor(page: Page) {
    super(page);
    this.totalProductsStat = page.getByTestId('stat-total-products');
    this.totalCategoriesStat = page.getByTestId('stat-total-categories');
    this.lowStockStat = page.getByTestId('stat-low-stock');
    this.totalValueStat = page.getByTestId('stat-total-value');
  }
}
