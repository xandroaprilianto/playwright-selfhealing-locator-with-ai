import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { ElementDescriptor } from './resilient-locator';

export async function runAiLocatorRepair(
  snapshot: any,
  originalDescriptor: ElementDescriptor,
  debugName: string
): Promise<ElementDescriptor | null> {
  const provider = process.env.AI_PROVIDER || 'openai';
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (
    (!openaiKey || openaiKey === 'your_openai_api_key_here') && 
    (!anthropicKey || anthropicKey === 'your_anthropic_api_key_here')
  ) {
    console.warn('[AiLocatorRepair] API keys are not defined. Using mocked AI healing for demonstration.');
    
    // Mock the self-healing AI logic based on known locators
    if (debugName === 'Products V1 Search Input') {
      return {
        testId: 'search-input'
      };
    }
    
    return null;
  }

  const prompt = `You are a test automation self-healing locator assistant.
A test locator failed on a webpage. Your task is to analyze the accessibility snapshot of the current page and propose a repaired/new ElementDescriptor to locate the target element.

Target Element Debug Name: "${debugName}"
Original ElementDescriptor: ${JSON.stringify(originalDescriptor, null, 2)}

Accessibility Snapshot of current page:
${JSON.stringify(snapshot, null, 2)}

Based on the original descriptor and the accessibility snapshot, find the corresponding element. Propose the best matching attributes for a new ElementDescriptor.
Format the output as a clean JSON object adhering to the ElementDescriptor interface:
{
  "role": "...",     // role name (e.g. "button", "link", "textbox")
  "name": "...",     // text name or RegExp pattern (string only in JSON)
  "testId": "...",   // data-testid attribute if visible/inferred
  "text": "...",     // text content
  "label": "...",    // label text
  "css": "..."       // CSS selector (last resort)
}

Output ONLY the JSON object. Do not include any markdown fences or explanation.`;

  try {
    let textResponse = '';

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      textResponse = response.choices[0]?.message?.content || '';
    } else {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });
      textResponse = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // Extract JSON block from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const resolved = JSON.parse(jsonMatch[0]) as ElementDescriptor;
      return resolved;
    }
  } catch (error) {
    console.error(`[AiLocatorRepair] Error calling ${provider} API:`, error);
  }

  return null;
}

