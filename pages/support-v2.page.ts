import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class SupportV2Page extends BasePage {
  readonly pageUrl = '/support-v2';

  readonly pageContainer: Locator;
  readonly supportForm: Locator;
  readonly nameDisplay: Locator;
  readonly emailDisplay: Locator;
  readonly subjectDropdown: Locator;
  readonly hiddenNameInput: Locator;
  readonly hiddenEmailInput: Locator;
  
  readonly messageTextarea: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageContainer = page.getByTestId('support-page');
    this.supportForm = page.getByTestId('support-form');
    this.nameDisplay = page.getByTestId('name-display');
    this.emailDisplay = page.getByTestId('email-display');
    this.subjectDropdown = page.getByTestId('subject-select');
    this.hiddenNameInput = page.getByTestId('name-input');
    this.hiddenEmailInput = page.getByTestId('email-input');
    
    this.messageTextarea = page.getByPlaceholder('Describe your request...');
    this.submitButton = page.getByRole('button', { name: 'Dispatch Signal' });
  }
}
