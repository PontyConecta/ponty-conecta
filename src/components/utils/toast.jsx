import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message, options = {}) => {
    sonnerToast.success(message, {
      duration: 3000,
      ...options
    });
  },
  
  error: (message, options = {}) => {
    sonnerToast.error(message, {
      duration: 4000,
      ...options
    });
  },
  
  info: (message, options = {}) => {
    sonnerToast.info(message, {
      duration: 3000,
      ...options
    });
  },
  
  warning: (message, options = {}) => {
    sonnerToast.warning(message, {
      duration: 3500,
      ...options
    });
  },
  
  promise: (promise, messages) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      duration: 3000
    });
  }
};