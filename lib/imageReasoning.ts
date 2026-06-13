import { getOpenAIClient, CHAT_MODEL } from './openai';
import type { ImageReasoningResult } from '../types';

const REASONING_PROMPT = `Given this story exchange, did something visually significant happen? (new character appeared, scene changed dramatically, important action occurred, emotional peak). Reply with JSON only: {"shouldGenerate": boolean, "reason": string, "subjectDescription": string}`;

export async function imageReasoning(
  userMessage: string,
  assistantResponse: string
): Promise<ImageReasoningResult> {
  const client = getOpenAIClient();

  const exchange = `User: ${userMessage}\n\nNarrator: ${assistantResponse}`;

  try {
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: REASONING_PROMPT },
        { role: 'user', content: exchange },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<ImageReasoningResult>;

    return {
      shouldGenerate: parsed.shouldGenerate ?? false,
      reason: parsed.reason ?? '',
      subjectDescription: parsed.subjectDescription ?? '',
    };
  } catch (err) {
    console.error('[imageReasoning] Failed:', err);
    return { shouldGenerate: false, reason: 'error', subjectDescription: '' };
  }
}
