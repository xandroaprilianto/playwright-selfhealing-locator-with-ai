import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  readonly pageUrl = '/forgot-password';

  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email-input');
    this.submitButton = page.getByTestId('submit-btn');
    this.loginLink = page.getByTestId('login-link');
    this.successMessage = page.getByTestId('success-message');
  }
}
