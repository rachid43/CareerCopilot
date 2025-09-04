// Supabase Authentication - Signup endpoint
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: firstName || '',
            lastName: lastName || '',
            role: 'user',
            subscriptionTier: 'essential'
          }
        }
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(200).json({ 
        user: data.user,
        session: data.session,
        message: 'Please check your email to confirm your account'
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}