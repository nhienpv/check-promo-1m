export default async (request, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    // Get environment variables from Netlify
    const config = {
      BEARER_TOKEN: process.env.OPENAI_BEARER || '',
      TG_BOT_TOKEN: process.env.TG_BOT_TOKEN || '',
      TG_CHAT_ID: process.env.TG_CHAT_ID || '',
      AUTO_LOAD_TOKEN: true,
      SHOW_TOKEN_WARNING: true
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Config API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load config' }), {
      status: 500,
      headers
    });
  }
};
