import type { Handler } from '@netlify/functions';

const SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL || '';

interface SheetRequest {
  type: 'leads' | 'expenses';
  method?: string;
  payload?: any;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as SheetRequest;
    const { type, method = 'GET', payload } = body;

    if (!type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing type parameter' }),
      };
    }

    const url = `${SCRIPT_URL}?type=${type}`;
    const fetchOptions: RequestInit = {
      method,
      mode: 'cors',
      cache: 'no-cache',
    };

    if (method === 'POST' && payload) {
      fetchOptions.headers = {
        'Content-Type': 'application/json',
      };
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Google Sheets API error' }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Sheets API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
