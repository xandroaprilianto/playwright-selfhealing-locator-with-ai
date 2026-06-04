import { test, expect } from '../../fixtures';
import { AuthBuilder } from '../../../helpers/builders';
import { allure } from 'allure-playwright';

test.describe('Authentication (Login)', () => {
  test('TC_LOG_01 - Successful Login', async ({ loginPage, page }) => {
    allure.epic('Authentication');
    allure.feature('Login');
    allure.story('Successful Login');
    allure.severity('critical');

    const data = AuthBuilder.validAdmin();
    await loginPage.navigate();
    await loginPage.login(data.email, data.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test('TC_LOG_02 - Login Failure - Wrong Credentials', async ({ loginPage, page }) => {
    allure.epic('Authentication');
    allure.feature('Login');
    allure.story('Login Failure - Wrong Credentials');
    allure.severity('normal');

    const data = AuthBuilder.invalidWrongPassword();
    await loginPage.navigate();
    await loginPage.login(data.email, data.password);
    
    // Check error message "Email atau password salah"
    await expect(page.getByText('Email atau password salah')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('TC_LOG_03 - Login Field Validation', async ({ loginPage, page }) => {
    allure.epic('Authentication');
    allure.feature('Login');
    allure.story('Login Field Validation');
    allure.severity('normal');

    const data = AuthBuilder.allEmpty();
    await loginPage.navigate();
    await loginPage.login(data.email, data.password);

    // According to test_cases.md, it should prevent submission or show message.
    await expect(page).toHaveURL('/login');
  });

  test('TC_LOG_04 - Auth Guard Redirection', async ({ dashboardPage, page }) => {
    allure.epic('Authentication');
    allure.feature('Login');
    allure.story('Auth Guard Redirection');
    allure.severity('normal');

    // Access dashboard without login
    await dashboardPage.navigate();
    // Should be redirected to /login
    await expect(page).toHaveURL('/login');
  });
});
