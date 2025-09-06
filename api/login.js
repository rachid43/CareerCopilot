// Supabase Authentication - Login endpoint
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Domain debugging
      console.log('🔐 API LOGIN REQUEST:', {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent']?.substring(0, 50)
      });

      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      return res.status(200).json({ 
        user: data.user,
        session: data.session 
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // GET request - redirect to sign-in with magic link option
  if (req.method === 'GET') {
    // For now, redirect to home page
    // In production, you'd redirect to your auth UI
    res.writeHead(302, { Location: '/' });
    res.end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}