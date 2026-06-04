import { test, expect } from '../../fixtures';
import { AuthBuilder, SupportBuilder } from '../../../helpers/builders';
import { allure } from 'allure-playwright';

test.describe('Self-Healing Verification (V2 Pages)', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    const admin = AuthBuilder.validAdmin();
    await loginPage.navigate();
    await loginPage.login(admin.email, admin.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test('TC_SH_01 - Self-Healing Product Search', async ({ dashboardPage, productsV1Page, productsV2Page, page }) => {
    test.setTimeout(60000);
    allure.epic('Self-Healing');
    allure.feature('Product Search');
    allure.story('Self-Healing Product Search');
    allure.severity('normal');

    // 1. Run automation on Products V1 via Navbar
    await dashboardPage.navbar.navigateToProductsV1();
    await expect(page).toHaveURL('/products');
    await productsV1Page.searchInput.fill('Indomie');

    // 2. Run automation on Products V2 via Navbar and search product with v1 locator 
    await productsV1Page.navbar.navigateToProductsV2();
    await expect(page).toHaveURL('/products-v2');
    await productsV1Page.searchInput.fill('Indomie');
  });

  test('TC_SH_02 - Self-Healing Support Submission', async ({ dashboardPage, supportV1Page, supportV2Page, page }) => {
    allure.epic('Self-Healing');
    allure.feature('Support Submission');
    allure.story('Self-Healing Support Submission');
    allure.severity('normal');

    const ticket = SupportBuilder.validTicket();

    // 1. Test Support V1 via Navbar
    await dashboardPage.navbar.navigateToSupportV1();
    await expect(page).toHaveURL('/support');
    await supportV1Page.submitTicket(ticket.name, ticket.email, ticket.subject, ticket.message);
    await expect(page.getByText('Pesan Anda telah berhasil dikirim. Terima kasih!')).toBeVisible();

    // 2. Switch to Support V2 via Navbar and submit
    await supportV1Page.navbar.navigateToSupportV2();
    await expect(page).toHaveURL('/support-v2');
    await supportV2Page.subjectDropdown.selectOption(ticket.subject);
    await supportV2Page.messageTextarea.fill(ticket.message);
    await supportV2Page.submitButton.click();
    // await supportV1Page.submitTicket(ticket.name, ticket.email, ticket.subject, ticket.message);
    await expect(page.getByText('Neural link established. Your signal was received.')).toBeVisible();
  });
});
