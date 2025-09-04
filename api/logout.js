// Supabase Authentication - Logout endpoint
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ 
        message: 'Logged out successfully',
        clearSession: true 
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // GET request - sign out and redirect to landing page
  if (req.method === 'GET') {
    try {
      await supabase.auth.signOut();
      res.writeHead(302, { Location: '/' });
      res.end();
    } catch (error) {
      console.error('Logout error:', error);
      res.writeHead(302, { Location: '/' });
      res.end();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}