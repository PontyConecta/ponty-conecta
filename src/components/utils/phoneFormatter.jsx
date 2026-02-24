// Formata telefone brasileiro automaticamente: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
export function formatPhoneNumber(value) {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = digits.slice(0, 11);
  
  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

// Valida se é um email válido
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Gera URL clicável a partir de uma presença online
export function getPresenceUrl(presence) {
  if (!presence?.value) return '#';
  const val = presence.value.trim();
  
  switch (presence.type) {
    case 'website':
      return val.startsWith('http') ? val : `https://${val}`;
    case 'instagram':
      if (val.startsWith('http')) return val;
      return `https://instagram.com/${val.replace(/^@/, '')}`;
    case 'tiktok':
      if (val.startsWith('http')) return val;
      return `https://tiktok.com/@${val.replace(/^@/, '')}`;
    case 'linkedin':
      if (val.startsWith('http')) return val;
      return `https://${val}`;
    case 'youtube':
      if (val.startsWith('http')) return val;
      return `https://${val}`;
    case 'facebook':
      if (val.startsWith('http')) return val;
      return `https://${val}`;
    case 'twitter':
      if (val.startsWith('http')) return val;
      return `https://x.com/${val.replace(/^@/, '')}`;
    default:
      return val.startsWith('http') ? val : `https://${val}`;
  }
}

// Retorna label amigável para uma presença
export function getPresenceLabel(presence) {
  if (!presence) return '';
  switch (presence.type) {
    case 'website': return 'Website';
    case 'instagram': return presence.value?.replace(/^@/, '') || 'Instagram';
    case 'linkedin': return 'LinkedIn';
    case 'tiktok': return 'TikTok';
    case 'youtube': return 'YouTube';
    case 'facebook': return 'Facebook';
    case 'twitter': return 'Twitter / X';
    default: return presence.value || presence.type;
  }
}