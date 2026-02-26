import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userId, action, data } = await req.json();

    if (!userId || !action) {
      return Response.json({ error: 'userId and action are required' }, { status: 400 });
    }

    // Find user profile (Brand or Creator)
    const [brands, creators] = await Promise.all([
      base44.asServiceRole.entities.Brand.filter({ user_id: userId }),
      base44.asServiceRole.entities.Creator.filter({ user_id: userId })
    ]);

    const profile = brands[0] || creators[0];
    const profileType = brands[0] ? 'brand' : creators[0] ? 'creator' : null;
    const entityName = profileType === 'brand' ? 'Brand' : 'Creator';

    let result = null;
    let auditAction = action;
    let auditDetails = '';

    switch (action) {
      case 'set_subscription_status': {
        // Set subscription status: starter, premium, pending, legacy, trial
        const newStatus = data?.subscription_status;
        if (!newStatus) {
          return Response.json({ error: 'subscription_status is required' }, { status: 400 });
        }

        const validStatuses = ['starter', 'premium', 'pending', 'legacy', 'trial'];
        if (!validStatuses.includes(newStatus)) {
          return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
        }

        if (!profile) {
          return Response.json({ error: 'User profile not found' }, { status: 404 });
        }

        const updateData = { subscription_status: newStatus };

        if (newStatus === 'premium' || newStatus === 'legacy') {
          updateData.plan_level = 'premium';
        } else if (newStatus === 'trial') {
          updateData.plan_level = 'trial';
          // Set trial end date if provided, otherwise 30 days
          const trialDays = data?.trial_days || 30;
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + trialDays);
          updateData.trial_end_date = trialEnd.toISOString();
        } else {
          updateData.plan_level = null;
          updateData.trial_end_date = null;
        }

        result = await base44.asServiceRole.entities[entityName].update(profile.id, updateData);
        auditAction = 'subscription_override';
        auditDetails = `Subscription changed to ${newStatus} for ${profileType} profile`;
        break;
      }

      case 'set_account_state': {
        const newState = data?.account_state;
        if (!newState || !['incomplete', 'ready'].includes(newState)) {
          return Response.json({ error: 'account_state must be "incomplete" or "ready"' }, { status: 400 });
        }

        if (!profile) {
          return Response.json({ error: 'User profile not found' }, { status: 404 });
        }

        const updateData = { account_state: newState };
        if (newState === 'ready') {
          updateData.onboarding_step = 4;
        }

        result = await base44.asServiceRole.entities[entityName].update(profile.id, updateData);
        auditAction = 'user_activated';
        auditDetails = `Account state changed to ${newState}`;
        break;
      }

      case 'toggle_verified': {
        if (!profile) {
          return Response.json({ error: 'User profile not found' }, { status: 404 });
        }

        const newVerified = !profile.is_verified;
        result = await base44.asServiceRole.entities[entityName].update(profile.id, {
          is_verified: newVerified
        });
        auditAction = newVerified ? 'user_activated' : 'user_deactivated';
        auditDetails = `Verification ${newVerified ? 'granted' : 'removed'} for ${profileType}`;
        break;
      }

      case 'set_user_role': {
        const newRole = data?.role;
        if (!newRole || !['user', 'admin'].includes(newRole)) {
          return Response.json({ error: 'role must be "user" or "admin"' }, { status: 400 });
        }

        console.log(`[adminManageUser] set_user_role: adminId=${admin.id} targetUserId=${userId} newRole=${newRole}`);

        // Find target user by ID
        const targetUsers = await base44.asServiceRole.entities.User.filter({ id: userId });
        const targetUser = targetUsers[0];
        
        if (!targetUser) {
          console.error(`[adminManageUser] User not found: ${userId}`);
          return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const oldRole = targetUser.role || 'user';
        console.log(`[adminManageUser] Changing role: ${targetUser.email} from "${oldRole}" to "${newRole}"`);
        
        await base44.asServiceRole.entities.User.update(userId, { role: newRole });
        
        console.log(`[adminManageUser] SUCCESS: Role updated for ${targetUser.email}`);
        auditAction = 'user_role_change';
        auditDetails = `User role changed from "${oldRole}" to "${newRole}" (${targetUser.email})`;
        result = { role: newRole, previousRole: oldRole };
        break;
      }

      case 'set_exclude_financials': {
        const excludeValue = data?.exclude_from_financials;
        // User entity has special security - use admin-level update
        const allUsersForExclude = await base44.asServiceRole.entities.User.filter({});
        const targetUserForExclude = allUsersForExclude.find(u => u.id === userId);
        if (!targetUserForExclude) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
        await base44.asServiceRole.entities.User.update(userId, { 
          exclude_from_financials: !!excludeValue 
        });
        auditAction = 'subscription_override';
        auditDetails = excludeValue 
          ? 'User excluded from financial calculations' 
          : 'User included back in financial calculations';
        result = { exclude_from_financials: !!excludeValue };
        break;
      }

      case 'set_tags': {
        const newTags = data?.tags || [];
        await base44.asServiceRole.entities.User.update(userId, { tags: newTags });
        auditAction = 'user_flagged';
        auditDetails = `User tags updated to: ${newTags.join(', ') || 'none'}`;
        result = { tags: newTags };
        break;
      }

      case 'bulk_set_exclude_financials': {
        const excludeVal = data?.exclude_from_financials;
        await base44.asServiceRole.entities.User.update(userId, { 
          exclude_from_financials: !!excludeVal 
        });
        auditAction = 'subscription_override';
        auditDetails = excludeVal 
          ? 'User excluded from financial calculations (bulk)' 
          : 'User included in financial calculations (bulk)';
        result = { exclude_from_financials: !!excludeVal };
        break;
      }

      case 'bulk_add_tag': {
        const tagToAdd = data?.tag;
        if (!tagToAdd) {
          return Response.json({ error: 'tag is required' }, { status: 400 });
        }
        const allUsersTag = await base44.asServiceRole.entities.User.filter({});
        const targetForTag = allUsersTag.find(u => u.id === userId);
        const currentTagsAdd = targetForTag?.tags || [];
        if (!currentTagsAdd.includes(tagToAdd)) {
          await base44.asServiceRole.entities.User.update(userId, { 
            tags: [...currentTagsAdd, tagToAdd] 
          });
        }
        auditAction = 'user_flagged';
        auditDetails = `Tag "${tagToAdd}" added (bulk)`;
        result = { tag: tagToAdd };
        break;
      }

      case 'bulk_remove_tag': {
        const tagToRemove = data?.tag;
        if (!tagToRemove) {
          return Response.json({ error: 'tag is required' }, { status: 400 });
        }
        const allUsersRemTag = await base44.asServiceRole.entities.User.filter({});
        const targetForRemTag = allUsersRemTag.find(u => u.id === userId);
        const currentTagsRem = targetForRemTag?.tags || [];
        await base44.asServiceRole.entities.User.update(userId, { 
          tags: currentTagsRem.filter(t => t !== tagToRemove) 
        });
        auditAction = 'user_flagged';
        auditDetails = `Tag "${tagToRemove}" removed (bulk)`;
        result = { tag: tagToRemove };
        break;
      }

      case 'flag_review': {
        auditAction = 'user_flagged';
        auditDetails = `User flagged for review`;
        break;
      }

      case 'unflag_review': {
        auditAction = 'user_flagged';
        auditDetails = `User unflagged from review`;
        break;
      }

      default:
        return Response.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    // Create audit log
    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: auditAction,
      target_user_id: userId,
      details: auditDetails || JSON.stringify({ action, data }),
      note: data?.auditNote || '',
      timestamp: new Date().toISOString()
    });

    console.log(`Admin action: ${action} by ${admin.email} on user ${userId}`);

    return Response.json({ 
      success: true, 
      action,
      result
    });

  } catch (error) {
    console.error('Admin manage user error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});