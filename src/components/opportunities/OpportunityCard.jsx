import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Users,
  Gift,
  Package,
  MapPin,
  Building2,
  CheckCircle2,
  Eye,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

const REMUNERATION_CONFIG = {
  barter: { icon: Gift, label: 'Permuta', color: 'text-pink-600 bg-pink-50' },
  mixed: { icon: Package, label: 'Misto', color: 'text-amber-600 bg-amber-50' },
};

function getRemunerationLabel(type, campaign) {
  if (REMUNERATION_CONFIG[type]) return REMUNERATION_CONFIG[type];
  return {
    icon: DollarSign,
    label: `R$ ${campaign.budget_min || 0} - ${campaign.budget_max || 0}`,
    color: 'text-emerald-600 bg-emerald-50',
  };
}

export default function OpportunityCard({ campaign, brand, applied, index, onView, onViewBrand }) {
  const remuneration = getRemunerationLabel(campaign.remuneration_type, campaign);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 5) * 0.05 }}
    >
      <Card
        className="border bg-card shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer overflow-hidden"
        onClick={() => onView(campaign)}
      >
        {campaign.cover_image_url && (
          <div className="h-36 overflow-hidden relative">
            <img src={campaign.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            {campaign.featured && (
              <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> Destaque
              </Badge>
            )}
          </div>
        )}
        {!campaign.cover_image_url && campaign.featured && (
          <div className="px-4 pt-3">
            <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0.5 gap-1">
              <Sparkles className="w-3 h-3" /> Destaque
            </Badge>
          </div>
        )}

        <CardContent className="p-4">
          {/* Brand Info */}
          <button onClick={(e) => { e.stopPropagation(); onViewBrand?.(brand); }} className="flex items-center gap-2.5 mb-3 hover:opacity-80 cursor-pointer">
            {brand?.logo_url ? (
              <img src={brand.logo_url} alt={brand.company_name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <h4 className="font-medium text-sm truncate text-primary">{brand?.company_name || 'Marca'}</h4>
          </button>

          {/* Title & Description */}
          <h3 className="text-base font-semibold mb-1 line-clamp-2">{campaign.title}</h3>
          <p className="text-xs line-clamp-2 mb-3 text-muted-foreground">{campaign.description}</p>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1 mb-3">
            {campaign.platforms?.slice(0, 3).map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">{p}</Badge>
            ))}
            {campaign.platforms?.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{campaign.platforms.length - 3}</Badge>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('pt-BR') : '-'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {campaign.slots_filled || 0}/{campaign.slots_total || 1}
            </span>
            {campaign.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {campaign.location}
              </span>
            )}
          </div>

          {/* Remuneration & Action */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${remuneration.color}`}>
              <remuneration.icon className="w-3.5 h-3.5" />
              {remuneration.label}
            </div>

            {applied ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Candidatado
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onView(campaign); }}
                className="bg-primary hover:bg-primary/80 text-primary-foreground text-xs h-9 px-3 min-h-[44px]"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Ver
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}