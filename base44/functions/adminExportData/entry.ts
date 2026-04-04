import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LIMIT = 1000;

function escapeCSV(val) {
  if (val == null) return 'N/A';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { exportType } = await req.json();

    if (!exportType || !['users', 'campaigns', 'applications', 'deliveries'].includes(exportType)) {
      return Response.json({ error: 'Invalid export type' }, { status: 400 });
    }

    let csvData = '';
    let filename = '';

    switch (exportType) {
      case 'users': {
        const [users, brands, creators] = await Promise.all([
          base44.asServiceRole.entities.User.list('-created_date', LIMIT),
          base44.asServiceRole.entities.Brand.list('-created_date', LIMIT),
          base44.asServiceRole.entities.Creator.list('-created_date', LIMIT)
        ]);

        csvData = 'User ID,Email,Full Name,Role,Created Date,Account State,Subscription Status\n';
        
        for (const user of users) {
          const brand = brands.find(b => b.user_id === user.id);
          const creator = creators.find(c => c.user_id === user.id);
          const role = brand ? 'brand' : creator ? 'creator' : 'unknown';
          const profile = brand || creator || {};
          
          csvData += `${escapeCSV(user.id)},${escapeCSV(user.email)},${escapeCSV(user.full_name)},${escapeCSV(role)},${escapeCSV(user.created_date)},${escapeCSV(profile.account_state)},${escapeCSV(profile.subscription_status)}\n`;
        }
        
        filename = 'users_export.csv';
        break;
      }

      case 'campaigns': {
        const [campaigns, allApps] = await Promise.all([
          base44.asServiceRole.entities.Campaign.list('-created_date', LIMIT),
          base44.asServiceRole.entities.Application.list('-created_date', 5000),
        ]);
        const appCountMap = {};
        allApps.forEach(a => { appCountMap[a.campaign_id] = (appCountMap[a.campaign_id] || 0) + 1; });
        
        csvData = 'Campaign ID,Title,Status,Brand ID,Created Date,Deadline,Remuneration Type,Budget Min,Budget Max,Slots Total,Slots Filled,Total Applications\n';
        
        for (const c of campaigns) {
          csvData += `${escapeCSV(c.id)},${escapeCSV(c.title)},${escapeCSV(c.status)},${escapeCSV(c.brand_id)},${escapeCSV(c.created_date)},${escapeCSV(c.deadline)},${escapeCSV(c.remuneration_type)},${escapeCSV(c.budget_min)},${escapeCSV(c.budget_max)},${escapeCSV(c.slots_total)},${escapeCSV(c.slots_filled)},${escapeCSV(appCountMap[c.id] || 0)}\n`;
        }
        
        filename = 'campaigns_export.csv';
        break;
      }

      case 'applications': {
        const applications = await base44.asServiceRole.entities.Application.list('-created_date', LIMIT);
        
        csvData = 'Application ID,Campaign ID,Creator ID,Brand ID,Status,Created Date,Invited,Proposed Rate,Agreed Rate\n';
        
        for (const a of applications) {
          csvData += `${escapeCSV(a.id)},${escapeCSV(a.campaign_id)},${escapeCSV(a.creator_id)},${escapeCSV(a.brand_id)},${escapeCSV(a.status)},${escapeCSV(a.created_date)},${escapeCSV(a.invited)},${escapeCSV(a.proposed_rate)},${escapeCSV(a.agreed_rate)}\n`;
        }
        
        filename = 'applications_export.csv';
        break;
      }

      case 'deliveries': {
        const deliveries = await base44.asServiceRole.entities.Delivery.list('-created_date', LIMIT);
        
        csvData = 'Delivery ID,Campaign ID,Creator ID,Brand ID,Status,Submitted At,Deadline,On Time,Payment Status\n';
        
        for (const d of deliveries) {
          csvData += `${escapeCSV(d.id)},${escapeCSV(d.campaign_id)},${escapeCSV(d.creator_id)},${escapeCSV(d.brand_id)},${escapeCSV(d.status)},${escapeCSV(d.submitted_at)},${escapeCSV(d.deadline)},${escapeCSV(d.on_time)},${escapeCSV(d.payment_status)}\n`;
        }
        
        filename = 'deliveries_export.csv';
        break;
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'data_export',
      details: `Exported ${exportType} data`,
      timestamp: new Date().toISOString()
    });

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});