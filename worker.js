/**
 * DIWA Spatial Hub — AI proxy (Cloudflare Worker)
 *
 * Keeps your Anthropic API key off the public web page. The hub sends
 *   POST { messages: [{ role: 'user' | 'assistant', content: '...' }] }
 * and receives
 *   { reply: '...' }   or   { error: '...' }
 *
 * Settings (Cloudflare dashboard → your Worker → Settings → Variables and Secrets):
 *   ANTHROPIC_API_KEY  (Secret)  your key from console.anthropic.com
 *   ALLOWED_ORIGINS    (Text)    e.g. https://siamakab.github.io   (comma-separated; '*' allows any site)
 *   MODEL              (Text)    optional, defaults to claude-haiku-5-5
 */

const SYSTEM = `You are the Hub Assistant inside the DIWA Spatial Hub, an immersive 3D web environment
that presents environmental research sites in Finland as interactive miniature landscapes.
Answer general questions helpfully, accurately and concisely: usually 2–4 short paragraphs or a short list.
Your answers may be read aloud, so write in plain sentences and avoid tables, code and heavy formatting
unless the user asks for them. If you are not sure about a fact, say so.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
    const anyOrigin = allowed.includes('*');
    const cors = {
      'Access-Control-Allow-Origin': anyOrigin ? '*' : (allowed.includes(origin) ? origin : allowed[0] || ''),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);
    if (!anyOrigin && !allowed.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY is not set on the worker' }, 500);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    // Keep only well-formed turns, cap length, and make sure the conversation starts with the user.
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-16)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) return json({ error: 'No message' }, 400);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 700, system: SYSTEM, messages }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json({ error: data?.error?.message || `Upstream error ${upstream.status}` }, 502);
    const reply = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    return json({ reply: reply || 'Sorry, I have no answer for that.' });
  },
};
