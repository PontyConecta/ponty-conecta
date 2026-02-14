import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fields that regular users cannot modify directly
const PROTECTED_FIELDS = [
  'is_verified',
  'subscription_status',
  'plan_level',
  'stripe_customer_id',
  'total_campaigns',
  'active_campaigns',
  'completed_campaigns',
  'on_time_rate',
  'featured',
  'user_id',
  'account_state'
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile_type, updates } = await req.json();

  if (!profile_type || !['brand', 'creator'].includes(profile_type)) {
    return Response.json({ error: 'Invalid profile_type' }, { status: 400 });
  }

  if (!updates || typeof updates !== 'object') {
    return Response.json({ error: 'Invalid updates' }, { status: 400 });
  }

  // Find the user's profile
  const EntityType = profile_type === 'brand' ? 'Brand' : 'Creator';
  const profiles = await base44.entities[EntityType].filter({ user_id: user.id });

  if (profiles.length === 0) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  const profile = profiles[0];

  // Strip protected fields from updates
  const sanitizedUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (!PROTECTED_FIELDS.includes(key)) {
      sanitizedUpdates[key] = value;
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // Validate required fields based on profile type
  if (profile_type === 'brand' && sanitizedUpdates.company_name !== undefined) {
    if (!sanitizedUpdates.company_name || sanitizedUpdates.company_name.trim().length === 0) {
      return Response.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }
  }

  if (profile_type === 'creator' && sanitizedUpdates.display_name !== undefined) {
    if (!sanitizedUpdates.display_name || sanitizedUpdates.display_name.trim().length === 0) {
      return Response.json({ error: 'Nome artístico é obrigatório' }, { status: 400 });
    }
  }

  // Update profile
  const updatedProfile = await base44.entities[EntityType].update(profile.id, sanitizedUpdates);

  return Response.json({ 
    success: true, 
    profile: updatedProfile 
  });
});