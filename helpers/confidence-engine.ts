import { ElementDescriptor } from './resilient-locator';

// ── V1 Breakdown ─────────────────────────────────────────────────────────────
export interface ConfidenceBreakdownV1 {
  version: 'v1';
  ruleBasedSimilarity: number;
  roleSimilarity: number;
  accessibleNameSimilarity: number;
  uniqueness: number;
}

// ── V2 Breakdown ─────────────────────────────────────────────────────────────
export interface ConfidenceBreakdownV2 {
  version: 'v2';
  locatorStrategyQuality: number;
  intentMatch: number;
  roleMatch: number;
  contextMatch: number;
  previousAttributeMatch: number;
  uniqueness: number;
}

export type ConfidenceBreakdown = ConfidenceBreakdownV1 | ConfidenceBreakdownV2;

export interface ConfidenceResult {
  finalScore: number;
  accepted: boolean;
  breakdown: ConfidenceBreakdown;
}

export class ConfidenceEngine {
  private static readonly THRESHOLD = 80;

  // ── Public Entry Point ───────────────────────────────────────────────────────

  /**
   * Automatically selects V1 or V2 scoring based on descriptor richness.
   * V2 is used when the original descriptor contains `intent` or `parentContext`.
   */
  static validateRepair(
    original: ElementDescriptor,
    suggested: ElementDescriptor,
    snapshot: unknown
  ): ConfidenceResult {
    const hasV2Metadata = !!(original.intent || original.parentContext || original.previousAttributes);

    if (hasV2Metadata) {
      return this.validateRepairV2(original, suggested, snapshot);
    }
    return this.validateRepairV1(original, suggested, snapshot);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // V1 ENGINE (Post #2 — Original)
  // ══════════════════════════════════════════════════════════════════════════════

  private static validateRepairV1(
    original: ElementDescriptor,
    suggested: ElementDescriptor,
    snapshot: unknown
  ): ConfidenceResult {
    const ruleBasedSimilarity = this.calculateRuleBasedSimilarity(original, suggested);
    const roleSimilarity = this.calculateRoleSimilarity(original, suggested);
    const accessibleNameSimilarity = this.calculateNameSimilarity(original, suggested);
    const uniqueness = this.calculateUniqueness(suggested, snapshot);

    const finalScore = Math.round(
      ruleBasedSimilarity * 0.3 +
      roleSimilarity * 0.25 +
      accessibleNameSimilarity * 0.3 +
      uniqueness * 0.15
    );

    return {
      finalScore,
      accepted: finalScore >= this.THRESHOLD,
      breakdown: {
        version: 'v1',
        ruleBasedSimilarity,
        roleSimilarity,
        accessibleNameSimilarity,
        uniqueness
      }
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // V2 ENGINE (Post #3 — Garbage In, Garbage Out)
  // ══════════════════════════════════════════════════════════════════════════════

  private static validateRepairV2(
    original: ElementDescriptor,
    suggested: ElementDescriptor,
    snapshot: unknown
  ): ConfidenceResult {
    const locatorStrategyQuality = this.calculateLocatorStrategyQuality(suggested);
    const intentMatch = this.calculateIntentMatch(original, suggested);
    const roleMatch = this.calculateRoleSimilarity(original, suggested);
    const contextMatch = this.calculateContextMatch(original, snapshot);
    const previousAttributeMatch = this.calculatePreviousAttributeMatch(original, suggested);
    const uniqueness = this.calculateUniqueness(suggested, snapshot);

    // V2 Weights: Strategy(30) + Intent(25) + Role(20) + Context(15) + PrevAttr(10) = 100
    // Uniqueness is kept as a separate gate — if uniqueness is 0, cap score at 60
    const rawScore = Math.round(
      locatorStrategyQuality * 0.30 +
      intentMatch * 0.25 +
      roleMatch * 0.20 +
      contextMatch * 0.15 +
      previousAttributeMatch * 0.10
    );

    const finalScore = uniqueness === 0 ? Math.min(rawScore, 60) : rawScore;

    return {
      finalScore,
      accepted: finalScore >= this.THRESHOLD,
      breakdown: {
        version: 'v2',
        locatorStrategyQuality,
        intentMatch,
        roleMatch,
        contextMatch,
        previousAttributeMatch,
        uniqueness
      }
    };
  }

  // ── V2 Signal: Locator Strategy Quality ────────────────────────────────────

  private static calculateLocatorStrategyQuality(suggested: ElementDescriptor): number {
    // testId is the strongest automation contract
    if (suggested.testId) return 100;
    // role + name is strong and user-facing
    if (suggested.role && suggested.name) return 80;
    // label alone is medium
    if (suggested.label) return 60;
    // role without name
    if (suggested.role) return 50;
    // text only
    if (suggested.text) return 30;
    // css is last resort
    if (suggested.css) return 20;
    return 0;
  }

  // ── V2 Signal: Intent Match (Jaccard Keyword Similarity) ───────────────────

  private static calculateIntentMatch(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    const intent = original.intent;
    if (!intent) return 50; // Neutral if no intent provided

    // Extract keywords from intent
    const intentKeywords = new Set(
      intent.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2)
    );

    // Extract keywords from all suggested attributes
    const suggestedKeywords = new Set<string>();
    for (const val of Object.values(suggested)) {
      if (typeof val === 'string') {
        val.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2)
          .forEach(w => suggestedKeywords.add(w));
      } else if (val instanceof RegExp) {
        val.source.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2)
          .forEach(w => suggestedKeywords.add(w));
      }
    }

    if (intentKeywords.size === 0) return 50;

    // Jaccard similarity: intersection / union
    let intersection = 0;
    for (const keyword of intentKeywords) {
      if (suggestedKeywords.has(keyword)) intersection++;
    }

    const union = new Set([...intentKeywords, ...suggestedKeywords]).size;
    if (union === 0) return 0;

    return Math.round((intersection / union) * 100);
  }

