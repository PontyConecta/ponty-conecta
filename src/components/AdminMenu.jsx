import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  AlertTriangle,
  FileText
} from 'lucide-react';

const adminItems = [
  { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard, group: 'Visão Geral' },
  { name: 'Usuários', page: 'AdminUsers', icon: Users, group: 'Gestão' },
  { name: 'Campanhas', page: 'AdminCampaigns', icon: Megaphone, group: 'Gestão' },
  { name: 'Disputas', page: 'AdminDisputes', icon: AlertTriangle, group: 'Moderação' },
  { name: 'Logs', page: 'AdminAuditLogs', icon: FileText, group: 'Sistema' },
];

export default function AdminMenu({ currentPageName }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-purple-500/10"
        >
          <Shield className="w-5 h-5 text-[#9038fa]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5" sideOffset={8}>
        <div className="px-2.5 py-2 mb-1">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9038fa' }}>
            Admin
          </p>
        </div>
        {adminItems.map((item, idx) => {
          const isActive = currentPageName === item.page;
          return (
            <DropdownMenuItem key={item.page} asChild className="p-0">
              <Link 
                to={createPageUrl(item.page)} 
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-all w-full"
                style={{
                  backgroundColor: isActive ? 'rgba(144, 56, 250, 0.12)' : 'transparent',
                  color: isActive ? '#9038fa' : undefined,
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(144, 56, 250, 0.06)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#9038fa]' : 'text-muted-foreground'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}