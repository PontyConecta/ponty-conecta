import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Users, Megaphone, AlertTriangle, FileText 
} from 'lucide-react';

const adminNav = [
  { name: 'Dashboards', page: 'AdminDashboard', icon: LayoutDashboard },

  { name: 'Usuários', page: 'AdminUsers', icon: Users },
  { name: 'Campanhas', page: 'AdminCampaigns', icon: Megaphone },
  { name: 'Disputas', page: 'AdminDisputes', icon: AlertTriangle },
  { name: 'Logs', page: 'AdminAuditLogs', icon: FileText },
];

export default function AdminHeader({ currentPageName }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b pb-2 mb-1" style={{ borderColor: 'var(--border-color)' }}>
      {adminNav.map(item => {
        const isActive = currentPageName === item.page;
        return (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              isActive ? '' : 'opacity-50 hover:opacity-80'
            }`}
            style={isActive 
              ? { backgroundColor: 'rgba(144, 56, 250, 0.08)', color: '#9038fa' } 
              : { color: 'var(--text-secondary)' }
            }
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}