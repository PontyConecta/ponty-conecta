import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Verify admin access
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
          base44.asServiceRole.entities.User.list(),
          base44.asServiceRole.entities.Brand.list(),
          base44.asServiceRole.entities.Creator.list()
        ]);

        csvData = 'User ID,Email,Full Name,Role,Created Date,Account State,Subscription Status\n';
        
        for (const user of users) {
          const brand = brands.find(b => b.user_id === user.id);
          const creator = creators.find(c => c.user_id === user.id);
          const role = brand ? 'brand' : creator ? 'creator' : 'unknown';
          const profile = brand || creator || {};
          
          csvData += `"${user.id}","${user.email}","${user.full_name}","${role}","${user.created_date}","${profile.account_state || 'N/A'}","${profile.subscription_status || 'N/A'}"\n`;
        }
        
        filename = 'users_export.csv';
        break;
      }

      case 'campaigns': {
        const campaigns = await base44.asServiceRole.entities.Campaign.list();
        
        csvData = 'Campaign ID,Title,Status,Brand ID,Created Date,Deadline,Remuneration Type,Budget Min,Budget Max,Slots Total,Slots Filled,Total Applications\n';
        
        for (const c of campaigns) {
          csvData += `"${c.id}","${c.title}","${c.status}","${c.brand_id}","${c.created_date}","${c.deadline}","${c.remuneration_type}","${c.budget_min || 'N/A'}","${c.budget_max || 'N/A'}","${c.slots_total}","${c.slots_filled}","${c.total_applications}"\n`;
        }
        
        filename = 'campaigns_export.csv';
        break;
      }

      case 'applications': {
        const applications = await base44.asServiceRole.entities.Application.list();
        
        csvData = 'Application ID,Campaign ID,Creator ID,Brand ID,Status,Created Date,Invited,Proposed Rate,Agreed Rate\n';
        
        for (const a of applications) {
          csvData += `"${a.id}","${a.campaign_id}","${a.creator_id}","${a.brand_id}","${a.status}","${a.created_date}","${a.invited}","${a.proposed_rate || 'N/A'}","${a.agreed_rate || 'N/A'}"\n`;
        }
        
        filename = 'applications_export.csv';
        break;
      }

      case 'deliveries': {
        const deliveries = await base44.asServiceRole.entities.Delivery.list();
        
        csvData = 'Delivery ID,Campaign ID,Creator ID,Brand ID,Status,Submitted At,Deadline,On Time,Payment Status\n';
        
        for (const d of deliveries) {
          csvData += `"${d.id}","${d.campaign_id}","${d.creator_id}","${d.brand_id}","${d.status}","${d.submitted_at || 'N/A'}","${d.deadline}","${d.on_time}","${d.payment_status}"\n`;
        }
        
        filename = 'deliveries_export.csv';
        break;
      }
    }

    // Create audit log
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