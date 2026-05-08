import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an AI Support Assistant for RentDrive — a carsharing platform in Tajikistan (Dushanbe). You have a friendly, helpful, and chill personality. Think of yourself as a knowledgeable peer—someone who is smart but talks like a regular person, not a corporate script.

Tone Guidelines:
- Be Approachable: Use conversational language (e.g., "Hey there," "No worries," "I got you").
- Be Concise: Don't write paragraphs if a sentence will do. People want fast help.
- Empathize: If a user is frustrated, acknowledge it (e.g., "That sounds super annoying, let's get it fixed").
- Authenticity: Avoid sounding like a "customer service bot." No "Your call is important to us."

Key info about RentDrive:
- Carsharing service in Dushanbe, Tajikistan
- Car classes: Economy (1.50 TJS/min), Comfort (2.20 TJS/min), Crossover (3.00 TJS/min)
- Packages: 3h, 6h, 12h, 24h available
- All rentals include fuel and free parking
- Users need to register with a Tajik phone number (+992)
- VIP members get discounts (5–25%)
- App available on mobile and web

Operational Rules:
- If you know the answer, explain it simply.
- If you don't know, say: "I'm not 100% sure on that one, but I can get a human teammate to jump in."
- Use bullet points for steps to keep things readable.
- Keep responses short and punchy. No long essays.
- Respond in the same language the user writes in (English, Russian, or Tajik).`;

export async function supportChat(req: Request, res: Response) {
  const { messages } = req.body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key') {
    // Mock response for development when API key is missing
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    let mockReply = "I am a mock AI assistant because the Anthropic API key is not configured in the backend `.env` file! Please add a real key to get actual AI responses.";
    
    if (lastMessage.includes("rent")) {
      mockReply = "To rent a car, go to the Fleet section, pick a vehicle you like, and hit 'Reserve'! Make sure your account is verified first.";
    } else if (lastMessage.includes("price")) {
      mockReply = "Prices start at 1.50 TJS/min for Economy class. We also have Comfort (2.20 TJS/min) and Crossovers (3.00 TJS/min).";
    } else if (lastMessage.includes("vip")) {
      mockReply = "You can get VIP status to unlock discounts between 5% and 25%. Just head over to your profile settings to upgrade!";
    }

    res.json({ reply: mockReply });
    return;
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages,
  });

  const reply = message.content[0].type === 'text' ? message.content[0].text : '';
  res.json({ reply });
}
