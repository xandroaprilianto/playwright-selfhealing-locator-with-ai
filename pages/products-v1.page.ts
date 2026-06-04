import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { SelfHealingLocator } from '../helpers/self-healing-locator';

export class ProductsV1Page extends BasePage {
  readonly pageUrl = '/products';

  readonly addProductBtn: SelfHealingLocator;
  readonly searchInput: SelfHealingLocator; // SelfHealingLocator agar bisa dipancing saat dipakai di halaman V2
  readonly categoryDropdown: SelfHealingLocator;

  // Modal locators
  readonly nameInput: SelfHealingLocator;
  readonly categorySelect: SelfHealingLocator;
  readonly priceInput: SelfHealingLocator;
  readonly stockInput: SelfHealingLocator;
  readonly saveBtn: SelfHealingLocator;
  readonly cancelBtn: SelfHealingLocator;

  constructor(page: Page) {
    super(page);
    this.addProductBtn = new SelfHealingLocator(page, { role: 'button', name: 'Tambah Produk' }, 'Add Product Button');

    this.searchInput = new SelfHealingLocator(
      page,
      {
        label: 'Cari produk',
        css: 'input[placeholder="Cari produk berdasarkan nama..."]',
      },
      'Products V1 Search Input'
    );

    this.categoryDropdown = new SelfHealingLocator(page, { role: 'combobox' }, 'Category Dropdown');
    this.nameInput = new SelfHealingLocator(page, { testId: 'name-input' }, 'Name Input');
    this.categorySelect = new SelfHealingLocator(page, { testId: 'category-input' }, 'Category Select');
    this.priceInput = new SelfHealingLocator(page, { testId: 'price-input' }, 'Price Input');
    this.stockInput = new SelfHealingLocator(page, { testId: 'stock-input' }, 'Stock Input');
    this.saveBtn = new SelfHealingLocator(page, { testId: 'save-product-btn' }, 'Save Product Button');
    this.cancelBtn = new SelfHealingLocator(page, { role: 'button', name: 'Batal' }, 'Cancel Button');
  }

  getEditButtonForRow(index: number = 0): Locator {
    return this.page.getByRole('button', { name: 'Edit' }).nth(index);
  }

  getDeleteButtonForRow(index: number = 0): Locator {
    return this.page.getByRole('button', { name: 'Hapus' }).nth(index);
  }

  async fillForm(name: string, category: string, price: number, stock: number): Promise<void> {
    await this.nameInput.fill(name);
    await this.categorySelect.selectOption(category);
    await this.priceInput.fill(price.toString());
    await this.stockInput.fill(stock.toString());
  }
}
