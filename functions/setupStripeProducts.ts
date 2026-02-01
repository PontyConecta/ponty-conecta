import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    // Create Brand Product
    const brandProduct = await stripe.products.create({
      name: 'Assinatura Marca - Ponty Conecta',
      description: 'Plano premium para marcas com acesso completo à plataforma',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        profile_type: 'brand'
      }
    });

    // Create Creator Product
    const creatorProduct = await stripe.products.create({
      name: 'Assinatura Criador - Ponty Conecta',
      description: 'Plano premium para criadores com acesso completo à plataforma',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        profile_type: 'creator'
      }
    });

    // Create Brand Monthly Price
    const brandMonthly = await stripe.prices.create({
      product: brandProduct.id,
      unit_amount: 4500, // R$ 45.00 in cents
      currency: 'brl',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'brand_monthly'
      }
    });

    // Create Brand Annual Price
    const brandAnnual = await stripe.prices.create({
      product: brandProduct.id,
      unit_amount: 45000, // R$ 450.00 in cents
      currency: 'brl',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_type: 'brand_annual'
      }
    });

    // Create Creator Monthly Price
    const creatorMonthly = await stripe.prices.create({
      product: creatorProduct.id,
      unit_amount: 4500, // R$ 45.00 in cents
      currency: 'brl',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_type: 'creator_monthly'
      }
    });

    // Create Creator Annual Price
    const creatorAnnual = await stripe.prices.create({
      product: creatorProduct.id,
      unit_amount: 45000, // R$ 450.00 in cents
      currency: 'brl',
      recurring: {
        interval: 'year'
      },
      metadata: {
        plan_type: 'creator_annual'
      }
    });

    return Response.json({
      success: true,
      products: {
        brand: brandProduct.id,
        creator: creatorProduct.id
      },
      prices: {
        brand_monthly: brandMonthly.id,
        brand_annual: brandAnnual.id,
        creator_monthly: creatorMonthly.id,
        creator_annual: creatorAnnual.id
      }
    });

  } catch (error) {
    console.error('Error setting up Stripe products:', error);
    return Response.json({ 
      error: 'Failed to setup products', 
      details: error.message 
    }, { status: 500 });
  }
});