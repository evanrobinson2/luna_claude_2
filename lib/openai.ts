import OpenAI from 'openai';

// Singleton OpenAI client
let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export default getOpenAIClient;

// ─── Shared model constants ────────────────────────────────────────────────────

export const CHAT_MODEL = 'gpt-4o' as const;
export const IMAGE_MODEL = 'dall-e-3' as const;

export const LUNA_SYSTEM_PROMPT = `You are Luna, an AI narrator and creative thought partner. You co-create stories with the user in rich, vivid, literary prose. You maintain the story canon and character consistency. You are imaginative, emotionally resonant, and adapt your voice to the story's genre and tone. Respond in 2-4 paragraphs unless the user requests otherwise.`;
