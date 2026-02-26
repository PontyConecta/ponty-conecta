import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Flag,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function BrandReviewDialog({
  delivery,
  campaign,
  creator,
  processing,
  onClose,
  onApprove,
  onContest,
}) {
  const [contestReason, setContestReason] = useState('');

  if (!delivery) return null;

  return (
    <Dialog open={!!delivery} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Campaign & Creator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl">
              <Label className="text-sm">Campanha</Label>
              <p className="font-medium">{campaign?.title}</p>
            </div>
            <div className="p-4 rounded-xl">
              <Label className="text-sm">Criador</Label>
              <p className="font-medium">{creator?.display_name}</p>
            </div>
          </div>

          {/* Proof Requirements */}
          {campaign?.proof_requirements && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <Label className="text-sm text-amber-700 font-medium">Requisitos de Prova</Label>
              <p className="text-amber-800 mt-1">{campaign.proof_requirements}</p>
            </div>
          )}

          {/* Proof Files */}
          {delivery.proof_urls?.length > 0 && (
            <div>
              <Label className="text-sm text-slate-500">Arquivos de Prova</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {delivery.proof_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-700 truncate">Arquivo {i + 1}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Content URLs */}
          {delivery.content_urls?.length > 0 && (
            <div>
              <Label className="text-sm text-slate-500">Links do Conteúdo</Label>
              <div className="space-y-2 mt-2">
                {delivery.content_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Proof Notes */}
          {delivery.proof_notes && (
            <div>
              <Label className="text-sm text-slate-500">Observações do Criador</Label>
              <p className="text-slate-700 mt-1 whitespace-pre-wrap">{delivery.proof_notes}</p>
            </div>
          )}

          {/* Deadline Status */}
          <div className="flex items-center gap-4 p-4 rounded-xl">
            <Calendar className="w-5 h-5" />
            <div>
              <Label className="text-sm">Prazo de Entrega</Label>
              <p className="font-medium">
                {delivery.deadline 
                  ? new Date(delivery.deadline).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'long', year: 'numeric' 
                    })
                  : '-'
                }
              </p>
            </div>
            {delivery.submitted_at && delivery.deadline && (
              <Badge className={
                new Date(delivery.submitted_at) <= new Date(delivery.deadline)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }>
                {new Date(delivery.submitted_at) <= new Date(delivery.deadline)
                  ? 'No prazo'
                  : 'Atrasada'}
              </Badge>
            )}
          </div>

          {/* Actions for Submitted Deliveries */}
          {delivery.status === 'submitted' && (
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm">
                Avalie a entrega com base nos <strong>critérios definidos na campanha</strong>. 
                Contestações só devem ser feitas quando a entrega não cumpre os requisitos objetivos.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={onApprove}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar Entrega
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => contestReason && onContest(contestReason)}
                  disabled={processing || !contestReason}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 min-h-[44px]"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Contestar
                </Button>
              </div>

              <div>
                <Label>Motivo da Contestação</Label>
                <Textarea
                  value={contestReason}
                  onChange={(e) => setContestReason(e.target.value)}
                  placeholder="Descreva objetivamente por que a entrega não atende aos requisitos..."
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  A contestação abrirá uma disputa que será analisada pela plataforma.
                </p>
              </div>

              {contestReason && (
                <Button
                  onClick={() => onContest(contestReason)}
                  disabled={processing}
                  variant="destructive"
                  className="w-full min-h-[44px]"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Flag className="w-4 h-4 mr-2" />
                      Confirmar Contestação
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Contest Reason Display */}
          {delivery.status === 'contested' && delivery.contest_reason && (
            <div className="p-4 bg-red-50 rounded-xl">
              <Label className="text-sm text-red-700 font-medium">Motivo da Contestação</Label>
              <p className="text-red-800 mt-1">{delivery.contest_reason}</p>
            </div>
          )}

          {/* Status Display */}
          {delivery.status !== 'submitted' && (
           <div className="flex items-center justify-center pt-4 border-t">
             <StatusBadge type="delivery" status={delivery.status} className="text-base px-4 py-2" />
           </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}