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
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  LayoutDashboard,
  Users,
  Megaphone,
  AlertTriangle,
  FileText,
  ChevronDown
} from 'lucide-react';

export default function AdminMenu({ currentPageName }) {
  const adminCategories = [
    {
      label: 'Visão Geral',
      items: [
        { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: 'Gestão de Usuários',
      items: [
        { name: 'Usuários', page: 'AdminUsers', icon: Users }
      ]
    },
    {
      label: 'Gestão de Campanhas',
      items: [
        { name: 'Campanhas', page: 'AdminCampaigns', icon: Megaphone }
      ]
    },
    {
      label: 'Moderação',
      items: [
        { name: 'Disputas', page: 'AdminDisputes', icon: AlertTriangle }
      ]
    },
    {
      label: 'Sistema',
      items: [
        { name: 'Logs de Auditoria', page: 'AdminAuditLogs', icon: FileText }
      ]
    }
  ];

  const allAdminPages = adminCategories.flatMap(cat => cat.items);
  const isAdminPage = allAdminPages.some(p => p.page === currentPageName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:h-9 lg:w-9 hover:bg-white/10 transition-all"
        >
          <Shield className="w-4 h-4 lg:w-5 lg:h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {adminCategories.map((category, idx) => (
          <React.Fragment key={`admin-cat-${idx}`}>
            {idx > 0 && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {category.label}
              </p>
            </div>
            {category.items.map((item) => (
              <DropdownMenuItem key={item.page} asChild>
                <Link 
                  to={createPageUrl(item.page)} 
                  className={`cursor-pointer ${currentPageName === item.page ? 'bg-red-50 text-red-700 font-medium' : ''}`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}