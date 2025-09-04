// Supabase Authentication - User endpoint
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      // Return user data
      return res.status(200).json({
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        role: user.user_metadata?.role || 'user',
        subscriptionTier: user.user_metadata?.subscriptionTier || 'essential',
        isActive: true,
        accountExpiresAt: user.user_metadata?.accountExpiresAt || null
      });
      
    } catch (error) {
      console.error('User verification error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}