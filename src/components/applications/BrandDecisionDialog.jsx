import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function BrandDecisionDialog({
  open,
  onClose,
  application,
  creator,
  campaign,
  agreedRate,
  setAgreedRate,
  rejectionReason,
  setRejectionReason,
  processing,
  onAccept,
  onReject,
}) {
  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Candidatura</DialogTitle>
        </DialogHeader>

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

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Valor Acordado (R$)</Label>
              <Input
                type="number"
                value={agreedRate}
                onChange={(e) => setAgreedRate(e.target.value)}
                placeholder={application.proposed_rate?.toString() || '0'}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={onAccept}
                disabled={processing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aceitar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (rejectionReason || window.confirm('Deseja realmente recusar esta candidatura?')) {
                    onReject();
                  }
                }}
                disabled={processing}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Recusar
              </Button>
            </div>

            <div>
              <Label>Motivo da Recusa (opcional)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique brevemente o motivo..."
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}