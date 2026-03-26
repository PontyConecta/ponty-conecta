import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALID_EVENTS = ['PageView', 'ViewContent', 'Lead', 'Purchase', 'CompleteRegistration', 'Subscribe'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { event, eventData = {}, fbp, fbc, user_agent, url, email, phone } = body;

    if (!VALID_EVENTS.includes(event)) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const pixelId = Deno.env.get('VITE_FACEBOOK_PIXEL_ID');
    const accessToken = Deno.env.get('META_API_TOKEN');

    if (!pixelId || !accessToken) {
      return Response.json({ error: 'Missing credentials' }, { status: 400 });
    }

    let hashedEmail;
    if (email) {
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashedEmail = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let hashedPhone;
    if (phone) {
      const encoder = new TextEncoder();
      const phoneDigits = phone.replace(/\D/g, '');
      const data = encoder.encode(phoneDigits);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashedPhone = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
            em: hashedEmail || undefined,
            ph: hashedPhone || undefined,
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
      return Response.json({ error: result }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});