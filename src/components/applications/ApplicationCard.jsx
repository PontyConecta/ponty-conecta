import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  Calendar,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../utils/formatters';
import StatusBadge from '../common/StatusBadge';

export default function ApplicationCard({
  application,
  creator,
  campaign,
  brand,
  profileType,
  index,
  onView,
  onAccept,
  onWithdraw,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow">
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
                      Campanha: {campaign?.title || '-'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {creator?.niche?.slice(0, 3).map((n, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {brand?.logo_url ? (
                    <img src={brand.logo_url} alt={brand.company_name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-400" />
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
                        {formatDate(campaign?.deadline)}
                      </span>
                      {application.proposed_rate && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {application.proposed_rate}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Application Details */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {profileType === 'brand' && application.proposed_rate && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  R$ {application.proposed_rate}
                </div>
              )}
              <div>{formatDate(application.created_date)}</div>
              <StatusBadge type="application" status={application.status} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(application)}>
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>

              {profileType === 'brand' && application.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => onAccept(application)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Aceitar
                </Button>
              )}

              {profileType === 'creator' && application.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWithdraw(application.id)}
                  className="text-slate-600"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Message Preview */}
          {application.message && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-600 line-clamp-2">
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
}