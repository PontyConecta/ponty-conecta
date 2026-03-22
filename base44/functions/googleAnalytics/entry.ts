import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { measurementId, clientId, events } = body;

    if (!measurementId) {
      return new Response(
        JSON.stringify({ error: 'Missing Google Analytics Measurement ID' }), 
        { status: 400 }
      );
    }

    const payload = {
      measurement_id: measurementId,
      api_secret: Deno.env.get('GOOGLE_ANALYTICS_API_SECRET') || '',
      client_id: clientId,
      events: events,
    };

    const response = await fetch(
      'https://www.google-analytics.com/mp/collect',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Analytics error:', errorText);
      throw new Error('Error sending Google Analytics event');
    }

    console.log('Google Analytics event sent');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Google Analytics error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
});