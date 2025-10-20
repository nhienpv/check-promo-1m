module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const code = req.query.code || req.body?.code;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  const bearer = process.env.OPENAI_BEARER;
  
  if (!bearer) {
    return res.status(500).json({ error: 'Missing OPENAI_BEARER environment variable' });
  }

  try {
    const response = await fetch(
      `https://chatgpt.com/backend-api/promotions/metadata/${code}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${bearer}`,
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

