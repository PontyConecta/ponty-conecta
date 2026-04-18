import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can export
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { entityName } = body;

    if (!entityName) {
      return Response.json({ error: 'Entity name is required' }, { status: 400 });
    }

    // Whitelist of allowed entities and their exportable fields
    const ALLOWED_EXPORT_FIELDS = {
      Brand: ['id', 'created_date', 'updated_date', 'user_id', 'company_name', 'industry', 'company_size', 'marketing_budget', 'description', 'state', 'city', 'is_verified', 'is_hidden', 'subscription_status', 'plan_level', 'total_campaigns', 'active_campaigns', 'target_audience', 'account_state', 'onboarding_step', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
      Creator: ['id', 'created_date', 'updated_date', 'user_id', 'display_name', 'bio', 'niche', 'platforms', 'profile_size', 'creator_type', 'content_types', 'state', 'city', 'location', 'rate_cash_min', 'rate_cash_max', 'accepts_barter', 'is_verified', 'is_hidden', 'subscription_status', 'plan_level', 'completed_campaigns', 'on_time_rate', 'featured', 'account_state', 'onboarding_step', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'],
      Campaign: ['id', 'created_date', 'updated_date', 'brand_id', 'title', 'description', 'requirements', 'platforms', 'content_type', 'niche_required', 'location', 'deadline', 'application_deadline', 'remuneration_type', 'budget_min', 'budget_max', 'barter_description', 'barter_value', 'slots_total', 'slots_filled', 'profile_size_min', 'status', 'total_applications', 'featured'],
      Application: ['id', 'created_date', 'updated_date', 'campaign_id', 'creator_id', 'brand_id', 'status', 'message', 'proposed_rate', 'invited', 'accepted_at', 'rejected_at', 'rejection_reason', 'agreed_rate'],
      Delivery: ['id', 'created_date', 'updated_date', 'application_id', 'campaign_id', 'creator_id', 'brand_id', 'status', 'submitted_at', 'deadline', 'reviewed_at', 'approved_at', 'on_time', 'payment_status'],
      Subscription: ['id', 'created_date', 'updated_date', 'user_id', 'plan_type', 'status', 'start_date', 'end_date', 'amount', 'currency', 'auto_renew', 'next_billing_date', 'last_billing_date', 'plan_name'],
    };

    if (!ALLOWED_EXPORT_FIELDS[entityName]) {
      return Response.json({ error: 'Entidade não permitida para exportação', code: 'FORBIDDEN_ENTITY' }, { status: 403 });
    }

    // Fetch records with limit
    const records = await base44.asServiceRole.entities[entityName].list('-created_date', 10000);

    if (!records || records.length === 0) {
      return Response.json({ error: 'No records found' }, { status: 404 });
    }

    if (records.length === 10000) {
      return Response.json({ error: 'Dataset muito grande — use filtros para exportar' }, { status: 400 });
    }

    // Use whitelist of allowed fields for this entity
    const headers = ALLOWED_EXPORT_FIELDS[entityName];
    const csvHeader = headers.map(h => `"${h}"`).join(',');

    // Build CSV rows
    const csvRows = records.map(record => {
      return headers.map(field => {
        const value = record[field];
        // Handle null/undefined
        if (value === null || value === undefined) return '""';
        // Handle arrays and objects
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        // Escape quotes in strings
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return `"${value}"`;
      }).join(',');
    });

    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Audit log
    console.log(JSON.stringify({ event: 'admin_export_csv', admin_id: user.id, entity: entityName, record_count: records.length, timestamp: new Date().toISOString() }));

    // Return CSV file
    const filename = `${entityName}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});