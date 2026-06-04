import { Page, TestInfo } from "@playwright/test";
import { NavbarComponent } from "./components/navbar.component";
import { healingRegistry } from "../helpers/self-healing-locator";
import * as fs from "fs";
import * as path from "path";

export abstract class BasePage {
  readonly navbar: NavbarComponent;

  constructor(protected readonly page: Page) {
    this.navbar = new NavbarComponent(page);
  }

  abstract get pageUrl(): string;

  async navigate(): Promise<this> {
    await this.page.goto(this.pageUrl);
    await this.page.waitForLoadState('networkidle');
    return this;
  }

  static saveHealingReport(testInfo: TestInfo): void {
    if (healingRegistry.length === 0) return;

    const healed = healingRegistry.filter((r) => r.strategy === "ai-healed");
    const failed = healingRegistry.filter((r) => r.strategy === "failed");

    if (healed.length > 0) {
      console.warn(
        `[Self-heal] ${healed.length} locator(s) were AI-healed — update page objects.`
      );
      healed.forEach((r) => {
        console.warn(
          `  ${r.elementName} → ${JSON.stringify(r.healedDescriptor)}`
        );
      });
    }

    const reportPath = path.join("test-results", `healing-${Date.now()}.json`);
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(healingRegistry, null, 2));

    testInfo.attachments.push({
      name: "self-healing-report",
      contentType: "application/json",
      path: reportPath,
    });

    healingRegistry.length = 0;
  }
}
