import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'https://deno.land/std@0.208.0/node/crypto.ts';

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

    if (!pixelId || !accessToken) {
      console.error('Missing Facebook credentials:', { pixelId, accessToken: !!accessToken });
      return new Response(
        JSON.stringify({ error: 'Missing Facebook configuration' }), 
        { status: 500 }
      );
    }

    // Hash do email (SHA256)
    const hashedEmail = user_email
      ? crypto.createHash('sha256').update(user_email.toLowerCase().trim()).digest('hex')
      : null;

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

    console.log('Facebook CAPI event sent:', event);
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error('Facebook CAPI error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500 }
    );
  }
});