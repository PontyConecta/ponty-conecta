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
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={creator?.avatar_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {creator?.display_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {creator?.display_name || 'Criador'}
                    </h3>
                    <p className="text-sm truncate">
                      {campaign?.title || '-'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {brand?.logo_url ? (
                    <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
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
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`} style={isOverdue ? {} : { color: 'var(--text-secondary)' }}>
                        <Calendar className="w-4 h-4" />
                        {formatDate(delivery.deadline)}
                        {isOverdue && <span className="font-medium">(Atrasado!)</span>}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Delivery Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {profileType === 'brand' && (
                <>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(delivery.deadline)}
                  </div>
                  {delivery.proof_urls?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {delivery.proof_urls.length} arquivo(s)
                    </div>
                  )}
                </>
              )}
              <StatusBadge type="delivery" status={delivery.status} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {profileType === 'brand' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => onView(delivery)} className="min-h-[44px] min-w-[44px]">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  {delivery.status === 'submitted' && (
                    <Button size="sm" onClick={() => onView(delivery)} className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Avaliar
                    </Button>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
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