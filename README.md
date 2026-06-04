# Playwright Self-Healing Locator with AI 🤖🩹

An intelligent, self-healing test automation framework built on top of [Playwright](https://playwright.dev/). This framework uses AI (OpenAI / Anthropic) to dynamically repair broken locators caused by UI changes, reducing test flakiness and maintenance overhead.

## 🚀 Features

- **Self-Healing Locators**: Automatically falls back to an AI-powered search when a standard Playwright locator fails.
- **Confidence Engine v1**: A robust validation engine that calculates `ruleBasedSimilarity`, `roleSimilarity`, `accessibleNameSimilarity`, and `uniqueness` to ensure the AI's suggested locator is trustworthy. Rejects false positives!
- **Accessibility Tree (ariaSnapshot) Integration**: Extracts lightweight semantic UI trees instead of heavy HTML, making AI context small, fast, and highly accurate.
- **Auto-Reporting**: Generates a detailed JSON report (`self-healing-summary.json`) that compares the `oldLocator` with the `aiRecommendedLocator`, alongside the confidence score breakdown.
- **Allure Integration**: Automatically attaches the healing results to the Allure Report.

## 🛠️ Architecture

```text
Broken Locator
       ↓
Rule-Based Similarity Analysis
       ↓
LLM Locator Repair (via ariaSnapshot)
       ↓
Framework Confidence Engine (Threshold >= 80)
       ↓
Accept / Reject
       ↓
Retry Execution
```

## 📦 Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```
4. Configure `.env`:
   Copy `.env.example` to `.env` and fill in your AI provider's API Key.
   ```bash
   cp .env.example .env
   ```

## 🧪 Usage

Run the Playwright test suite:
```bash
npx playwright test
```

To view the generated report:
```bash
cat test-results/self-healing-results/self-healing-summary.json
```

To view the Allure Report:
```bash
npx allure serve allure-results
```

## 🛡️ The Confidence Engine

To prevent "False Positives" (where AI heals a locator but targets the wrong element), the Confidence Engine evaluates the AI's suggestion using:
1. **Rule-Based Similarity (30%)**: Jaccard similarity between the keywords of the old and new locator.
2. **Role Similarity (25%)**: Ensures the HTML semantic role hasn't drifted (e.g., a `textbox` shouldn't turn into a `button`).
3. **Accessible Name Similarity (30%)**: Levenshtein distance calculation to measure text changes.
4. **Uniqueness (15%)**: Ensures the new locator precisely targets exactly 1 element in the DOM.

If the Final Score is `< 80`, the healing is explicitly rejected to prevent flow errors.
