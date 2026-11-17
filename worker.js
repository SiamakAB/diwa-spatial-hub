/**
 * DIWA Spatial Hub — AI proxy (Cloudflare Worker)
 *
 * Two ways to run it:
 *   FREE  — add a Workers AI binding named "AI" (Settings → Bindings → Workers AI). No API key needed.
 *           Chat uses an open model (default Llama 3.3 70B fast) within Cloudflare's free daily allowance.
 *   CLAUDE — additionally set the secret ANTHROPIC_API_KEY; chat then uses Claude.
 *
 * Voice: with the "AI" binding, POST { tts: "text" } returns speech audio (default: MeloTTS; Aura-2 optional).
 *
 * Variables (Settings → Variables and Secrets), all optional:
 *   ALLOWED_ORIGINS  e.g. https://siamakab.github.io   (comma-separated; '*' allows any site)
 *   MODEL            Claude model when ANTHROPIC_API_KEY is set (default claude-haiku-5-5)
 *   FREE_MODEL       Workers AI chat model (default @cf/meta/llama-3.3-70b-instruct-fp8-fast)
 *   TTS_MODEL        @cf/myshell-ai/melotts (default, very light on the free allowance) or @cf/deepgram/aura-2-en
 *                    (most natural, but uses most of the free daily allowance after a few dozen answers)
 *   TTS_VOICE        Aura voice name (default "luna"; other female voices include "asteria", "athena", "thalia")
 */

const SYSTEM = `You are the Hub Assistant inside the DIWA Spatial Hub, an immersive 3D web environment
that presents environmental research sites in Finland as interactive miniature landscapes.
Answer questions about the hall and general questions helpfully, accurately and concisely: usually 2–4 short sentences or a short list.
Your answers are read aloud, so write in plain, natural spoken sentences without tables, code or heavy formatting.
If you are not sure about a fact, say so.`;

// Questions about the hall itself don't need a web lookup.
const HUB_WORDS = /\b(hall|hub|room|here|this place|table|tables|supersite|supersites|site|sites|sensor|sensors|globe|globes|panel|panels|screen|screens|video|videos|map|news|board|lounge|sofa|whiteboard|orb|you see|can you see|scenario|scenarios|timeline|season|layer|layers|button|music|avatar|360|panorama|diwa|oulanka|oulankajoki)\b/i;

// Short, free, keyless lookup on Wikipedia for current facts (who holds an office, what something is, recent events).
function searchTerms(q) {
  return q.toLowerCase()
    .replace(/\b(u\.?s\.?a?|america)\b/g, 'united states').replace(/\buk\b/g, 'united kingdom').replace(/\beu\b/g, 'european union')
    .replace(/\b(hi|hello|hey|please|can|could|would|you|tell|me|about|who|what|whats|when|where|which|why|how|is|are|was|were|the|a|an|of|now|current|currently|today|right|do|does|did|know|i|want|to)\b/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim() || q;
}
async function wikiNotes(q) {
  try {
    q = searchTerms(q);
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=2&gsrsearch='
      + encodeURIComponent(q.slice(0, 200)) + '&prop=extracts&exintro=1&explaintext=1&exlimit=2&exchars=1400&origin=*';
    const r = await fetch(url, { headers: { 'User-Agent': 'DIWA-Spatial-Hub/1.0 (https://siamakab.github.io/diwa-spatial-hub/)' } });
    if (!r.ok) return '';
    const j = await r.json();
    const pages = Object.values(j?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages.filter(p => p.extract).map(p => `[${p.title}] ${p.extract.replace(/\s+/g, ' ').trim()}`).join('\n\n');
  } catch { return ''; }
}

async function buildSystem(body, messages) {
  const today = new Date().toUTCString().slice(0, 16);
  let sys = SYSTEM + `\nToday's date is ${today}. Your own training knowledge may be out of date: for anything about the present (who holds an office, recent events), prefer the reference notes below over your memory.`;
  const ctx = typeof body.context === 'string' ? body.context.slice(0, 9000) : '';
  if (ctx) sys += `\n\nYou live inside a 3D web environment and can see it. When the user asks about "here", "this hall", the tables, supersites, panels, videos, map, news or anything around them, answer ONLY from this description, never from general knowledge about other places:\n${ctx}`;
  const last = messages[messages.length - 1].content;
  if (!HUB_WORDS.test(last)) {
    const notes = await wikiNotes(last);
    if (notes) sys += `\n\nREFERENCE NOTES from Wikipedia, fetched just now for the user's question (use them if relevant, ignore them if not, and don't mention Wikipedia unless asked):\n${notes}`;
  }
  return sys;
}

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

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    // ---------- text to speech ----------
    if (typeof body.tts === 'string') {
      if (!env.AI) return json({ error: 'No Workers AI binding named AI' }, 501);
      const text = body.tts.slice(0, 1500);
      const model = env.TTS_MODEL || '@cf/myshell-ai/melotts';
      try {
        const input = model.includes('aura') ? { text, speaker: env.TTS_VOICE || 'luna' } : { prompt: text, lang: 'en' };
        const out = await env.AI.run(model, input);
        let bytes;
        if (out instanceof ReadableStream || out instanceof ArrayBuffer || out instanceof Uint8Array) bytes = out;
        else if (out && typeof out.audio === 'string') bytes = Uint8Array.from(atob(out.audio), c => c.charCodeAt(0));
        else if (out && out.audio) bytes = out.audio;
        if (!bytes) return json({ error: 'No audio returned' }, 502);
        return new Response(bytes, { headers: { ...cors, 'Content-Type': 'audio/mpeg' } });
      } catch (e) { return json({ error: 'TTS failed: ' + (e.message || e) }, 502); }
    }

    // ---------- chat ----------
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-16)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) return json({ error: 'No message' }, 400);
    const system = await buildSystem(body, messages);

    if (env.ANTHROPIC_API_KEY) {
      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 600, system, messages }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) return json({ error: data?.error?.message || `Upstream error ${upstream.status}` }, 502);
      const reply = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
      return json({ reply: reply || 'Sorry, I have no answer for that.', engine: 'claude' });
    }

    if (env.AI) {
      try {
        const out = await env.AI.run(env.FREE_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [{ role: 'system', content: system }, ...messages], max_tokens: 500 });
        const reply = (out && (out.response || out.result?.response) || '').trim();
        return json({ reply: reply || 'Sorry, I have no answer for that.', engine: 'workers-ai' });
      } catch (e) {
        const m = String(e.message || e);
        if (/4006|neurons|daily free/i.test(m)) return json({ reply: 'I have used up today’s free AI allowance, so I need a short break. I’ll be back after the daily reset at midnight UTC, which is 2 am in Finland.', engine: 'workers-ai', limit: true });
        return json({ error: 'AI model unavailable: ' + m }, 502);
      }
    }

    return json({ error: 'The worker has no AI binding and no ANTHROPIC_API_KEY' }, 500);
  },
};
