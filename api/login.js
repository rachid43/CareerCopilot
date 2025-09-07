// Login endpoint for Supabase authentication
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ 
        message: error.message || 'Invalid credentials'
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Return the session data that the frontend expects
    return res.status(200).json({
      user: {
        id: data.user.id,
        username: data.user.id, // Use Supabase user ID as username
        email: data.user.email,
        firstName: data.user.user_metadata?.firstName || data.user.user_metadata?.first_name || '',
        lastName: data.user.user_metadata?.lastName || data.user.user_metadata?.last_name || '',
        role: data.user.user_metadata?.role || 'user',
        isActive: data.user.user_metadata?.isActive ?? true,
        subscriptionStatus: data.user.user_metadata?.subscriptionStatus || 'active',
        subscriptionTier: data.user.user_metadata?.subscriptionTier || 'essential',
        accountExpiresAt: data.user.user_metadata?.accountExpiresAt || null,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}