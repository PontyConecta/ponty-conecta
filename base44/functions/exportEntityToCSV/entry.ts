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

    const ALLOWED_EXPORT_ENTITIES = ['Brand', 'Creator', 'Campaign', 'Application', 'Delivery', 'Subscription'];
    if (!ALLOWED_EXPORT_ENTITIES.includes(entityName)) {
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

    // Get entity schema to know field names
    const schema = await base44.asServiceRole.entities[entityName].schema();
    const fieldNames = Object.keys(schema.properties || {});

    // Build CSV header — filter out sensitive fields
    const allHeaders = ['id', 'created_date', 'updated_date', 'created_by', ...fieldNames];
    const headers = allHeaders.filter(h => !/(password|token|secret|hash|key)/i.test(h));
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