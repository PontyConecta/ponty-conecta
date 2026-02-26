import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from 'lucide-react';

export default function ApplyToCampaignDialog({
  campaign,
  brandName,
  applicationMessage,
  setApplicationMessage,
  proposedRate,
  setProposedRate,
  applying,
  onBack,
  onSubmit,
}) {
  if (!campaign) return null;

  return (
    <>
      {/* Campaign Summary */}
      <div className="p-4 rounded-xl bg-muted">
        <h4 className="font-semibold mb-1">{campaign.title}</h4>
        <p className="text-sm text-muted-foreground">{brandName || 'Marca'}</p>
      </div>

      {/* Application Form */}
      <div>
        <Label>Sua Mensagem *</Label>
        <Textarea
          value={applicationMessage}
          onChange={(e) => setApplicationMessage(e.target.value)}
          placeholder="Conte por que você é ideal para esta campanha..."
          className="mt-2 min-h-[120px]"
        />
        <p className="text-xs mt-1 text-muted-foreground">
          Dica: Mencione trabalhos anteriores relevantes e por que você se identifica com a marca.
        </p>
      </div>

      {campaign.remuneration_type !== 'barter' && (
        <div>
          <Label>Sua Proposta de Valor (R$)</Label>
          <Input
            type="number"
            value={proposedRate}
            onChange={(e) => setProposedRate(e.target.value)}
            placeholder={`Ex: ${campaign.budget_min || 500}`}
            className="mt-2"
          />
          <p className="text-xs mt-1 text-muted-foreground">
            Orçamento da marca: R$ {campaign.budget_min || 0} - {campaign.budget_max || 0}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={applying || !applicationMessage}
          className="bg-[#9038fa] hover:bg-[#7a2de0] text-white shadow-sm min-h-[44px]"
        >
          {applying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Candidatura
            </>
          )}
        </Button>
      </div>
    </>
  );
}