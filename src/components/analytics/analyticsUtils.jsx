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
    console.log('Facebook CAPI event sent:', eventName);
    return response;
  } catch (error) {
    console.error('Error sending Facebook event:', error);
  }
};

// Enviar evento para Google Analytics
export const sendGoogleAnalyticsEvent = async (eventName, eventParams = {}) => {
  try {
    const measurementId = import.meta.env.VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID;
    
    if (!measurementId) {
      console.warn('Google Analytics Measurement ID not configured');
      return;
    }

    // Gera um cliente ID simples (em produção, use gtag)
    const clientId = localStorage.getItem('ga_client_id') || 
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!localStorage.getItem('ga_client_id')) {
      localStorage.setItem('ga_client_id', clientId);
    }

    const payload = {
      measurementId: measurementId,
      clientId: clientId,
      events: [
        {
          name: eventName,
          params: {
            ...eventParams,
            timestamp: Date.now(),
          },
        },
      ],
    };

    await base44.functions.invoke('googleAnalytics', payload);
    console.log('Google Analytics event sent:', eventName);
  } catch (error) {
    console.error('Error sending Google Analytics event:', error);
  }
};

// Rastrear página visualizada
export const trackPageView = (pageTitle = null) => {
  sendFacebookEvent('PageView');
  sendGoogleAnalyticsEvent('page_view', {
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });
};

// Rastrear lead
export const trackLead = (leadData = {}) => {
  sendFacebookEvent('Lead', {
    content_name: leadData.content_name || 'Lead',
    ...leadData,
  });
  sendGoogleAnalyticsEvent('generate_lead', leadData);
};

// Rastrear compra
export const trackPurchase = (purchaseData) => {
  sendFacebookEvent('Purchase', {
    currency: purchaseData.currency || 'BRL',
    value: purchaseData.value,
    content_type: purchaseData.content_type || 'product',
    ...purchaseData,
  }, purchaseData.user_email);
  
  sendGoogleAnalyticsEvent('purchase', {
    transaction_id: purchaseData.transaction_id,
    value: purchaseData.value,
    currency: purchaseData.currency || 'BRL',
    items: purchaseData.items || [],
  });
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
  
  sendGoogleAnalyticsEvent('add_to_cart', {
    items: [
      {
        item_id: productData.id,
        item_name: productData.name,
        price: productData.value,
      },
    ],
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
  
  sendGoogleAnalyticsEvent('view_item', {
    items: [
      {
        item_id: productData.id,
        item_name: productData.name,
        price: productData.value,
      },
    ],
  });
};