  // ── V2 Signal: Context Match (Nearby Text Overlap) ─────────────────────────

  private static calculateContextMatch(
    original: ElementDescriptor,
    snapshot: unknown
  ): number {
    const nearbyText = original.parentContext?.nearbyText;
    if (!nearbyText || nearbyText.length === 0) return 50; // Neutral if no context

    const snapshotText = typeof snapshot === 'string' ? snapshot.toLowerCase() : JSON.stringify(snapshot).toLowerCase();

    let found = 0;
    for (const text of nearbyText) {
      if (snapshotText.includes(text.toLowerCase())) {
        found++;
      }
    }

    return Math.round((found / nearbyText.length) * 100);
  }

  // ── V2 Signal: Previous Attribute Match ────────────────────────────────────

  private static calculatePreviousAttributeMatch(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    const prev = original.previousAttributes;
    if (!prev) return 50; // Neutral if no previous attributes

    let totalChecks = 0;
    let matched = 0;

    // Check dataTestId
    if (prev.dataTestId) {
      totalChecks++;
      if (suggested.testId && suggested.testId.includes(prev.dataTestId)) {
        matched++;
      } else if (suggested.testId) {
        // Partial match via Jaccard
        const prevTokens = new Set(prev.dataTestId.toLowerCase().split(/[-_]+/));
        const sugTokens = new Set(suggested.testId.toLowerCase().split(/[-_]+/));
        let overlap = 0;
        for (const t of prevTokens) { if (sugTokens.has(t)) overlap++; }
        if (overlap > 0) matched += overlap / Math.max(prevTokens.size, sugTokens.size);
      }
    }

    // Check placeholder
    if (prev.placeholder) {
      totalChecks++;
      const sugName = this.getStringValue(suggested.name) || suggested.label || '';
      if (sugName.toLowerCase().includes(prev.placeholder.toLowerCase().substring(0, 10))) {
        matched++;
      }
    }

    if (totalChecks === 0) return 50;
    return Math.round((matched / totalChecks) * 100);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SHARED SIGNALS (Used by both V1 and V2)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Shared: Rule-Based Similarity (V1 only) ────────────────────────────────

  private static calculateRuleBasedSimilarity(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    const extractKeywords = (desc: ElementDescriptor): Set<string> => {
      const tokens: string[] = [];
      Object.values(desc).forEach(val => {
        if (typeof val === 'string') {
          const words = val.toLowerCase().split(/[^a-z0-9]+/);
          tokens.push(...words.filter(w => w.length > 2));
        } else if (val instanceof RegExp) {
          const words = val.source.toLowerCase().split(/[^a-z0-9]+/);
          tokens.push(...words.filter(w => w.length > 2));
        }
      });
      return new Set(tokens);
    };

    const originalKeywords = extractKeywords(original);
    const suggestedKeywords = extractKeywords(suggested);

    if (originalKeywords.size === 0) return 0;

    let matched = 0;
    for (const keyword of suggestedKeywords) {
      if (originalKeywords.has(keyword)) {
        matched++;
      }
    }

    const score = (matched / originalKeywords.size) * 100;
    return Math.min(Math.round(score), 100);
  }

  // ── Shared: Role Similarity ────────────────────────────────────────────────

  private static calculateRoleSimilarity(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    if (!original.role || !suggested.role) {
      return 50; // Neutral if missing
    }

    const oRole = original.role.toLowerCase();
    const sRole = suggested.role.toLowerCase();

    if (oRole === sRole) return 100;

    // Partial mappings for semantic role drift
    const roleGroups = [
      ['textbox', 'searchbox', 'combobox', 'spinbutton'],
      ['button', 'link', 'menuitem'],
      ['listbox', 'list', 'group']
    ];

    for (const group of roleGroups) {
      if (group.includes(oRole) && group.includes(sRole)) {
        return 70;
      }
    }

    return 0;
  }

  // ── Shared: Accessible Name Similarity (V1 only) ───────────────────────────

  private static calculateNameSimilarity(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    const oName = this.getStringValue(original.name) || original.label || this.getStringValue(original.text) || '';
    const sName = this.getStringValue(suggested.name) || suggested.label || this.getStringValue(suggested.text) || '';

    if (!oName && !sName) return 100;
    if (!oName || !sName) return 0;

    const distance = this.levenshtein(oName.toLowerCase(), sName.toLowerCase());
    const maxLength = Math.max(oName.length, sName.length);

    if (maxLength === 0) return 100;

    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.round(similarity);
  }

  // ── Shared: Element Uniqueness ─────────────────────────────────────────────

  private static calculateUniqueness(
    suggested: ElementDescriptor,
    snapshot: unknown
  ): number {
    const sNameObj = suggested.name || suggested.label || suggested.text;
    const sName = this.getStringValue(sNameObj) || '';
    if (!sName) return 50;

    const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

    const escapedName = sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedName, 'gi');

    const matchCount = (snapshotText.match(regex) || []).length;

    if (matchCount === 1) return 100;
    if (matchCount === 2) return 50;
    return 0;
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  private static getStringValue(val: unknown): string {
    if (typeof val === 'string') return val;
    if (val instanceof RegExp) return val.source;
    return '';
  }

  private static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
