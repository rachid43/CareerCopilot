// Updated auth endpoint to handle Supabase authentication
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get the authorization header (handle case-sensitivity for Vercel)
      const authHeader = req.headers.authorization || req.headers['Authorization'];
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Return user data in the format expected by the frontend
      return res.status(200).json({
        id: user.id,
        username: user.id, // Use Supabase user ID as username
        email: user.email,
        firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'user',
        isActive: user.user_metadata?.isActive ?? true,
        subscriptionStatus: user.user_metadata?.subscriptionStatus || 'active',
        subscriptionTier: user.user_metadata?.subscriptionTier || 'essential',
        accountExpiresAt: user.user_metadata?.accountExpiresAt || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}