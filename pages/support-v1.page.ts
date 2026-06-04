import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { SelfHealingLocator } from '../helpers/self-healing-locator';

export class SupportV1Page extends BasePage {
  readonly pageUrl = '/support';

  readonly nameInput: SelfHealingLocator;
  readonly emailInput: SelfHealingLocator;
  readonly subjectDropdown: SelfHealingLocator;
  readonly radioLow: SelfHealingLocator;
  readonly messageTextarea: SelfHealingLocator;
  readonly submitButton: SelfHealingLocator;

  constructor(page: Page) {
    super(page);
    this.nameInput = new SelfHealingLocator(page, { label: 'Nama' }, 'Name Input');
    this.emailInput = new SelfHealingLocator(page, { label: 'Email' }, 'Email Input');
    this.subjectDropdown = new SelfHealingLocator(page, { label: 'Subjek' }, 'Subject Dropdown');
    this.radioLow = new SelfHealingLocator(page, { label: 'Low' }, 'Priority Low Radio');
    this.messageTextarea = new SelfHealingLocator(page, { label: 'Pesan' }, 'Message Textarea');
    this.submitButton = new SelfHealingLocator(page, { role: 'button', name: 'Kirim Pesan' }, 'Submit Button');
  }

  async submitTicket(name: string, email: string, subject: string, message: string): Promise<void> {
    if (name && await this.nameInput.isEditable()) {
      await this.nameInput.fill(name);
    }
    if (email && await this.emailInput.isEditable()) {
      await this.emailInput.fill(email);
    }
    if (subject) {
      await this.subjectDropdown.selectOption(subject).catch(() => this.subjectDropdown.fill(subject)); 
    }
    await this.radioLow.check();
    await this.messageTextarea.fill(message);
    await this.submitButton.click();
  }
}
