import { Megaphone, Search, Users, FileText, Building2, Crown, UserCircle, Plus } from 'lucide-react';

export const brandActions = [
  { label: 'Nova Campanha', icon: Plus, page: 'CampaignManager', bg: 'hsl(var(--primary))', requiresSub: true },
  { label: 'Descobrir Criadores', icon: Search, page: 'DiscoverCreators', bg: 'hsl(var(--accent))' },
  { label: 'Candidaturas', icon: Users, page: 'Applications', bg: '#f59e0b' },
  { label: 'Entregas', icon: FileText, page: 'Deliveries', bg: '#10b981' },
];

export const creatorActions = [
  { label: 'Campanhas', icon: Megaphone, page: 'OpportunityFeed', bg: 'hsl(var(--primary))' },
  { label: 'Descobrir Marcas', icon: Building2, page: 'DiscoverBrands', bg: 'hsl(var(--accent))' },
  { label: 'Candidaturas', icon: FileText, page: 'Applications', bg: '#f59e0b' },
  { label: 'Meu Perfil', icon: UserCircle, page: 'Profile', bg: '#10b981' },
];