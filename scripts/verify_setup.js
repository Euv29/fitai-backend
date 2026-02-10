require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function main() {
    console.log('========================================');
    console.log('  FitAI BACKEND HEALTH CHECK');
    console.log('========================================');

    let allGood = true;

    // 1. SUPABASE CHECK
    console.log('\n--- Checking Database Schema ---');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const requiredTables = [
        'users', 'verification_codes', 'subscriptions', 'weekly_schedules',
        'workout_programs', 'workout_sessions', 'session_exercises', 'workout_logs',
        'exercise_logs', 'chat_messages', 'exercises_cache', 'progress_photos', 'usage_limits'
    ];

    let missingTables = [];
    for (const table of requiredTables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error && error.code === '42P01') { // undefined_table
            console.log(`  ❌ ${table.padEnd(20)} MISSING`);
            missingTables.push(table);
        } else if (error) {
            console.log(`  ❌ ${table.padEnd(20)} ERROR: ${error.message}`);
            allGood = false;
        } else {
            console.log(`  ✅ ${table.padEnd(20)} OK (Rows: ${count || 0})`);
        }
    }

    if (missingTables.length > 0) {
        allGood = false;
        console.log(`\n  ⚠️  ${missingTables.length} tables are missing!`);
        console.log('  ACTION REQUIRED: Run supabase_migration.sql in your Supabase Dashboard SQL Editor.');
    } else {
        console.log('\n  ✅ Database schema is complete!');
    }

    // 2. STRIPE CHECK
    console.log('\n--- Checking Stripe Configuration ---');
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('  ❌ STRIPE_SECRET_KEY missing in .env');
        allGood = false;
    } else {
        try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const products = await stripe.products.list({ limit: 10 });
            const productNames = products.data.map(p => p.name);

            const requiredProducts = ['FitAI Base', 'FitAI Pro', 'FitAI Unlimited'];
            const missingProducts = requiredProducts.filter(p => !productNames.includes(p));

            if (missingProducts.length === 0) {
                console.log('  ✅ Stripe Products: All found');
            } else {
                console.log(`  ❌ Stripe Products Missing: ${missingProducts.join(', ')}`);
                allGood = false;
            }

            // Check .env IDs
            const envIds = [
                process.env.STRIPE_PRICE_BASE,
                process.env.STRIPE_PRICE_PRO,
                process.env.STRIPE_PRICE_UNLIMITED
            ];

            if (envIds.every(id => id && id.startsWith('price_'))) {
                console.log('  ✅ .env Price IDs: Configured');
            } else {
                console.log('  ❌ .env Price IDs: Missing or invalid');
                allGood = false;
            }

        } catch (e) {
            console.log(`  ❌ Stripe Error: ${e.message}`);
            allGood = false;
        }
    }

    // 3. TWILIO CHECK
    console.log('\n--- Checking Twilio Configuration ---');
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('  ❌ Twilio credentials missing in .env');
        allGood = false;
    } else {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const client = require('twilio')(accountSid, authToken);

            const account = await client.api.accounts(accountSid).fetch();
            console.log(`  ✅ Account: ${account.friendlyName} (${account.status})`);

            const balance = await client.balance.fetch();
            console.log(`  ✅ Balance: ${balance.currency} ${balance.balance}`);

        } catch (e) {
            console.log(`  ❌ Twilio Error: ${e.message}`);
            allGood = false;
        }
    }

    console.log('\n========================================');
    if (allGood) {
        console.log('  ✅ SYSTEM READY');
        process.exit(0);
    } else {
        console.log('  ❌ SYSTEM ISSUES DETECTED');
        process.exit(1);
    }
}

main().catch(console.error);
