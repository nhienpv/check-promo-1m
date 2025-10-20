export default async (request, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const { results } = await request.json();
  const bot = process.env.TG_BOT_TOKEN;
  const chat = process.env.TG_CHAT_ID;

  if (!bot || !chat) {
    return new Response(JSON.stringify({ error: 'Missing Telegram config' }), { status: 400, headers });
  }

  if (!Array.isArray(results) || results.length === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers });
  }

  // Format message
  let msg = '🎯 <b>Ket qua kiem tra ma</b> 🎯\n\n';
  const vn = results.filter(r => r.status === 'INELIGIBLE');
  const sg = results.filter(r => r.status === 'LIVE');

  const section = (title, arr) => {
    if (arr.length === 0) return '';
    let s = `<b>${title}: ${arr.length} ma</b>\n`;
    // Get time and details from first item
    if (arr.length > 0) {
      s += `🕐 ${arr[0].timestamp}\n`;
      s += `💬 ${arr[0].details}\n`;
    }
    // List all links
    for (const r of arr) {
      s += `https://chatgpt.com/p/${r.code}\n`;
    }
    s += '\n';
    return s;
  };

  msg += section('Ma LIVE (Singapore/Malaysia)', sg);
  msg += section('Ma INELIGIBLE (Vietnam)', vn);

  try {
    const url = `https://api.telegram.org/bot${bot}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: msg,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: 'Telegram error', detail: error }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true, sent: results.length }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
};

