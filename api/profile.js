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

    if (req.method === 'GET') {
      // Get user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to fetch profile' });
      }

      return res.status(200).json(data || {});
    }

    if (req.method === 'POST') {
      // Create or update user profile
      const profileData = {
        userId: userId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        position: req.body.position,
        skills: req.body.skills,
        experience: req.body.experience,
        languages: req.body.languages,
        sessionId: supabaseUser.id // Use Supabase UUID as sessionId
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'userId' })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to save profile' });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(401).json({ message: error.message });
  }
}