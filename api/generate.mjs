import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  try {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const prompt = body.prompt || 'hello';

    const ai = new GoogleGenAI({ apiKey: key });
    const model = ai.models.get('gemini-2.5-flash');
    const r = await model.generateContent({ contents: prompt });

    return res.status(200).json({ text: r.text() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
