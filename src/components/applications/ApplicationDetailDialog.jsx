import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import StatusBadge from '../common/StatusBadge';

export default function ApplicationDetailDialog({
  open,
  onClose,
  application,
  profileType,
  creator,
  campaign,
  brand,
}) {
  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Candidatura</DialogTitle>
        </DialogHeader>

        {profileType === 'brand' ? (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar className="w-16 h-16">
                <AvatarImage src={creator?.avatar_url} />
                <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                  {creator?.display_name?.[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">
                  {creator?.display_name || 'Criador'}
                </h4>
                <p className="text-sm">
                  {creator?.bio?.slice(0, 100)}...
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm">Campanha</Label>
              <p className="font-medium">{campaign?.title}</p>
            </div>

            {application.message && (
              <div>
                <Label className="text-sm">Mensagem</Label>
                <p className="mt-1 whitespace-pre-wrap">{application.message}</p>
              </div>
            )}

            {application.proposed_rate && (
              <div>
                <Label className="text-sm">Valor Proposto</Label>
                <p className="text-lg font-semibold text-emerald-600">
                  R$ {application.proposed_rate}
                </p>
              </div>
            )}

            {application.status !== 'pending' && (
              <div className="flex items-center justify-center pt-4 border-t">
                <StatusBadge type="application" status={application.status} className="text-base px-4 py-2" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl">
              <h4 className="font-semibold">{campaign?.title}</h4>
              <p className="text-sm">{brand?.company_name}</p>
            </div>

            {application.message && (
              <div>
                <Label className="text-sm">Sua Mensagem</Label>
                <p className="mt-1">{application.message}</p>
              </div>
            )}

            <div className="flex items-center justify-center pt-4">
              <StatusBadge type="application" status={application.status} className="text-base px-4 py-2" />
            </div>

            {application.status === 'rejected' && application.rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Motivo:</strong> {application.rejection_reason}
                </p>
              </div>
            )}

            {application.status === 'accepted' && application.agreed_rate && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700">
                  <strong>Valor Acordado:</strong> R$ {application.agreed_rate}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}