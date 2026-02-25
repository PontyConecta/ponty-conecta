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
    <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide rounded-lg p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {adminNav.map(item => {
        const isActive = currentPageName === item.page;
        return (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              isActive ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={isActive 
              ? { backgroundColor: 'var(--bg-primary)', color: '#9038fa' } 
              : { color: 'var(--text-secondary)', opacity: 0.6 }
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