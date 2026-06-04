import { Page, Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

export class NavbarComponent extends BaseComponent {
  readonly logoLink: Locator;
  readonly productsLink: Locator;
  readonly supportLink: Locator;
  readonly testV2Dropdown: Locator;
  readonly productsV2MenuItem: Locator;
  readonly supportV2MenuItem: Locator;
  readonly logoutBtn: Locator;

  constructor(page: Page) {
    // The navbar container has the 'navigation' ARIA role
    const container = page.getByRole('navigation');
    super(page, container);

    this.logoLink = this.container.getByRole('link', { name: 'Practice Site' });
    this.productsLink = this.container.getByRole('link', { name: 'Produk', exact: true });
    this.supportLink = this.container.getByRole('link', { name: 'Support', exact: true });
    this.testV2Dropdown = this.container.locator('button').filter({ hasText: 'Test V2' });
    
    // Nuxt UI dropdown menu items are rendered inside portals at the body level,
    // so we locate them globally from page instead of narrowing to container.
    this.productsV2MenuItem = page.getByText('Products V2');
    this.supportV2MenuItem = page.getByText('Support V2');
    
    this.logoutBtn = this.container.getByRole('button', { name: 'Logout' });
  }

  async logout(): Promise<void> {
    await this.logoutBtn.click();
  }

  async navigateToProductsV1(): Promise<void> {
    await this.productsLink.click();
  }

  async navigateToSupportV1(): Promise<void> {
    await this.supportLink.click();
  }

  async navigateToProductsV2(): Promise<void> {
    await this.testV2Dropdown.click();
    await this.productsV2MenuItem.click();
  }

  async navigateToSupportV2(): Promise<void> {
    await this.testV2Dropdown.click();
    await this.supportV2MenuItem.click();
  }
}
