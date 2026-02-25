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
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
      {/* Title bar */}
      <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(144, 56, 250, 0.12)' }}>
          <span className="text-xs font-bold" style={{ color: '#9038fa' }}>A</span>
        </div>
        <span className="text-sm font-bold tracking-wide" style={{ color: '#9038fa' }}>
          Painel Administrativo
        </span>
      </div>

      {/* Navigation tabs */}
      <div className="px-3 sm:px-4 pb-1">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {adminNav.map(item => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
                }`}
                style={isActive 
                  ? { backgroundColor: 'rgba(144, 56, 250, 0.1)', color: '#9038fa' } 
                  : { color: 'var(--text-secondary)' }
                }
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}