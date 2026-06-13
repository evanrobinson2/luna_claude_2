import type { KnowledgeNode, CharacterAttributes, StyleRuleAttributes, WorldRuleAttributes } from '../types';

const MAX_PROMPT_LENGTH = 800;

/**
 * Build a DALL-E 3 prompt from:
 * 1. Subject description (from imageReasoning)
 * 2. StyleRule node prompt fragments
 * 3. Character visual description tokens
 * 4. WorldRule visual context
 */
export function buildDallePrompt(
  subjectDescription: string,
  knowledgeNodes: KnowledgeNode[]
): { prompt: string; usedNodeIds: string[] } {
  const usedNodeIds: string[] = [];
  const parts: string[] = [];

  // 1. Subject description is the anchor
  parts.push(subjectDescription.trim());

  // 2. StyleRule fragments — sorted by priority descending
  const styleRules = knowledgeNodes
    .filter((n) => n.type === 'StyleRule')
    .sort((a, b) => {
      const pa = ((a.attributes as StyleRuleAttributes).priority ?? 0);
      const pb = ((b.attributes as StyleRuleAttributes).priority ?? 0);
      return pb - pa;
    });

  for (const rule of styleRules) {
    const fragment = (rule.attributes as StyleRuleAttributes).promptFragment;
    if (fragment) {
      parts.push(fragment.trim());
      usedNodeIds.push(rule.id);
    }
  }

  // 3. Character visual descriptions — find characters mentioned in subjectDescription
  const characters = knowledgeNodes.filter((n) => n.type === 'Character');
  for (const char of characters) {
    const attrs = char.attributes as CharacterAttributes;
    if (attrs.visualDescription) {
      // Check if this character seems relevant (name appears in subject)
      const nameMentioned = subjectDescription.toLowerCase().includes(char.name.toLowerCase());
      if (nameMentioned) {
        parts.push(`${char.name}: ${attrs.visualDescription}`);
        usedNodeIds.push(char.id);
      }
    }
  }

  // 4. WorldRule visual context (first 2 only)
  const worldRules = knowledgeNodes.filter((n) => n.type === 'WorldRule').slice(0, 2);
  for (const rule of worldRules) {
    const desc = (rule.attributes as WorldRuleAttributes).description;
    if (desc) {
      parts.push(desc.trim());
      usedNodeIds.push(rule.id);
    }
  }

  // Join and truncate to MAX_PROMPT_LENGTH
  let prompt = parts.join('. ');
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.slice(0, MAX_PROMPT_LENGTH - 3) + '...';
  }

  return { prompt, usedNodeIds };
}

/**
 * Build turnaround sheet prompt for a specific angle.
 */
export function buildTurnaroundPrompt(
  characterName: string,
  visualDescription: string,
  angle: string,
  styleNodes: KnowledgeNode[]
): string {
  const styleParts = styleNodes
    .filter((n) => n.type === 'StyleRule')
    .map((n) => (n.attributes as StyleRuleAttributes).promptFragment)
    .filter(Boolean)
    .join(', ');

  const base = `Character reference sheet, ${angle}, full white background, ${characterName}: ${visualDescription}`;
  const withStyle = styleParts ? `${base}. Art style: ${styleParts}` : base;

  return withStyle.slice(0, MAX_PROMPT_LENGTH);
}
