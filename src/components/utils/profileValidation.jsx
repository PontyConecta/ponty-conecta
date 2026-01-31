/**
 * Validação de Campos Obrigatórios do Perfil
 * 
 * Define quais campos são obrigatórios para cada tipo de perfil
 * e fornece funções para validar se o perfil está completo.
 */

// Campos básicos obrigatórios para Creator
const CREATOR_REQUIRED_FIELDS = [
  { key: 'display_name', label: 'Nome de Exibição' },
  { key: 'avatar_url', label: 'Foto de Perfil' },
  { key: 'bio', label: 'Biografia' },
  { key: 'niche', label: 'Nicho(s)', validate: (val) => Array.isArray(val) && val.length > 0 },
  { key: 'platforms', label: 'Plataformas', validate: (val) => Array.isArray(val) && val.length > 0 },
  { key: 'location', label: 'Localização' },
];

// Campos básicos obrigatórios para Brand
const BRAND_REQUIRED_FIELDS = [
  { key: 'company_name', label: 'Nome da Empresa' },
  { key: 'logo_url', label: 'Logo' },
  { key: 'industry', label: 'Setor' },
  { key: 'description', label: 'Descrição' },
  { key: 'contact_email', label: 'Email de Contato' },
];

/**
 * Valida se um perfil Creator está completo
 * @param {Object} creator - Objeto do perfil do creator
 * @returns {Object} { isComplete: boolean, missingFields: string[] }
 */
export function validateCreatorProfile(creator) {
  if (!creator) {
    return {
      isComplete: false,
      missingFields: CREATOR_REQUIRED_FIELDS.map(f => f.label)
    };
  }

  const missingFields = [];

  CREATOR_REQUIRED_FIELDS.forEach(field => {
    const value = creator[field.key];
    
    if (field.validate) {
      // Validação customizada (ex: arrays não vazios)
      if (!field.validate(value)) {
        missingFields.push(field.label);
      }
    } else {
      // Validação padrão (campo não vazio)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.label);
      }
    }
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Valida se um perfil Brand está completo
 * @param {Object} brand - Objeto do perfil da brand
 * @returns {Object} { isComplete: boolean, missingFields: string[] }
 */
export function validateBrandProfile(brand) {
  if (!brand) {
    return {
      isComplete: false,
      missingFields: BRAND_REQUIRED_FIELDS.map(f => f.label)
    };
  }

  const missingFields = [];

  BRAND_REQUIRED_FIELDS.forEach(field => {
    const value = brand[field.key];
    
    if (field.validate) {
      if (!field.validate(value)) {
        missingFields.push(field.label);
      }
    } else {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field.label);
      }
    }
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}

/**
 * Retorna mensagem de erro apropriada baseada nos campos faltantes
 * @param {string[]} missingFields - Array de campos faltantes
 * @returns {string} Mensagem de erro
 */
export function getMissingFieldsMessage(missingFields) {
  if (missingFields.length === 0) return '';
  
  if (missingFields.length === 1) {
    return `Preencha o campo: ${missingFields[0]}`;
  }
  
  if (missingFields.length === 2) {
    return `Preencha os campos: ${missingFields.join(' e ')}`;
  }
  
  const last = missingFields[missingFields.length - 1];
  const others = missingFields.slice(0, -1).join(', ');
  return `Preencha os campos: ${others} e ${last}`;
}