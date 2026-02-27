import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/contexts/AuthContext';

export default function MyApplications() {
  const { user, profile: authProfile, profileType } = useAuth();
  const [creator, setCreator] = useState(null);
  const [applications, setApplications] = useState([]);
  const [campaigns, setCampaigns] = useState({});
  const [brands, setBrands] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (authProfile && profileType === 'creator') {
      setCreator(authProfile);
      loadPageData(authProfile);
    }
  }, [authProfile, profileType]);

  const loadData = () => loadPageData(creator);

  const loadPageData = async (creatorProfile) => {
    if (!creatorProfile) return;
    try {
      const applicationsData = await base44.entities.Application.filter(
        { creator_id: creatorProfile.id }, 
        '-created_date'
      );
      setApplications(applicationsData);

      const campaignIds = [...new Set(applicationsData.map(a => a.campaign_id))];
      const brandIds = [...new Set(applicationsData.map(a => a.brand_id))];
      
      const [campaignsData, brandsData] = await Promise.all([
        campaignIds.length > 0 ? Promise.all(campaignIds.map(id => base44.entities.Campaign.filter({ id }))) : Promise.resolve([]),
        brandIds.length > 0 ? Promise.all(brandIds.map(id => base44.entities.Brand.filter({ id }))) : Promise.resolve([])
      ]);
      
      const campaignsMap = {};
      campaignsData.flat().forEach(c => { campaignsMap[c.id] = c; });
      setCampaigns(campaignsMap);
      const brandsMap = {};
      brandsData.flat().forEach(b => { brandsMap[b.id] = b; });
      setBrands(brandsMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta candidatura?')) return;
    
    try {
      await base44.functions.invoke('manageApplication', {
        action: 'withdraw',
        application_id: applicationId,
      });
      await loadData();
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Aguardando', color: 'bg-amber-100 text-amber-700', icon: Clock },
      accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
      rejected: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: XCircle },
      withdrawn: { label: 'Cancelada', color: 'bg-slate-100 text-slate-700', icon: XCircle },
      completed: { label: 'Concluída', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 }
    };
    return configs[status] || configs.pending;
  };

  const filteredApplications = applications.filter(a => {
    const campaign = campaigns[a.campaign_id];
    const brand = brands[a.brand_id];
    
    const matchesSearch = campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Minhas Candidaturas</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          {filteredApplications.length} candidaturas encontradas
        </p>
      </div>

      {/* Filters */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por campanha ou marca..."
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="accepted">Aceitas</SelectItem>
                <SelectItem value="rejected">Recusadas</SelectItem>
                <SelectItem value="withdrawn">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application, index) => {
            const campaign = campaigns[application.campaign_id];
            const brand = brands[application.brand_id];
            const statusConfig = getStatusConfig(application.status);

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Brand & Campaign */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {brand?.logo_url ? (
                          <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {campaign?.title || 'Campanha'}
                          </h3>
                          <p className="text-sm">
                            {brand?.company_name || 'Marca'}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {campaign?.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '-'}
                            </span>
                            {application.proposed_rate && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                R$ {application.proposed_rate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span>
                          {new Date(application.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge className={`${statusConfig.color} border-0`}>
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      {application.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(application.id)}
                         
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>

                    {/* Message */}
                    {application.message && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <p className="text-sm line-clamp-2 text-muted-foreground">
                            {application.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {application.status === 'rejected' && application.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Motivo:</strong> {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Agreed Rate */}
                    {application.status === 'accepted' && application.agreed_rate && (
                      <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-emerald-700">
                          <strong>Valor Acordado:</strong> R$ {application.agreed_rate}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma candidatura encontrada
            </h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros'
                : 'Suas candidaturas aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}