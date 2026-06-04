import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ProductsV2Page extends BasePage {
  readonly pageUrl = '/products-v2';

  readonly pageContainer: Locator;
  readonly addProductBtn: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.pageContainer = page.getByTestId('products-page');
    this.addProductBtn = page.getByTestId('add-product-btn');
    this.searchInput = page.getByTestId('search-input');
    this.categoryFilter = page.getByTestId('category-filter');
  }
}
