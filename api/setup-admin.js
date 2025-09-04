// Setup SuperAdmin endpoint - for initial setup only
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create the superadmin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        firstName: firstName || 'Super',
        lastName: lastName || 'Admin',
        role: 'superadmin',
        subscriptionTier: 'elite',
        subscriptionStatus: 'active',
        isActive: true,
        accountExpiresAt: null
      },
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return res.status(400).json({ error: authError.message });
    }

    return res.status(200).json({
      message: 'Superadmin user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'superadmin'
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}