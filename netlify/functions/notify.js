exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { results } = JSON.parse(event.body || '{}');
  const bot = process.env.TG_BOT_TOKEN;
  const chat = process.env.TG_CHAT_ID;

  if (!bot || !chat) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing Telegram config in environment variables' })
    };
  }

  if (!Array.isArray(results) || results.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, skipped: true })
    };
  }

  // Format message
  let msg = '🎯 <b>Ket qua kiem tra ma</b> 🎯\n\n';
  const vn = results.filter(r => r.status === 'INELIGIBLE');
  const sg = results.filter(r => r.status === 'LIVE');

  const section = (title, arr) => {
    if (arr.length === 0) return '';
    let s = `<b>${title}: ${arr.length} ma</b>\n`;
    if (arr.length > 0) {
      s += `🕐 ${arr[0].timestamp}\n`;
      s += `💬 ${arr[0].details}\n`;
    }
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
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Telegram error', detail: error })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, sent: results.length })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

