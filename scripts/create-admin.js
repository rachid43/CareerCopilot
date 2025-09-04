// Script to create superadmin user in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  try {
    console.log('Creating superadmin user...');
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@careercopilot.nl',
      password: 'SuperAdmin2025!',
      user_metadata: {
        firstName: 'Career',
        lastName: 'Admin',
        role: 'superadmin',
        subscriptionTier: 'elite',
        subscriptionStatus: 'active',
        isActive: true,
        accountExpiresAt: null
      },
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return;
    }

    console.log('✅ Superadmin user created successfully!');
    console.log('Email: admin@careercopilot.nl');
    console.log('Password: SuperAdmin2025!');
    console.log('User ID:', authData.user.id);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

createSuperAdmin();