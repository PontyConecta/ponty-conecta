export const CREATOR_TYPE_OPTIONS = [
  { value: 'ugc', label: 'UGC Creator', emoji: '🎬', desc: 'Conteúdo & tendências' },
  { value: 'healthcare', label: 'Profissional de Saúde', emoji: '🏥', desc: 'Médicos, nutricionistas' },
  { value: 'athlete', label: 'Atleta', emoji: '🏆', desc: 'Performance & esporte' },
  { value: 'entrepreneur', label: 'Empresário', emoji: '💼', desc: 'Negócios & empreendedorismo' },
  { value: 'expert', label: 'Especialista', emoji: '🎓', desc: 'Educação & expertise' },
  { value: 'entertainer', label: 'Entretenimento', emoji: '🎭', desc: 'Humor, arte, cultura' },
];

export const TYPE_LABELS = {
  ugc: 'UGC Creator',
  healthcare: 'Profissional de Saúde',
  athlete: 'Atleta',
  entrepreneur: 'Empresário',
  expert: 'Especialista',
  entertainer: 'Entretenimento',
};

export const TYPE_COPY = {
  healthcare: {
    title: 'Parcerias em Saúde',
    sub: 'Conecte sua autoridade às marcas certas',
  },
  athlete: {
    title: 'Contratos & Endorsements',
    sub: 'Parcerias de performance e lifestyle',
  },
  entrepreneur: {
    title: 'Pipeline de Parcerias',
    sub: 'Oportunidades de negócio com marcas',
  },
  expert: {
    title: 'Colaborações',
    sub: 'Sua expertise conectada a marcas relevantes',
  },
  default: {
    title: 'Campanhas para você',
    sub: 'Oportunidades selecionadas com base no seu perfil',
  },
};

export function getPageTitle(creatorType) {
  if (creatorType === 'entrepreneur' || creatorType === 'healthcare' || creatorType === 'expert') return 'Oportunidades de Parceria';
  if (creatorType === 'athlete') return 'Contratos & Endorsements';
  return 'Campanhas';
}

export function getEmptyMessage(creatorType) {
  if (creatorType === 'healthcare') return 'Novas parcerias de saúde em breve';
  if (creatorType === 'athlete') return 'Novos contratos de endorsement em breve';
  if (creatorType === 'entrepreneur') return 'Novas oportunidades de parceria em breve';
  return 'Novas campanhas serão adicionadas em breve';
}