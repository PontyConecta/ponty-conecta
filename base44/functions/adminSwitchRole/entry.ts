// ⚠️ DEPRECATED: This function is disabled.
// Use "adminChangeUserRole" instead, which uses valid enum values
// and preserves subscription data during role switches.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  return Response.json({
    error: 'This function is deprecated. Use "adminChangeUserRole" instead.',
    replacement: 'adminChangeUserRole',
    reason: 'adminSwitchRole used invalid enum values (account_state: "exploring", subscription_status: "none")'
  }, { status: 410 }); // 410 Gone
});