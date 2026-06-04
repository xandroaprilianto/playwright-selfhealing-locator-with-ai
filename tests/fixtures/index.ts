import { test as base } from '@playwright/test';
import { BasePage } from '../../pages/base.page';
import { LoginPage } from '../../pages/login.page';
import { RegisterPage } from '../../pages/register.page';
import { ForgotPasswordPage } from '../../pages/forgot-password.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { ProductsV1Page } from '../../pages/products-v1.page';
import { ProductsV2Page } from '../../pages/products-v2.page';
import { SupportV1Page } from '../../pages/support-v1.page';
import { SupportV2Page } from '../../pages/support-v2.page';

type MyFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
  dashboardPage: DashboardPage;
  productsV1Page: ProductsV1Page;
  productsV2Page: ProductsV2Page;
  supportV1Page: SupportV1Page;
  supportV2Page: SupportV2Page;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use, testInfo) => {
    await use(new LoginPage(page));
    BasePage.saveHealingReport(testInfo);
  },
  registerPage: async ({ page }, use, testInfo) => {
    await use(new RegisterPage(page));
    BasePage.saveHealingReport(testInfo);
  },
  forgotPasswordPage: async ({ page }, use, testInfo) => {
    await use(new ForgotPasswordPage(page));
    BasePage.saveHealingReport(testInfo);
  },
  dashboardPage: async ({ page }, use, testInfo) => {
    await use(new DashboardPage(page));
    BasePage.saveHealingReport(testInfo);
  },
  productsV1Page: async ({ page }, use, testInfo) => {
    await use(new ProductsV1Page(page));
    BasePage.saveHealingReport(testInfo);
  },
  productsV2Page: async ({ page }, use, testInfo) => {
    await use(new ProductsV2Page(page));
    BasePage.saveHealingReport(testInfo);
  },
  supportV1Page: async ({ page }, use, testInfo) => {
    await use(new SupportV1Page(page));
    BasePage.saveHealingReport(testInfo);
  },
  supportV2Page: async ({ page }, use, testInfo) => {
    await use(new SupportV2Page(page));
    BasePage.saveHealingReport(testInfo);
  }
});

export { expect } from '@playwright/test';
