import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, eventData = {}, fbp, fbc, user_agent, url, user_email } = body;

    const pixelId = Deno.env.get('VITE_FACEBOOK_PIXEL_ID');
    const accessToken = Deno.env.get('META_API_TOKEN');

    console.log('facebookCAPI called:', { event, pixelId: !!pixelId, accessToken: !!accessToken });

    if (!pixelId || !accessToken) {
      console.error('Missing Facebook credentials:', { pixelId: !!pixelId, accessToken: !!accessToken });
      return new Response(
        JSON.stringify({ error: 'Missing Facebook configuration' }), 
        { status: 500 }
      );
    }

    // Hash do email (SHA256) - usando Web Crypto API (async)
    let hashedEmail = null;
    if (user_email) {
      const encoder = new TextEncoder();
      const data = encoder.encode(user_email.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashedEmail = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const eventPayload = {
      data: [
        {
          event_name: event,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: url,
          action_source: 'website',
          user_data: {
            em: hashedEmail ? [hashedEmail] : [],
            client_ip_address: req.headers.get('x-forwarded-for') || '',
            client_user_agent: user_agent,
            fbp: fbp,
            fbc: fbc,
          },
          custom_data: eventData,
        },
      ],
    };

    console.log('Sending to Facebook:', { pixelId, event });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook CAPI error:', result);
      throw new Error(result.error?.message || 'Error sending Facebook event');
    }

    console.log('Facebook CAPI event sent successfully:', event);
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error('Facebook CAPI error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
});