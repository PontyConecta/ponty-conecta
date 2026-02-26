import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ExternalLink,
  Upload,
  Send,
  Link as LinkIcon,
  Plus,
  X as XIcon,
} from 'lucide-react';

export default function CreatorSubmitDialog({
  delivery,
  campaign,
  brand,
  proofUrls,
  setProofUrls,
  contentUrls,
  setContentUrls,
  proofNotes,
  setProofNotes,
  submitting,
  onClose,
  onSubmit,
  onFileUpload,
}) {
  if (!delivery) return null;

  return (
    <Dialog open={!!delivery} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {delivery.status === 'pending' ? 'Enviar Entrega' : 'Detalhes da Entrega'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Campaign Info */}
          <div className="p-4 rounded-xl">
            <h4 className="font-semibold">{campaign?.title}</h4>
            <p className="text-sm">{brand?.company_name}</p>
          </div>

          {/* Proof Requirements */}
          {campaign?.proof_requirements && (
            <div className="p-4 bg-amber-50 rounded-xl">
              <Label className="text-sm text-amber-700 font-medium">Requisitos de Prova</Label>
              <p className="text-amber-800 mt-1">{campaign.proof_requirements}</p>
            </div>
          )}

          {/* Proof Files Upload */}
          <div>
            <Label>Arquivos de Prova (Screenshots, etc.)</Label>
            <div className="mt-2 space-y-2">
              {proofUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600 truncate flex-1">Arquivo {i + 1}</span>
                  {delivery.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setProofUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="h-8 w-8"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
              ))}
              
              {delivery.status === 'pending' && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={onFileUpload}
                  />
                  <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-orange-400 transition-colors min-h-[44px]">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Clique para fazer upload</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Content URLs */}
          <div>
            <Label>Links do Conteúdo Publicado</Label>
            <div className="mt-2 space-y-2">
              {contentUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...contentUrls];
                        newUrls[i] = e.target.value;
                        setContentUrls(newUrls);
                      }}
                      placeholder="https://instagram.com/p/..."
                      className="pl-10"
                      disabled={delivery.status !== 'pending'}
                    />
                  </div>
                  {delivery.status === 'pending' && contentUrls.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setContentUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {delivery.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentUrls(prev => [...prev, ''])}
                  className="min-h-[44px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Link
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              value={proofNotes}
              onChange={(e) => setProofNotes(e.target.value)}
              placeholder="Informações adicionais sobre a entrega..."
              className="mt-2"
              disabled={delivery.status !== 'pending'}
            />
          </div>

          {/* Submit Button */}
          {delivery.status === 'pending' && (
            <div className="pt-4 border-t">
              <div className={`p-3 rounded-lg mb-3 ${proofUrls.length === 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                <p className={`text-sm font-medium ${proofUrls.length === 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {proofUrls.length === 0 
                    ? '⚠️ Você precisa anexar pelo menos uma prova para enviar' 
                    : '✓ Prova anexada'}
                </p>
              </div>
              <Button
                onClick={onSubmit}
                disabled={submitting || proofUrls.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 min-h-[44px]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para Avaliação
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Certifique-se de que a entrega atende todos os requisitos antes de enviar.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}