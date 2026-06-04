import { test, expect } from '../../fixtures';
import { ResilientLocator } from '../../../helpers/resilient-locator';
import { AuthBuilder } from '../../../helpers/builders';

test.describe('ResilientLocator Unit Verification', () => {
  test('TC_UNIT_SH - Verify ResilientLocator static fallback cascade', async ({ loginPage, page }) => {
    await loginPage.navigate();

    // Create a resilient locator:
    // 1st option (role + name): "Wrong Button Name" (broken, doesn't match the UI)
    // 2nd option (testId): "login-btn" (valid)
    const loginBtnResilient = new ResilientLocator(
      page,
      {
        role: 'button',
        name: 'Wrong Button Name',
        testId: 'login-btn',
      },
      'Resilient Login Button'
    );

    const admin = AuthBuilder.validAdmin();
    await loginPage.emailInput.fill(admin.email);
    await loginPage.passwordInput.fill(admin.password);

    // Act: Click via resilient locator
    await loginBtnResilient.click();

    // Assert: We should have logged in successfully
    await expect(page).toHaveURL('/dashboard');
  });
});
