export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const sig = req.headers.get('stripe-signature');
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('STRIPE_WEBHOOK_SECRET not configured');
            return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const rawBody = await req.text();

        // Importación dinámica de Stripe
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

        // Verificar firma del webhook
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Manejar diferentes eventos de Stripe
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;

            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                await handleSubscriptionCanceled(deletedSubscription);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({
            error: 'Webhook handler failed',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function handleCheckoutCompleted(session: any) {
    const userEmail = session.customer_email || session.customer_details?.email;

    if (!userEmail) {
        console.error('No email found in session');
        return;
    }

    // Actualizar usuario a PRO y darle créditos
    await updateUserTier(userEmail, 'PRO', 500);

    console.log(`✅ User ${userEmail} upgraded to PRO with 500 credits`);
}

async function handleSubscriptionUpdate(subscription: any) {
    const customerId = subscription.customer;

    // Obtener email del customer
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
    const customer = await stripe.customers.retrieve(customerId);

    if ('deleted' in customer && customer.deleted) {
        console.error('Customer deleted');
        return;
    }

    const email = customer.email;

    if (!email) {
        console.error('No email found for customer');
        return;
    }

    // Si la suscripción está activa, dar créditos mensuales
    if (subscription.status === 'active') {
        await updateUserTier(email, 'PRO', 500);
        console.log(`✅ Subscription active for ${email}, credits renewed`);
    }
}

async function handleSubscriptionCanceled(subscription: any) {
    const customerId = subscription.customer;

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
    const customer = await stripe.customers.retrieve(customerId);

    if ('deleted' in customer && customer.deleted) return;

    const email = customer.email;

    if (!email) return;

    // Downgrade a FREE
    await updateUserTier(email, 'FREE', 10);
    console.log(`⚠️ Subscription canceled for ${email}, downgraded to FREE`);
}

async function updateUserTier(email: string, tier: string, credits: number) {
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Usar service role key para bypass RLS
        );

        const { error } = await supabase
            .from('profiles')
            .update({
                tier,
                credits_remaining: credits,
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (error) {
            console.error('Error updating user tier:', error);
            throw error;
        }

        console.log(`Updated ${email} to ${tier} with ${credits} credits`);
    } catch (error) {
        console.error('Supabase update failed:', error);
        throw error;
    }
}
