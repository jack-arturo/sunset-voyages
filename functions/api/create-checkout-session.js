export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = await request.json();
        const { package: packageType, price, addons } = body;

        // Package name mapping
        const packageNames = {
            'essential': 'Essential Departure Package',
            'premium': 'Premium Transition Package',
            'elite': 'Elite Horizon Package'
        };

        const productName = packageNames[packageType] || 'Sunset Voyages Package';
        const productDescription = 'Comprehensive senior voyage solution. All transactions final upon embarkation.';

        // Build line items
        const lineItems = new URLSearchParams();
        lineItems.append('payment_method_types[0]', 'card');
        lineItems.append('line_items[0][price_data][currency]', 'usd');
        lineItems.append('line_items[0][price_data][product_data][name]', productName);
        lineItems.append('line_items[0][price_data][product_data][description]', productDescription);
        lineItems.append('line_items[0][price_data][unit_amount]', (price * 100).toString());
        lineItems.append('line_items[0][quantity]', '1');
        lineItems.append('mode', 'payment');
        lineItems.append('success_url', 'https://sunset-voyages.pages.dev/success.html?session_id={CHECKOUT_SESSION_ID}');
        lineItems.append('cancel_url', 'https://sunset-voyages.pages.dev/checkout.html');
        lineItems.append('metadata[package]', packageType);

        // Shipping (for the "documentation package")
        lineItems.append('shipping_address_collection[allowed_countries][0]', 'US');
        lineItems.append('shipping_address_collection[allowed_countries][1]', 'GB');
        lineItems.append('shipping_address_collection[allowed_countries][2]', 'CA');
        lineItems.append('shipping_address_collection[allowed_countries][3]', 'AU');

        // Create Stripe checkout session
        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: lineItems
        });

        const session = await stripeResponse.json();

        if (session.error) {
            return new Response(JSON.stringify({ error: session.error.message }), {
                status: 400,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ id: session.id }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
