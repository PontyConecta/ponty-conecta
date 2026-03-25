import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { CheckCircle2, Camera, FileText, Globe, Image, Mail, ArrowRight } from 'lucide-react';

const CRITERIA = [
  { key: 'avatar', label: 'Foto de perfil', icon: Camera, check: (p) => !!p?.avatar_url },
  { key: 'bio', label: 'Bio completa (50+ chars)', icon: FileText, check: (p) => (p?.bio?.length || 0) >= 50 },
  { key: 'platforms', label: 'Plataforma adicionada', icon: Globe, check: (p) => (p?.platforms?.length || 0) >= 1 },
  { key: 'portfolio', label: '3+ imagens portfólio', icon: Image, check: (p) => (p?.portfolio_images?.length || 0) >= 3 },
  { key: 'contact', label: 'Contato informado', icon: Mail, check: (p) => !!(p?.contact_whatsapp || p?.contact_email) },
];

export default function ProfileStrength({ profile }) {
  const results = CRITERIA.map(c => ({ ...c, passed: c.check(profile) }));
  const score = results.filter(r => r.passed).length * 20;

  if (score === 100) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Você está no radar das marcas</p>
            <p className="text-xs text-muted-foreground">Perfil completo — marcas podem te encontrar e convidar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Força do Perfil</CardTitle>
        <p className="text-xs text-muted-foreground">Marcas consultam seu perfil antes de convidar</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums text-foreground">{score}%</span>
        </div>
        <div className="space-y-2">
          {results.filter(r => !r.passed).map(item => (
            <Link
              key={item.key}
              to={createPageUrl('Settings')}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}