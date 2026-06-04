import { test, expect } from '../../fixtures';
import { AuthBuilder, SupportBuilder } from '../../../helpers/builders';
import { allure } from 'allure-playwright';

test.describe('Support Page', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    const admin = AuthBuilder.validAdmin();
    await loginPage.navigate();
    await loginPage.login(admin.email, admin.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test('TC_SUP_01 - Submit Valid Ticket', async ({ supportV1Page, page }) => {
    allure.epic('Support');
    allure.feature('Ticket Submission');
    allure.story('Submit Valid Ticket');
    allure.severity('normal');

    await supportV1Page.navigate();
    const ticket = SupportBuilder.validTicket();
    
    await supportV1Page.submitTicket(ticket.name, ticket.email, ticket.subject, ticket.message);
    
    // Expected: Success message.
    await expect(page.getByText('Pesan Anda telah berhasil dikirim. Terima kasih!')).toBeVisible();
  });

  test('TC_SUP_02 - Message Too Short', async ({ supportV1Page, page }) => {
    allure.epic('Support');
    allure.feature('Ticket Submission');
    allure.story('Message Too Short');
    allure.severity('low');

    await supportV1Page.navigate();
    const ticket = SupportBuilder.shortMessageTicket();
    
    await supportV1Page.submitTicket(ticket.name, ticket.email, ticket.subject, ticket.message);
    
    // Expected: Error "Pesan minimal 20 karakter" shown.
    await expect(page.getByText('Pesan minimal 20 karakter')).toBeVisible();
  });

  test('TC_SUP_03 - Form Pre-filling', async ({ supportV1Page, page }) => {
    allure.epic('Support');
    allure.feature('Ticket Submission');
    allure.story('Form Pre-filling');
    allure.severity('low');

    const admin = AuthBuilder.validAdmin();
    
    // 2. Go to /support
    await supportV1Page.navigate();
    
    // Nama and Email fields already filled
    const nameVal = await supportV1Page.nameInput.inputValue();
    expect(nameVal).not.toBe('');
    
    const emailVal = await supportV1Page.emailInput.inputValue();
    expect(emailVal).toBe(admin.email);
  });
});
