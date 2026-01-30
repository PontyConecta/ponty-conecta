import { toast } from 'sonner';

// Mapeamento de erros comuns
const ERROR_MESSAGES = {
  400: 'Requisição inválida. Verifique os dados e tente novamente.',
  401: 'Você não está autenticado. Por favor, faça login.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito de dados. O recurso já existe.',
  422: 'Dados inválidos. Verifique as informações fornecidas.',
  429: 'Muitas requisições. Por favor, aguarde um momento.',
  500: 'Erro no servidor. Por favor, tente novamente mais tarde.',
  503: 'Serviço temporariamente indisponível.',
};

// Retry com backoff exponencial
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const shouldRetry = error.response?.status >= 500 || !error.response;

      if (!shouldRetry || isLastRetry) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Handler principal de erros
export function handleApiError(error, customMessage = null) {
  console.error('API Error:', error);

  // Erro de rede
  if (!error.response) {
    toast.error(customMessage || 'Erro de conexão. Verifique sua internet.');
    return;
  }

  // Erro HTTP
  const status = error.response?.status;
  const message = customMessage || ERROR_MESSAGES[status] || 'Ocorreu um erro inesperado.';
  
  toast.error(message);

  // Casos especiais
  if (status === 401) {
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  }

  return error;
}

// Wrapper para chamadas de API com retry e error handling
export async function apiCall(fn, options = {}) {
  const {
    retries = 3,
    customErrorMessage = null,
    showSuccessToast = false,
    successMessage = 'Operação realizada com sucesso!',
  } = options;

  try {
    const result = await retryWithBackoff(fn, retries);
    
    if (showSuccessToast) {
      toast.success(successMessage);
    }
    
    return result;
  } catch (error) {
    handleApiError(error, customErrorMessage);
    throw error;
  }
}