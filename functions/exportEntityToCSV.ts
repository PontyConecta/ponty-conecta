import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Fetch all records from the entity
    const records = await base44.asServiceRole.entities[entityName].list();

    if (!records || records.length === 0) {
      return Response.json({ error: 'No records found' }, { status: 404 });
    }

    // Get entity schema to know field names
    const schema = await base44.asServiceRole.entities[entityName].schema();
    const fieldNames = Object.keys(schema.properties || {});

    // Build CSV header
    const headers = ['id', 'created_date', 'updated_date', 'created_by', ...fieldNames];
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