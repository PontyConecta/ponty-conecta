import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  User, Crown, LogOut, CreditCard, Bell, Shield, ChevronRight,
  Building2, ExternalLink, Loader2, Sun, Moon, Zap
} from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeContext';

export default function Settings() {
  const { user, profile, profileType, logout } = useAuth();
  const { isSubscribed, subscriptionStatus } = useSubscription();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [managingSubscription, setManagingSubscription] = useState(false);

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    const response = await base44.functions.invoke('createCustomerPortalSession', {
      profile_type: profileType
    });
    if (response.data?.url) {
      window.location.href = response.data.url;
    }
    setManagingSubscription(false);
  };

  const handleLogout = () => {
    logout('/');
  };

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'musk', label: 'Neon', icon: Zap },
  ];

  const statusLabels = {
    starter: 'Gratuito',
    premium: 'Premium',
    pending: 'Pendente',
    legacy: 'Legado',
    trial: 'Teste Grátis'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Configurações
      </h1>

      {/* Profile Card */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
              <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: 'rgba(144, 56, 250, 0.1)', color: '#9038fa' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.display_name || profile?.company_name || user?.full_name || 'Usuário'}
              </h3>
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              <Badge variant="outline" className="mt-1 capitalize" style={{ borderColor: 'rgba(144, 56, 250, 0.3)', color: '#9038fa' }}>
                {profileType === 'brand' ? 'Marca' : 'Creator'}
              </Badge>
            </div>
            <Button variant="outline" onClick={() => navigate(createPageUrl('Profile'))}>
              <User className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Crown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Plano {statusLabels[subscriptionStatus] || 'Gratuito'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isSubscribed ? 'Acesso completo a todos os recursos' : 'Funcionalidades limitadas'}
              </p>
            </div>
            <Badge className={isSubscribed ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-100 text-slate-700 border-0'}>
              {isSubscribed ? 'Ativa' : 'Gratuito'}
            </Badge>
          </div>
          
          {isSubscribed ? (
            <Button variant="outline" className="w-full" onClick={handleManageSubscription} disabled={managingSubscription}>
              {managingSubscription ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Gerenciar Assinatura
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          ) : (
            <Button 
              className="w-full bg-gradient-to-r from-[#9038fa] to-[#b77aff] hover:from-[#7a2de0] hover:to-[#a055ff]"
              onClick={() => navigate(createPageUrl('Subscription'))}
            >
              <Crown className="w-4 h-4 mr-2" />
              Assinar Plano Premium
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sun className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(t => {
              const Icon = t.icon;
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => changeTheme(t.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isActive ? 'border-[#9038fa] shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: isActive ? 'rgba(144, 56, 250, 0.1)' : 'var(--bg-primary)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: isActive ? '#9038fa' : 'var(--text-secondary)' }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? '#9038fa' : 'var(--text-secondary)' }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
          <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
            Você será desconectado e redirecionado para a página inicial.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel style={{ color: 'var(--text-primary)' }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
              Sair
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}