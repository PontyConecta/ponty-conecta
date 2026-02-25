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
  User, Crown, LogOut, CreditCard, ExternalLink, Loader2, Sun, Moon, Zap
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
    { value: 'neon', label: 'Neon', icon: Zap },
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
      <h1 className="text-2xl lg:text-3xl font-bold">Configurações</h1>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || profile?.logo_url} />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">
                {profile?.display_name || profile?.company_name || user?.full_name || 'Usuário'}
              </h3>
              <p className="text-sm truncate text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1 capitalize border-primary/30 text-primary">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Plano {statusLabels[subscriptionStatus] || 'Gratuito'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed ? 'Acesso completo a todos os recursos' : 'Funcionalidades limitadas'}
              </p>
            </div>
            <Badge className={isSubscribed ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-muted text-muted-foreground border-0'}>
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
              className="w-full bg-[#9038fa] hover:bg-[#9038fa]/90"
              onClick={() => navigate(createPageUrl('Subscription'))}
            >
              <Crown className="w-4 h-4 mr-2" />
              Assinar Plano Premium
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="w-5 h-5 text-muted-foreground" />
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
                    isActive 
                      ? 'border-primary bg-primary/10 shadow-sm' 
                      : 'border-transparent bg-muted hover:bg-muted/80'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
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
          <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5">
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Você será desconectado e redirecionado para a página inicial.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sair
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}