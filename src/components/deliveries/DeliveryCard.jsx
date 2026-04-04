import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Eye,
  Calendar,
  Image as ImageIcon,
  Building2,
  Send,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../common/StatusBadge';

export default function DeliveryCard({
  delivery,
  profileType,
  creator,
  campaign,
  brand,
  index,
  onView,
  onSubmit,
  onViewCreatorProfile,
}) {
  const isOverdue = delivery.deadline && new Date() > new Date(delivery.deadline) && delivery.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Profile Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {profileType === 'brand' ? (
                <>
                  <button onClick={() => onViewCreatorProfile?.(creator)} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 cursor-pointer text-left">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={creator?.avatar_url} />
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {creator?.display_name?.[0] || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-primary">
                        {creator?.display_name || 'Criador'}
                      </h3>
                      <p className="text-sm truncate">
                        {campaign?.title || '-'}
                      </p>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  {brand?.logo_url ? (
                    <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{campaign?.title || 'Campanha'}</h3>
                    <p className="text-sm text-muted-foreground">{brand?.company_name || 'Marca'}</p>
                    <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(delivery.deadline || campaign?.deadline)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status + Actions for creator */}
            {profileType !== 'brand' && (
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge type="delivery" status={delivery.status} />
                {delivery.status === 'pending' && (
                  <Button onClick={() => onSubmit(delivery)} className="bg-orange-500 hover:bg-orange-600 min-h-[44px]">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Entrega
                  </Button>
                )}
                {delivery.status === 'submitted' && (
                  <Button variant="outline" onClick={() => onSubmit(delivery)} className="min-h-[44px]">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Entrega
                  </Button>
                )}
                {['approved', 'contested', 'in_dispute', 'resolved', 'closed'].includes(delivery.status) && (
                  <Button variant="outline" size="sm" onClick={() => onSubmit(delivery)} className="min-h-[44px]">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                )}
              </div>
            )}

            {/* Brand view action */}
            {profileType === 'brand' && (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onView?.(delivery); }} className="mt-2">
                <Eye className="w-4 h-4 mr-1" />
                Ver Entrega
              </Button>
            )}
          </div>

          {/* Requirements Preview (Creator) */}
          {profileType === 'creator' && campaign?.proof_requirements && delivery.status === 'pending' && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Requisitos:</strong> {campaign.proof_requirements.slice(0, 150)}...
              </p>
            </div>
          )}

          {/* Contest Reason */}
          {delivery.status === 'contested' && delivery.contest_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Motivo da contestação:</strong> {delivery.contest_reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}