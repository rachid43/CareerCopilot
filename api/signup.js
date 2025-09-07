import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        firstName: firstName || '',
        lastName: lastName || '',
        first_name: firstName || '',
        last_name: lastName || '',
        role: 'user',
        isActive: true,
        subscriptionStatus: 'active',
        subscriptionTier: 'essential'
      },
      email_confirm: false // Skip email confirmation for development
    });

    if (error) {
      console.error('Signup error:', error);
      return res.status(400).json({ 
        error: error.message || 'Failed to create account'
      });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Return success - user will need to sign in separately
    return res.status(200).json({
      message: 'Account created successfully',
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}