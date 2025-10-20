module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { results } = req.body || {};
  const bot = process.env.TG_BOT_TOKEN;
  const chat = process.env.TG_CHAT_ID;

  if (!bot || !chat) {
    return res.status(400).json({ error: 'Missing Telegram config' });
  }

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(200).json({ ok: true, skipped: true });
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
      return res.status(502).json({ error: 'Telegram error', detail: error });
    }

    return res.status(200).json({ ok: true, sent: results.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

