Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { event, eventData = {}, fbp, fbc, user_agent, url } = body;

    const pixelId = Deno.env.get('VITE_FACEBOOK_PIXEL_ID');
    const accessToken = Deno.env.get('META_API_TOKEN');

    if (!pixelId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing credentials' }), 
        { status: 400 }
      );
    }

    const payload = {
      data: [
        {
          event_name: event,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: url,
          action_source: 'website',
          user_data: {
            client_user_agent: user_agent,
            fbp: fbp || undefined,
            fbc: fbc || undefined,
            client_ip_address: undefined,
          },
          custom_data: eventData,
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Facebook error:', result);
      return new Response(JSON.stringify({ error: result }), { status: response.status });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});