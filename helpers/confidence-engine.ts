import { ElementDescriptor } from './resilient-locator';

export interface ConfidenceBreakdown {
  ruleBasedSimilarity: number;
  roleSimilarity: number;
  accessibleNameSimilarity: number;
  uniqueness: number;
}

export interface ConfidenceResult {
  finalScore: number;
  accepted: boolean;
  breakdown: ConfidenceBreakdown;
}

export class ConfidenceEngine {
  private static readonly THRESHOLD = 80;

  /**
   * Evaluates the AI-suggested repair and returns a confidence score.
   */
  static validateRepair(
    original: ElementDescriptor,
    suggested: ElementDescriptor,
    snapshot: any
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
        ruleBasedSimilarity,
        roleSimilarity,
        accessibleNameSimilarity,
        uniqueness
      }
    };
  }

  // ── Validation Signal 1: Rule-Based Similarity ─────────────────────────────

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

  // ── Validation Signal 2: Role Similarity ───────────────────────────────────

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

  // ── Validation Signal 3: Accessible Name Similarity ────────────────────────

  private static calculateNameSimilarity(
    original: ElementDescriptor,
    suggested: ElementDescriptor
  ): number {
    const getString = (val: any): string => {
      if (typeof val === 'string') return val.toLowerCase();
      if (val instanceof RegExp) return val.source.toLowerCase();
      return '';
    };

    const oName = getString(original.name || original.label || original.text);
    const sName = getString(suggested.name || suggested.label || suggested.text);

    if (!oName && !sName) return 100;
    if (!oName || !sName) return 0;

    // Levenshtein distance normalized to 0-100
    const distance = this.levenshtein(oName, sName);
    const maxLength = Math.max(oName.length, sName.length);

    if (maxLength === 0) return 100;

    const similarity = ((maxLength - distance) / maxLength) * 100;
    return Math.round(similarity);
  }

  private static levenshtein(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
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

  // ── Validation Signal 4: Element Uniqueness ────────────────────────────────

  private static calculateUniqueness(
    suggested: ElementDescriptor,
    snapshot: any
  ): number {
    const sNameObj = suggested.name || suggested.label || suggested.text;
    const sName = typeof sNameObj === 'string' ? sNameObj : (sNameObj instanceof RegExp ? sNameObj.source : '');
    if (!sName) return 50; // Can't reliably measure without a text identifier

    const snapshotText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

    // Escape regex characters
    const escapedName = sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedName, 'gi');

    const matchCount = (snapshotText.match(regex) || []).length;

    if (matchCount === 1) return 100;
    if (matchCount === 2) return 50;
    return 0; // 3 or more matches, or 0 matches
  }
}
