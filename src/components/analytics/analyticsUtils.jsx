import { base44 } from '@/api/base44Client';

// Enviar evento para Facebook CAPI
export const sendFacebookEvent = async (eventName, eventData = {}, userEmail = null) => {
  try {
    const fbp = document.cookie.match(/_fbp=([^;]+)/)?.[1] || null;
    const fbc = document.cookie.match(/_fbc=([^;]+)/)?.[1] || null;

    const payload = {
      event: eventName,
      eventData: eventData,
      fbp: fbp,
      fbc: fbc,
      user_agent: navigator.userAgent,
      url: window.location.href,
      user_email: userEmail,
    };

    const response = await base44.functions.invoke('facebookCAPI', payload);
    return response;
  } catch (error) {
    // Silently fail — analytics should never block UX
  }
};

// Rastrear página visualizada
export const trackPageView = (pageTitle = null) => {
  sendFacebookEvent('PageView');
};

// Rastrear lead
export const trackLead = (leadData = {}) => {
  sendFacebookEvent('Lead', {
    content_name: leadData.content_name || 'Lead',
    ...leadData,
  });
};

// Rastrear compra
export const trackPurchase = (purchaseData) => {
  sendFacebookEvent('Purchase', {
    currency: purchaseData.currency || 'BRL',
    value: purchaseData.value,
    content_type: purchaseData.content_type || 'product',
    ...purchaseData,
  }, purchaseData.user_email);
};

// Rastrear adição ao carrinho
export const trackAddToCart = (productData) => {
  sendFacebookEvent('AddToCart', {
    content_type: 'product',
    content_id: productData.id,
    content_name: productData.name,
    value: productData.value,
    currency: productData.currency || 'BRL',
  });
};

// Rastrear visualização de produto
export const trackViewContent = (productData) => {
  sendFacebookEvent('ViewContent', {
    content_type: 'product',
    content_id: productData.id,
    content_name: productData.name,
    value: productData.value,
    currency: productData.currency || 'BRL',
  });
};