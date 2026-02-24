import { Megaphone, Search, Users, FileText, Building2, Crown, UserCircle, Plus } from 'lucide-react';

export const brandActions = [
  { label: 'Nova Campanha', icon: Plus, page: 'CampaignManager', bg: '#9038fa', requiresSub: true },
  { label: 'Descobrir Criadores', icon: Search, page: 'DiscoverCreators', bg: '#6366f1' },
  { label: 'Candidaturas', icon: Users, page: 'Applications', bg: '#f59e0b' },
  { label: 'Entregas', icon: FileText, page: 'Deliveries', bg: '#10b981' },
];

export const creatorActions = [
  { label: 'Campanhas', icon: Megaphone, page: 'OpportunityFeed', bg: '#9038fa' },
  { label: 'Descobrir Marcas', icon: Building2, page: 'DiscoverBrands', bg: '#6366f1' },
  { label: 'Candidaturas', icon: FileText, page: 'Applications', bg: '#f59e0b' },
  { label: 'Meu Perfil', icon: UserCircle, page: 'Profile', bg: '#10b981' },
];