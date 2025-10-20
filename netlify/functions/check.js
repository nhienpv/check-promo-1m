exports.handler = async (event, context) => {
  const code = event.queryStringParameters?.code;
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing code parameter' })
    };
  }

  const bearer = process.env.OPENAI_BEARER;
  
  if (!bearer) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing OPENAI_BEARER environment variable' })
    };
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
    
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

