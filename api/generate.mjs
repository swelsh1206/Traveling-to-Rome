import { GoogleGenAI } from '@google/genai';

/** Vercel serverless function */
export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });

    // Body might be string or object depending on caller
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const prompt = body.prompt || 'hello';

    const ai = new GoogleGenAI({ apiKey });
    // Text model for normal responses; use "gemini-2.5-flash-image" in a separate route for image bytes
    const model = ai.models.get('gemini-2.5-flash');

    const r = await model.generateContent({ contents: prompt });
    return res.status(200).json({ text: r.text() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
