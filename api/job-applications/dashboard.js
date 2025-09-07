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
  if (req.method !== 'GET') {
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

    // Get all applications for dashboard metrics
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }

    const totalApplications = applications.length;
    const totalResponses = applications.filter(app => 
      app.response && app.response !== 'No Response'
    ).length;
    const interviews = applications.filter(app => 
      app.response === 'Interview' || app.response === 'Under Interview'
    ).length;
    
    const responseRate = totalApplications > 0 
      ? Math.round((totalResponses / totalApplications) * 100) 
      : 0;
    const interviewRate = totalApplications > 0 
      ? Math.round((interviews / totalApplications) * 100) 
      : 0;

    const dashboardData = {
      totalApplications,
      totalResponses,
      interviews,
      responseRate,
      interviewRate
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}