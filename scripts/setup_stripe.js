require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = [
    {
        name: 'FitAI Base',
        description: 'Basic access to AI workout plans',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        envKey: 'STRIPE_PRICE_BASE'
    },
    {
        name: 'FitAI Pro',
        description: 'Advanced AI features + Meal plans',
        price: 1999, // $19.99
        currency: 'usd',
        interval: 'month',
        envKey: 'STRIPE_PRICE_PRO'
    },
    {
        name: 'FitAI Unlimited',
        description: 'Unlimited AI access + Priority support',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        envKey: 'STRIPE_PRICE_UNLIMITED'
    }
];

async function setupStripe() {
    console.log('Initializing Stripe Products & Prices...');

    const envUpdates = {};

    for (const productDef of PRODUCTS) {
        console.log(`\nProcessing ${productDef.name}...`);

        // Check if product exists
        const existingProducts = await stripe.products.search({
            query: `name:'${productDef.name}'`,
        });

        let productId;

        if (existingProducts.data.length > 0) {
            console.log(`  - Product already exists: ${existingProducts.data[0].id}`);
            productId = existingProducts.data[0].id;
        } else {
            console.log(`  - Creating new product...`);
            const product = await stripe.products.create({
                name: productDef.name,
                description: productDef.description,
            });
            console.log(`  - Created product: ${product.id}`);
            productId = product.id;
        }

        // Check for prices
        const prices = await stripe.prices.list({
            product: productId,
            active: true,
            limit: 1
        });

        let priceId;

        if (prices.data.length > 0) {
            console.log(`  - Price already exists: ${prices.data[0].id}`);
            priceId = prices.data[0].id;
        } else {
            console.log(`  - Creating new price (${productDef.price / 100} ${productDef.currency}/${productDef.interval})...`);
            const price = await stripe.prices.create({
                product: productId,
                unit_amount: productDef.price,
                currency: productDef.currency,
                recurring: { interval: productDef.interval },
            });
            console.log(`  - Created price: ${price.id}`);
            priceId = price.id;
        }

        envUpdates[productDef.envKey] = priceId;
    }

    console.log('\n--- .env Configuration ---');
    console.log('Update your .env file with these values:');
    for (const [key, value] of Object.entries(envUpdates)) {
        console.log(`${key}=${value}`);
    }
}

setupStripe().catch(console.error);
