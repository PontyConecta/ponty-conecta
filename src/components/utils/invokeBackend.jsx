import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Mapa de error codes → mensagens amigáveis em PT-BR.
 * Funções podem sobrescrever passando `codeMessages`.
 */
const DEFAULT_CODE_MESSAGES = {
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  MISSING_FIELDS: 'Preencha todos os campos obrigatórios.',
  INVALID_INPUT: 'Dados inválidos. Verifique e tente novamente.',
  INVALID_STEP: 'Etapa de onboarding inválida.',
  INVALID_TRANSITION: 'Esta ação não é permitida no estado atual.',
  INVALID_RATE_RANGE: 'O valor mínimo não pode ser maior que o máximo.',
  INVALID_ACTION: 'Ação não reconhecida.',
  MISSING_PROOF: 'Pelo menos uma prova é obrigatória.',
  VALIDATION_ERROR: 'Erro de validação. Verifique os dados.',
  NO_CHANGES: 'Nenhuma alteração detectada.',
  INTERNAL_ERROR: 'Erro no servidor. Tente novamente.',
};

/**
 * Invoca uma backend function e normaliza a resposta.
 *
 * @param {string} fnName — nome da function (ex: 'manageCampaign')
 * @param {object} payload — payload a enviar
 * @param {object} [options]
 * @param {boolean} [options.showErrorToast=true] — exibir toast automático
 * @param {boolean} [options.showSuccessToast=false] — exibir toast de sucesso
 * @param {string} [options.successMessage='Feito!'] — mensagem de sucesso
 * @param {Record<string, string>} [options.codeMessages] — override de mensagens por code
 * @returns {Promise<{data: any, error: null} | {data: null, error: {code: string, message: string, status: number}}>}
 */
export async function invokeBackend(fnName, payload = {}, options = {}) {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage = 'Feito!',
    codeMessages = {},
  } = options;

  const mergedMessages = { ...DEFAULT_CODE_MESSAGES, ...codeMessages };

  try {
    const response = await base44.functions.invoke(fnName, payload);
    const result = response.data;

    if (showSuccessToast) {
      toast.success(successMessage);
    }

    return { data: result, error: null };
  } catch (err) {
    const status = err?.response?.status || 500;
    const body = err?.response?.data || {};
    const code = body.code || 'INTERNAL_ERROR';
    const serverMsg = body.error || 'Erro desconhecido';

    // Resolve human-readable message: code map → server message → fallback
    const friendlyMsg = mergedMessages[code] || serverMsg;

    if (showErrorToast) {
      toast.error(friendlyMsg);
    }

    // Auto-redirect on auth failure
    if (code === 'UNAUTHORIZED') {
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }

    return {
      data: null,
      error: { code, message: friendlyMsg, serverMessage: serverMsg, status },
    };
  }
}