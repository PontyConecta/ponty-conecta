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
  const adminPages = [
    { name: 'Dashboard', page: 'AdminDashboard', icon: LayoutDashboard },
    { name: 'Usuários', page: 'AdminUsers', icon: Users },
    { name: 'Campanhas', page: 'AdminCampaigns', icon: Megaphone },
    { name: 'Disputas', page: 'AdminDisputes', icon: AlertTriangle },
    { name: 'Audit Logs', page: 'AdminAuditLogs', icon: FileText },
  ];

  const isAdminPage = adminPages.some(p => p.page === currentPageName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isAdminPage ? "default" : "outline"}
          size="sm"
          className={`gap-2 ${isAdminPage ? 'bg-red-600 hover:bg-red-700' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Admin</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-slate-500">Administração</p>
        </div>
        <DropdownMenuSeparator />
        {adminPages.map((item) => (
          <DropdownMenuItem key={item.page} asChild>
            <Link 
              to={createPageUrl(item.page)} 
              className={`cursor-pointer ${currentPageName === item.page ? 'bg-red-50 text-red-700' : ''}`}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}