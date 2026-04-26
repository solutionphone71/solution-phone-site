// Supabase Edge Function — proxy Evan chat vers Claude API
// Déployer avec: supabase functions deploy evan-chat --no-verify-jwt
// Puis ajouter le secret: supabase secrets set CLAUDE_API_KEY=sk-ant-...

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY') || '';

// Rate limiting simple par IP (en mémoire — reset au redéploiement)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // max 20 requêtes
const RATE_WINDOW = 60 * 60 * 1000; // par heure

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Rate limit
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Réessaie dans quelques minutes.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await req.json();

    // Validation: only allow expected fields
    const { system, messages } = body;
    if (!messages || !Array.isArray(messages) || messages.length > 12) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Forward to Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system: system || '',
        messages,
      }),
    });

    const data = await claudeRes.json();
    return new Response(JSON.stringify(data), {
      status: claudeRes.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
