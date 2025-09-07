import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Use service key for database operations to ensure proper access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUserFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  return user;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || req.headers['Authorization'];
    const supabaseUser = await getUserFromToken(authHeader);
    
    // Look up local integer user ID using Supabase UUID as username
    const { data: localUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', supabaseUser.id)
      .single();
    
    if (userError || !localUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = localUser.id;

    // Delete the document (ensure user owns it)
    const { data, error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('userId', userId) // Use camelCase to match schema
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to delete document' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Document not found or unauthorized' });
    }

    return res.status(200).json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}