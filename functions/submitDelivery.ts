import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { delivery_id, proof_urls, content_urls, proof_notes } = await req.json();

    if (!delivery_id) {
      return Response.json({ error: 'Missing delivery_id' }, { status: 400 });
    }

    if (!proof_urls || proof_urls.length === 0) {
      return Response.json({ error: 'Pelo menos uma prova é obrigatória' }, { status: 400 });
    }

    // Fetch delivery
    const deliveries = await base44.entities.Delivery.filter({ id: delivery_id });
    if (deliveries.length === 0) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 });
    }
    const delivery = deliveries[0];

    // Verify creator ownership
    const creators = await base44.entities.Creator.filter({ user_id: user.id });
    if (creators.length === 0 || creators[0].id !== delivery.creator_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (delivery.status !== 'pending') {
      return Response.json({ error: 'Only pending deliveries can be submitted' }, { status: 400 });
    }

    const updateData = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      proof_urls: proof_urls,
      content_urls: (content_urls || []).filter(url => url && url.trim()),
      proof_notes: proof_notes || '',
      on_time: delivery.deadline ? new Date() <= new Date(delivery.deadline) : true,
    };

    await base44.entities.Delivery.update(delivery_id, updateData);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[submitDelivery] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});