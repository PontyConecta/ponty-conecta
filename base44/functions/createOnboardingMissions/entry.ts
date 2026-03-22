import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile_type, profile_id } = await req.json();

  if (!profile_type || !['brand', 'creator'].includes(profile_type)) {
    return Response.json({ error: 'Invalid profile_type' }, { status: 400 });
  }

  // Check if missions already exist for this user
  const existingMissions = await base44.entities.Mission.filter({ 
    user_id: user.id, 
    profile_type, 
    type: 'onboarding' 
  });

  if (existingMissions.length > 0) {
    return Response.json({ success: true, missions: existingMissions, already_existed: true });
  }

  const brandMissions = [
    {
      title: 'Complete seu perfil',
      description: 'Preencha todas as informações da sua marca',
      target_action: 'complete_profile',
      target_action_url: 'Profile',
      target_value: 1,
      current_progress: 1,
      status: 'completed',
      completed_at: new Date().toISOString(),
      reward_points: 10,
      icon: 'UserCheck',
      order: 1
    },
    {
      title: 'Crie sua primeira campanha',
      description: 'Lance uma campanha para encontrar criadores',
      target_action: 'create_campaign',
      target_action_url: 'CampaignManager',
      target_value: 1,
      current_progress: 0,
      reward_points: 20,
      icon: 'Megaphone',
      order: 2
    },
    {
      title: 'Aceite um criador',
      description: 'Revise candidaturas e aceite um criador',
      target_action: 'accept_application',
      target_action_url: 'ApplicationsManager',
      target_value: 1,
      current_progress: 0,
      reward_points: 15,
      icon: 'UserPlus',
      order: 3
    },
    {
      title: 'Aprove uma entrega',
      description: 'Avalie e aprove a entrega de um criador',
      target_action: 'approve_delivery',
      target_action_url: 'DeliveriesManager',
      target_value: 1,
      current_progress: 0,
      reward_points: 25,
      icon: 'CheckCircle',
      order: 4
    }
  ];

  const creatorMissions = [
    {
      title: 'Complete seu perfil',
      description: 'Preencha todas as informações do seu perfil',
      target_action: 'complete_profile',
      target_action_url: 'Profile',
      target_value: 1,
      current_progress: 1,
      status: 'completed',
      completed_at: new Date().toISOString(),
      reward_points: 10,
      icon: 'UserCheck',
      order: 1
    },
    {
      title: 'Candidate-se a uma campanha',
      description: 'Encontre uma oportunidade e envie sua candidatura',
      target_action: 'apply_campaign',
      target_action_url: 'OpportunityFeed',
      target_value: 1,
      current_progress: 0,
      reward_points: 15,
      icon: 'Send',
      order: 2
    },
    {
      title: 'Seja aceito em uma campanha',
      description: 'Tenha sua candidatura aprovada por uma marca',
      target_action: 'get_accepted',
      target_action_url: 'MyApplications',
      target_value: 1,
      current_progress: 0,
      reward_points: 20,
      icon: 'Trophy',
      order: 3
    },
    {
      title: 'Envie sua primeira entrega',
      description: 'Complete e envie a entrega de uma campanha',
      target_action: 'submit_delivery',
      target_action_url: 'MyDeliveries',
      target_value: 1,
      current_progress: 0,
      reward_points: 25,
      icon: 'Package',
      order: 4
    }
  ];

  const missions = profile_type === 'brand' ? brandMissions : creatorMissions;

  const created = [];
  for (const mission of missions) {
    const m = await base44.entities.Mission.create({
      user_id: user.id,
      profile_type,
      type: 'onboarding',
      ...mission,
      status: mission.status || 'active'
    });
    created.push(m);
  }

  return Response.json({ success: true, missions: created });
});