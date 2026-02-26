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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  CheckCircle2,
  Building
} from 'lucide-react';
import BrazilStateSelect, { getStateLabel } from '@/components/common/BrazilStateSelect';
import OnlinePresenceManager from '@/components/onboarding/OnlinePresenceManager';
import { formatPhoneNumber, isValidEmail } from '@/components/utils/phoneFormatter';
import { computeProfileSize, FOLLOWER_RANGES, formatFollowers as fmtFollowers, getProfileSizeLabel } from '@/components/utils/profileSizeUtils';

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
        // Migrate legacy fields to online_presences if needed
        let presences = profile.online_presences || [];
        if (presences.length === 0) {
          if (profile.website) presences.push({ type: 'website', value: profile.website });
          if (profile.social_instagram) presences.push({ type: 'instagram', value: profile.social_instagram });
          if (profile.social_linkedin) presences.push({ type: 'linkedin', value: profile.social_linkedin });
        }
        setFormData({
          company_name: profile.company_name || '',
          industry: profile.industry || '',
          description: profile.description || '',
          online_presences: presences,
          contact_email: profile.contact_email || user.email,
          contact_phone: profile.contact_phone || '',
          logo_url: profile.logo_url || '',
          cover_image_url: profile.cover_image_url || '',
          target_audience: profile.target_audience || '',
          content_guidelines: profile.content_guidelines || '',
          state: profile.state || '',
          city: profile.city || '',
        });
      } else if (profileType === 'creator') {
        setFormData({
          display_name: profile.display_name || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          cover_image_url: profile.cover_image_url || '',
          state: profile.state || '',
          city: profile.city || '',
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
      setFormData(prev => {
        const updatedPlatforms = [...(prev.platforms || []), { ...newPlatform, followers: parseInt(newPlatform.followers) || 0 }];
        return { ...prev, platforms: updatedPlatforms, profile_size: computeProfileSize(updatedPlatforms) };
      });
      setNewPlatform({ name: '', handle: '', followers: '' });
    }
  };

  const removePlatform = (index) => {
    setFormData(prev => {
      const updatedPlatforms = prev.platforms.filter((_, i) => i !== index);
      return { ...prev, platforms: updatedPlatforms, profile_size: computeProfileSize(updatedPlatforms) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const processedFormData = { ...formData };
      // Auto-generate location from state + city
      if (processedFormData.city && processedFormData.state) {
        processedFormData.location = `${processedFormData.city}, ${processedFormData.state}`;
      } else if (processedFormData.state) {
        processedFormData.location = processedFormData.state;
      }

      // Sync legacy fields for brand backward compatibility
      if (profileType === 'brand' && processedFormData.online_presences) {
        const ig = processedFormData.online_presences.find(p => p.type === 'instagram');
        const li = processedFormData.online_presences.find(p => p.type === 'linkedin');
        const ws = processedFormData.online_presences.find(p => p.type === 'website');
        processedFormData.social_instagram = ig?.value || '';
        processedFormData.social_linkedin = li?.value || '';
        processedFormData.website = ws?.value || '';
      }

      const updates = profileType === 'creator' ? {
        ...processedFormData,
        rate_cash_min: processedFormData.rate_cash_min ? parseFloat(processedFormData.rate_cash_min) : null,
        rate_cash_max: processedFormData.rate_cash_max ? parseFloat(processedFormData.rate_cash_max) : null
      } : processedFormData;

      const response = await base44.functions.invoke('updateProfile', {
        profile_type: profileType,
        updates
      });

      if (response.data?.success) {
        await refreshProfile();
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(response.data?.error || 'Erro ao salvar perfil.');
      }
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

  const handleDeleteAccount = async () => {
    try {
      // Here you would call your delete account function
      toast.error('Função de exclusão de conta será implementada em breve');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBrand = profileType === 'brand';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Editar Perfil</h1>
          <p className="mt-1 text-muted-foreground">Atualize suas informações</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSelector />
          <Badge variant="outline" className="capitalize">
            {isBrand ? 'Marca' : 'Criador'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full lg:w-auto flex overflow-x-auto">
          <TabsTrigger value="profile" className="flex-1 lg:flex-none">Perfil</TabsTrigger>
          {!isBrand && <TabsTrigger value="portfolio" className="flex-1 lg:flex-none">Portfólio</TabsTrigger>}
          <TabsTrigger value="contact" className="flex-1 lg:flex-none">Contato</TabsTrigger>
          <TabsTrigger value="account" className="flex-1 lg:flex-none">Conta</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border bg-card shadow-sm">
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
                <div className="h-32 lg:h-40 rounded-xl relative overflow-hidden bg-gradient-to-r from-primary to-primary/60">
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
                        <img src={formData.logo_url} alt="Logo" className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl object-cover border-4 border-card shadow-lg bg-card" />
                      ) : (
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-primary/10 flex items-center justify-center border-4 border-card shadow-lg">
                          <Building2 className="w-10 h-10 text-primary" />
                        </div>
                      )
                    ) : (
                      <Avatar className="w-20 h-20 lg:w-24 lg:h-24 border-4 border-card shadow-lg">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {formData.display_name?.[0] || 'C'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#9038fa] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#7a2de0] transition-colors shadow-lg">
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

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Estado</Label>
                        <div className="mt-2">
                          <BrazilStateSelect value={formData.state} onValueChange={(v) => handleChange('state', v)} />
                        </div>
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <div className="relative mt-2">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            className="pl-10"
                            placeholder="Ex: São Paulo"
                          />
                        </div>
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
                        <Label>Estado</Label>
                        <div className="mt-2">
                          <BrazilStateSelect value={formData.state} onValueChange={(v) => handleChange('state', v)} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <div className="relative mt-2">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          className="pl-10"
                          placeholder="Ex: São Paulo"
                        />
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
                            className={`cursor-pointer ${formData.niche?.includes(niche) ? 'bg-primary' : ''}`}
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
                            className={`cursor-pointer ${formData.content_types?.includes(type) ? 'bg-primary/80' : ''}`}
                            onClick={() => toggleArrayItem('content_types', type)}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Tamanho do Perfil</Label>
                      <p className="text-xs mt-1 text-muted-foreground">Calculado automaticamente pela maior plataforma.</p>
                      <div className="mt-2 h-12 flex items-center px-4 rounded-lg bg-muted/50 border">
                        <Badge variant="outline" className="capitalize text-sm">
                          {formData.profile_size ? getProfileSizeLabel(formData.profile_size) : 'Adicione plataformas'}
                        </Badge>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div>
                      <Label>Plataformas</Label>
                      <div className="space-y-2 mt-2">
                        {formData.platforms?.map((platform, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            <div className="flex-1">
                              <span className="font-medium">{platform.name}</span>
                              <span className="ml-2 text-muted-foreground">@{platform.handle}</span>
                            </div>
                            <Badge variant="outline">{fmtFollowers(platform.followers)} seg.</Badge>
                            <Button variant="ghost" size="icon" onClick={() => removePlatform(index)} className="h-8 w-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Select value={newPlatform.name} onValueChange={(v) => setNewPlatform(p => ({ ...p, name: v }))}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Plataforma" /></SelectTrigger>
                            <SelectContent>
                              {platformOptions.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            value={newPlatform.handle}
                            onChange={(e) => setNewPlatform(p => ({ ...p, handle: e.target.value.replace(/^@/, '') }))}
                            placeholder="usuario (sem @)"
                          />
                          <Select value={newPlatform.followers} onValueChange={(v) => setNewPlatform(p => ({ ...p, followers: v }))}>
                            <SelectTrigger className="h-12"><SelectValue placeholder="Seguidores" /></SelectTrigger>
                            <SelectContent>
                              {FOLLOWER_RANGES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                       <Checkbox
                         id="accepts_barter"
                         checked={formData.accepts_barter}
                         onCheckedChange={(checked) => handleChange('accepts_barter', checked)}
                       />
                       <Label htmlFor="accepts_barter" className="cursor-pointer">
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
            <Card className="border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Portfólio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Link do Media Kit / Portfólio</Label>
                  <div className="relative mt-2">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  <p className="text-sm mt-1 mb-3 text-muted-foreground">Adicione exemplos do seu trabalho</p>
                  
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
                    
                    <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioImageUpload} />
                      <Plus className="w-8 h-8 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Adicionar</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card className="border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isBrand ? (
                <>
                  <OnlinePresenceManager
                    presences={formData.online_presences || []}
                    onChange={(presences) => handleChange('online_presences', presences)}
                    showLinks={true}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Email de Contato</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => handleChange('contact_email', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {formData.contact_email && !isValidEmail(formData.contact_email) && (
                        <p className="text-xs mt-1 text-red-500">Email inválido</p>
                      )}
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={formData.contact_phone}
                          onChange={(e) => handleChange('contact_phone', formatPhoneNumber(e.target.value))}
                          className="pl-10"
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                   <p className="text-sm text-primary">
                      <strong>Nota:</strong> Suas informações de contato serão visíveis apenas para assinantes ativos.
                    </p>
                  </div>

                  <div>
                    <Label>Email de Contato</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleChange('contact_email', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {formData.contact_email && !isValidEmail(formData.contact_email) && (
                      <p className="text-xs mt-1 text-red-500">Email inválido</p>
                    )}
                  </div>

                  <div>
                    <Label>WhatsApp</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.contact_whatsapp}
                        onChange={(e) => handleChange('contact_whatsapp', formatPhoneNumber(e.target.value))}
                        className="pl-10"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
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
            <Card className="border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSubscribed ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10">
                         <div className="flex items-center justify-between">
                           <div>
                             <Badge className="border-0 mb-2 bg-emerald-500/15 text-emerald-600">Ativa</Badge>
                             <h4 className="font-semibold">Plano Premium</h4>
                              <p className="text-sm text-muted-foreground">Acesso completo a todas as funcionalidades</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">R$ 45</p>
                              <p className="text-sm text-muted-foreground">/mês</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Gerenciar Assinatura
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                       <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                       <h4 className="font-semibold mb-2">Sem assinatura ativa</h4>
                       <p className="mb-4 text-sm text-muted-foreground">Assine para acessar todas as funcionalidades</p>
                    <Button onClick={() => window.location.href = createPageUrl('Subscription')} className="bg-[#9038fa] hover:bg-[#7a2de0]">
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Badge variant="outline">Verificado</Badge>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent >
                    <AlertDialogHeader>
                      <AlertDialogTitle >Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        Esta ação não pode ser desfeita. Sua conta e todos os dados associados serão permanentemente excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel >Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button - Fixed on Mobile */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:w-auto z-40">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full lg:w-auto bg-[#9038fa] hover:bg-[#7a2de0] text-white h-12 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}