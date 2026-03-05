import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackImportDialog({ open, onOpenChange, onComplete }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [step, setStep] = useState('upload'); // upload | preview | done
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile(null);
    setParsedRecords([]);
    setDryRunResult(null);
    setStep('upload');
    setLoading(false);
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const text = await f.text();
    let records = [];

    if (f.name.endsWith('.json')) {
      const parsed = JSON.parse(text);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      // CSV parse
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('Arquivo vazio ou sem dados'); return; }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
        records.push(obj);
      }
    }

    setParsedRecords(records);

    // Dry run
    setLoading(true);
    const res = await base44.functions.invoke('adminFeedbackResponses', {
      mode: 'import', records, commit: false,
    });
    setDryRunResult(res.data?.results || {});
    setStep('preview');
    setLoading(false);
  };

  const handleCommit = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('adminFeedbackResponses', {
      mode: 'import', records: parsedRecords, commit: true,
    });
    setDryRunResult(res.data?.results || {});
    setStep('done');
    setLoading(false);
    toast.success(`${res.data?.results?.imported || 0} feedbacks importados`);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Upload className="w-5 h-5 text-primary" />
            Importar Feedbacks
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload de um arquivo CSV ou JSON com os feedbacks. O arquivo deve ter colunas como
              <code className="text-xs bg-muted px-1 rounded">user_email</code>, <code className="text-xs bg-muted px-1 rounded">experience_rating</code>, etc.
            </p>
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}>
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Clique para selecionar CSV ou JSON</p>
              <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFileChange} />
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </div>
            )}
          </div>
        )}

        {step === 'preview' && dryRunResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-foreground">{dryRunResult.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 text-center">
                <p className="text-lg font-bold text-emerald-700">{dryRunResult.imported}</p>
                <p className="text-[10px] text-emerald-600">Válidos</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-center">
                <p className="text-lg font-bold text-red-700">{dryRunResult.skipped}</p>
                <p className="text-[10px] text-red-600">Com erro</p>
              </div>
            </div>

            {dryRunResult.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {dryRunResult.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-red-50">
                    <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="text-red-700">Linha {err.row}: {err.reason}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>Cancelar</Button>
              <Button className="flex-1" onClick={handleCommit} disabled={loading || dryRunResult.imported === 0}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Importar {dryRunResult.imported}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {dryRunResult?.imported || 0} feedbacks importados com sucesso!
            </p>
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}