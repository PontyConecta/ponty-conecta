import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSubscription } from '@/components/contexts/SubscriptionContext';
import { toast } from '@/components/utils/toast';
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
import { Checkbox } from "@/components/ui/checkbox";
import ThemeSelector from "@/components/ThemeSelector";
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
  LogOut,
  Plus,
  X,
  Instagram,
  Linkedin,
  Link as LinkIcon,
  Camera,
  CheckCircle2
} from 'lucide-react';

export default function Profile() {
  const { user, profile, profileType, refreshProfile, logout } = useAuth();
  const { isSubscribed } = useSubscription();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  // Creator-specific states
  const [newPlatform, setNewPlatform] = useState({ name: '', handle: '', followers: '' });
  const [newPortfolioImage, setNewPortfolioImage] = useState('');

  const niches = ['Moda', 'Beleza', 'Tecnologia', 'Games', 'Lifestyle', 'Fitness', 'Saúde', 'Viagens', 'Gastronomia', 'Pets', 'Família', 'Educação', 'Finanças', 'Humor', 'Música', 'Arte'];
  const contentTypes = ['Fotos', 'Reels', 'Stories', 'Vídeos Longos', 'Lives', 'Podcasts', 'Blogs', 'Unboxing', 'Reviews'];
  const platformOptions = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Threads', 'Pinterest', 'Twitch'];

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile || !user) return;

    try {
      const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id, status: 'active' });
      if (subscriptions.length > 0) {
        setSubscription(subscriptions[0]);
      }

      // Initialize form data from profile
      if (profileType === 'brand') {
        setFormData({
          company_name: profile.company_name || '',
          industry: profile.industry || '',
          description: profile.description || '',
          website: profile.website || '',
          contact_email: profile.contact_email || user.email,
          contact_phone: profile.contact_phone || '',
          logo_url: profile.logo_url || '',
          cover_image_url: profile.cover_image_url || '',
          social_instagram: profile.social_instagram || '',
          social_linkedin: profile.social_linkedin || '',
          target_audience: profile.target_audience || '',
          content_guidelines: profile.content_guidelines || ''
        });
      } else if (profileType === 'creator') {
        setFormData({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          cover_image_url: profile.cover_image_url || '',
          location: profile.location || '',
          portfolio_url: profile.portfolio_url || '',
          portfolio_images: profile.portfolio_images || [],
          rate_cash_min: profile.rate_cash_min || '',
          rate_cash_max: profile.rate_cash_max || '',
          accepts_barter: profile.accepts_barter !== false,
          niche: profile.niche || [],
          content_types: profile.content_types || [],
          platforms: profile.platforms || [],
          profile_size: profile.profile_size || '',
          contact_email: profile.contact_email || user.email,
          contact_whatsapp: profile.contact_whatsapp || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados do perfil');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(item)
        ? prev[field].filter(i => i !== item)
        : [...(prev[field] || []), item]
    }));
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

  const handlePortfolioImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        portfolio_images: [...(prev.portfolio_images || []), file_url]
      }));
    } catch (error) {
      console.error('Error uploading portfolio image:', error);
    }
  };

  const removePortfolioImage = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: prev.portfolio_images.filter((_, i) => i !== index)
    }));
  };

  const addPlatform = () => {
    if (newPlatform.name && newPlatform.handle) {
      setFormData(prev => ({
        ...prev,
        platforms: [...(prev.platforms || []), { 
          ...newPlatform, 
          followers: parseInt(newPlatform.followers) || 0 
        }]
      }));
      setNewPlatform({ name: '', handle: '', followers: '' });
    }
  };

  const removePlatform = (index) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = profileType === 'creator' ? {
        ...formData,
        rate_cash_min: formData.rate_cash_min ? parseFloat(formData.rate_cash_min) : null,
        rate_cash_max: formData.rate_cash_max ? parseFloat(formData.rate_cash_max) : null
      } : formData;

      const EntityModel = profileType === 'brand' ? base44.entities.Brand : base44.entities.Creator;
      await EntityModel.update(profile.id, updates);
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout('/');
  };

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Editar Perfil</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Atualize suas informações</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <Badge variant="outline" className="capitalize">
            {isBrand ? 'Marca' : 'Criador'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full lg:w-auto flex overflow-x-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <TabsTrigger value="profile" className="flex-1 lg:flex-none">Perfil</TabsTrigger>
          {!isBrand && <TabsTrigger value="portfolio" className="flex-1 lg:flex-none">Portfólio</TabsTrigger>}
          <TabsTrigger value="contact" className="flex-1 lg:flex-none">Contato</TabsTrigger>
          <TabsTrigger value="account" className="flex-1 lg:flex-none">Conta</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {isBrand ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover & Avatar/Logo */}
              <div className="relative">
                {/* Cover Image */}
                <div className="h-32 lg:h-40 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 relative overflow-hidden">
                  {formData.cover_image_url && (
                    <img src={formData.cover_image_url} alt="" className="w-full h-full object-cover" />
                  )}
                  <label className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-lg cursor-pointer hover:bg-black/70 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'cover_image_url')} />
                    <Camera className="w-5 h-5 text-white" />
                  </label>
                </div>

                {/* Avatar/Logo */}
                <div className="absolute -bottom-10 left-4 lg:left-6">
                  <div className="relative">
                    {isBrand ? (
                      formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover border-4 border-white shadow-lg bg-white" />
                      ) : (
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
                          <Building2 className="w-10 h-10 text-indigo-600" />
                        </div>
                      )
                    ) : (
                      <Avatar className="w-20 h-20 lg:w-24 lg:h-24 border-4 border-white shadow-lg">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-2xl">
                          {formData.display_name?.[0] || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, isBrand ? 'logo_url' : 'avatar_url')} />
                      <Upload className="w-4 h-4 text-white" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Fields with padding for avatar */}
              <div className="pt-12 space-y-6">
                {isBrand ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome da Empresa *</Label>
                        <Input
                          value={formData.company_name}
                          onChange={(e) => handleChange('company_name', e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Segmento</Label>
                        <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                          <SelectTrigger className="mt-2 h-12">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fashion">Moda</SelectItem>
                            <SelectItem value="beauty">Beleza</SelectItem>
                            <SelectItem value="tech">Tecnologia</SelectItem>
                            <SelectItem value="food_beverage">Alimentos</SelectItem>
                            <SelectItem value="health_wellness">Saúde</SelectItem>
                            <SelectItem value="travel">Viagens</SelectItem>
                            <SelectItem value="entertainment">Entretenimento</SelectItem>
                            <SelectItem value="sports">Esportes</SelectItem>
                            <SelectItem value="finance">Finanças</SelectItem>
                            <SelectItem value="education">Educação</SelectItem>
                            <SelectItem value="retail">Varejo</SelectItem>
                            <SelectItem value="automotive">Automotivo</SelectItem>
                            <SelectItem value="other">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Descrição da Marca</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="mt-2 min-h-[120px]"
                        placeholder="Conte sobre sua marca, valores e o que vocês fazem..."
                      />
                    </div>

                    <div>
                      <Label>Público-Alvo</Label>
                      <Textarea
                        value={formData.target_audience}
                        onChange={(e) => handleChange('target_audience', e.target.value)}
                        className="mt-2"
                        placeholder="Descreva seu público-alvo ideal..."
                      />
                    </div>

                    <div>
                      <Label>Diretrizes de Conteúdo</Label>
                      <Textarea
                        value={formData.content_guidelines}
                        onChange={(e) => handleChange('content_guidelines', e.target.value)}
                        className="mt-2"
                        placeholder="Diretrizes gerais para criadores que trabalham com sua marca..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome Artístico *</Label>
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
                            placeholder="São Paulo, SP"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="mt-2 min-h-[120px]"
                        placeholder="Conte sobre você, seu estilo de conteúdo..."
                      />
                    </div>

                    <div>
                      <Label>Nichos</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {niches.map((niche) => (
                          <Badge
                            key={niche}
                            variant={formData.niche?.includes(niche) ? "default" : "outline"}
                            className={`cursor-pointer ${formData.niche?.includes(niche) ? 'bg-orange-500' : ''}`}
                            onClick={() => toggleArrayItem('niche', niche)}
                          >
                            {niche}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Tipos de Conteúdo</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contentTypes.map((type) => (
                          <Badge
                            key={type}
                            variant={formData.content_types?.includes(type) ? "default" : "outline"}
                            className={`cursor-pointer ${formData.content_types?.includes(type) ? 'bg-violet-600' : ''}`}
                            onClick={() => toggleArrayItem('content_types', type)}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Tamanho do Perfil</Label>
                      <Select value={formData.profile_size} onValueChange={(v) => handleChange('profile_size', v)}>
                        <SelectTrigger className="mt-2 h-12">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nano">Nano (1K-10K)</SelectItem>
                          <SelectItem value="micro">Micro (10K-50K)</SelectItem>
                          <SelectItem value="mid">Mid (50K-500K)</SelectItem>
                          <SelectItem value="macro">Macro (500K-1M)</SelectItem>
                          <SelectItem value="mega">Mega (1M+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Platforms */}
                    <div>
                      <Label>Plataformas</Label>
                      <div className="space-y-2 mt-2">
                        {formData.platforms?.map((platform, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                            <div className="flex-1">
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{platform.name}</span>
                              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>@{platform.handle}</span>
                            </div>
                            <Badge variant="outline">{platform.followers?.toLocaleString() || 0}</Badge>
                            <Button variant="ghost" size="icon" onClick={() => removePlatform(index)} className="h-8 w-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={newPlatform.name} onValueChange={(v) => setNewPlatform(p => ({ ...p, name: v }))}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Plataforma" /></SelectTrigger>
                            <SelectContent>
                              {platformOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            value={newPlatform.handle}
                            onChange={(e) => setNewPlatform(p => ({ ...p, handle: e.target.value }))}
                            placeholder="@usuario"
                          />
                          <Input
                            type="number"
                            value={newPlatform.followers}
                            onChange={(e) => setNewPlatform(p => ({ ...p, followers: e.target.value }))}
                            placeholder="Seguidores"
                          />
                        </div>
                        <Button variant="outline" onClick={addPlatform} disabled={!newPlatform.name || !newPlatform.handle} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Plataforma
                        </Button>
                      </div>
                    </div>

                    {/* Rates */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Valor Mínimo (R$)</Label>
                        <Input
                          type="number"
                          value={formData.rate_cash_min}
                          onChange={(e) => handleChange('rate_cash_min', e.target.value)}
                          className="mt-2"
                          placeholder="500"
                        />
                      </div>
                      <div>
                        <Label>Valor Máximo (R$)</Label>
                        <Input
                          type="number"
                          value={formData.rate_cash_max}
                          onChange={(e) => handleChange('rate_cash_max', e.target.value)}
                          className="mt-2"
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                       <Checkbox
                         id="accepts_barter"
                         checked={formData.accepts_barter}
                         onCheckedChange={(checked) => handleChange('accepts_barter', checked)}
                       />
                       <Label htmlFor="accepts_barter" className="cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                         Aceito permutas (produtos/serviços)
                       </Label>
                     </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab (Creator Only) */}
        {!isBrand && (
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfólio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Link do Media Kit / Portfólio</Label>
                  <div className="relative mt-2">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.portfolio_url}
                      onChange={(e) => handleChange('portfolio_url', e.target.value)}
                      className="pl-10"
                      placeholder="https://seumediakit.com"
                    />
                  </div>
                </div>

                <div>
                  <Label>Imagens do Portfólio</Label>
                  <p className="text-sm text-slate-500 mt-1 mb-3">Adicione exemplos do seu trabalho</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {formData.portfolio_images?.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePortfolioImage(index)}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioImageUpload} />
                      <Plus className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-500">Adicionar</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isBrand ? (
                <>
                  <div>
                    <Label>Website</Label>
                    <div className="relative mt-2">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="pl-10"
                        placeholder="https://suamarca.com.br"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
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
                    <div>
                      <Label>Telefone</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.contact_phone}
                          onChange={(e) => handleChange('contact_phone', e.target.value)}
                          className="pl-10"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Instagram Username</Label>
                      <div className="relative mt-2">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.social_instagram}
                          onChange={(e) => handleChange('social_instagram', e.target.value)}
                          className="pl-10"
                          placeholder="@suamarca"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Digite seu @username para ajudar marcas a verificar seu perfil</p>
                    </div>
                    <div>
                      <Label>LinkedIn</Label>
                      <div className="relative mt-2">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          value={formData.social_linkedin}
                          onChange={(e) => handleChange('social_linkedin', e.target.value)}
                          className="pl-10"
                          placeholder="linkedin.com/company/..."
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(180, 83, 9, 0.1)' }}>
                   <p className="text-sm" style={{ color: 'rgba(180, 83, 9, 0.8)' }}>
                      <strong>Nota:</strong> Suas informações de contato serão visíveis apenas para assinantes ativos.
                    </p>
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

                  <div>
                    <Label>WhatsApp</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={formData.contact_whatsapp}
                        onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                        className="pl-10"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            {/* Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSubscribed ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                         <div className="flex items-center justify-between">
                           <div>
                             <Badge className="border-0 mb-2" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'rgb(5, 150, 105)' }}>Ativa</Badge>
                             <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Plano Pro</h4>
                             <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Acesso completo a todas as funcionalidades</p>
                           </div>
                           <div className="text-right">
                             <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>R$ 45</p>
                             <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>/mês</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Gerenciar Assinatura
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                       <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
                       <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sem assinatura ativa</h4>
                       <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Assine para acessar todas as funcionalidades</p>
                    <Button onClick={() => window.location.href = createPageUrl('Subscription')} className="bg-indigo-600 hover:bg-indigo-700">
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">Email</h4>
                      <p className="text-sm text-slate-600">{user?.email}</p>
                    </div>
                    <Badge variant="outline">Verificado</Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed on Mobile */}
      <div className="fixed bottom-20 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-auto z-40">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 h-12 shadow-lg"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}