import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Building2,
  Upload,
  Save,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  Bell,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [brands, creators, subscriptions] = await Promise.all([
        base44.entities.Brand.filter({ user_id: userData.id }),
        base44.entities.Creator.filter({ user_id: userData.id }),
        base44.entities.Subscription.filter({ user_id: userData.id, status: 'active' })
      ]);

      if (brands.length > 0) {
        setProfile(brands[0]);
        setProfileType('brand');
        setFormData({
          company_name: brands[0].company_name || '',
          industry: brands[0].industry || '',
          description: brands[0].description || '',
          website: brands[0].website || '',
          contact_email: brands[0].contact_email || '',
          contact_phone: brands[0].contact_phone || '',
          logo_url: brands[0].logo_url || ''
        });
      } else if (creators.length > 0) {
        setProfile(creators[0]);
        setProfileType('creator');
        setFormData({
          display_name: creators[0].display_name || '',
          bio: creators[0].bio || '',
          avatar_url: creators[0].avatar_url || '',
          location: creators[0].location || '',
          portfolio_url: creators[0].portfolio_url || '',
          rate_cash_min: creators[0].rate_cash_min || '',
          rate_cash_max: creators[0].rate_cash_max || '',
          niche: creators[0].niche || [],
          platforms: creators[0].platforms || []
        });
      }

      if (subscriptions.length > 0) {
        setSubscription(subscriptions[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange(field, file_url);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profileType === 'brand') {
        await base44.entities.Brand.update(profile.id, formData);
      } else {
        await base44.entities.Creator.update(profile.id, {
          ...formData,
          rate_cash_min: formData.rate_cash_min ? parseFloat(formData.rate_cash_min) : null,
          rate_cash_max: formData.rate_cash_max ? parseFloat(formData.rate_cash_max) : null
        });
      }
      await loadData();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-600 mt-1">Gerencie seu perfil e preferências</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {isBrand ? 'Marca' : 'Criador'}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isBrand ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                Informações do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar/Logo */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {isBrand ? (
                    formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-24 h-24 rounded-xl object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-slate-400" />
                      </div>
                    )
                  ) : (
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
                        {formData.display_name?.[0] || 'C'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, isBrand ? 'logo_url' : 'avatar_url')}
                    />
                    <Upload className="w-4 h-4 text-white" />
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {isBrand ? formData.company_name : formData.display_name}
                  </h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  {profile?.verified && (
                    <Badge className="mt-2 bg-blue-100 text-blue-700 border-0">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              {isBrand ? (
                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Empresa</Label>
                      <Input
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Segmento</Label>
                      <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fashion">Moda</SelectItem>
                          <SelectItem value="beauty">Beleza</SelectItem>
                          <SelectItem value="tech">Tecnologia</SelectItem>
                          <SelectItem value="food_beverage">Alimentos</SelectItem>
                          <SelectItem value="health_wellness">Saúde</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="mt-2 min-h-[100px]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Website</Label>
                      <div className="relative mt-2">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email de Contato</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.contact_email}
                          onChange={(e) => handleChange('contact_email', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Telefone</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.contact_phone}
                        onChange={(e) => handleChange('contact_phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Artístico</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => handleChange('display_name', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Localização</Label>
                      <div className="relative mt-2">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.location}
                          onChange={(e) => handleChange('location', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className="mt-2 min-h-[100px]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Mínimo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.rate_cash_min}
                        onChange={(e) => handleChange('rate_cash_min', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Valor Máximo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.rate_cash_max}
                        onChange={(e) => handleChange('rate_cash_max', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Portfolio / Media Kit</Label>
                    <div className="relative mt-2">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.portfolio_url}
                        onChange={(e) => handleChange('portfolio_url', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-2">Ativa</Badge>
                        <h4 className="font-semibold text-slate-900 capitalize">
                          Plano {subscription.plan_type?.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-slate-600">
                          Válido até {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          R$ {subscription.amount}
                        </p>
                        <p className="text-sm text-slate-500">
                          /{subscription.plan_type?.includes('annual') ? 'ano' : 'mês'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Gerenciar Assinatura
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="font-semibold text-slate-900 mb-2">Nenhuma assinatura ativa</h4>
                  <p className="text-slate-500 mb-4">Assine para acessar todas as funcionalidades</p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Ver Planos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Email</h4>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                  </div>
                  <Badge variant="outline">Verificado</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}