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
    
    let userId;
    
    if (userError || !localUser) {
      // Create local user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.first_name || '',
          lastName: supabaseUser.user_metadata?.last_name || '',
          supabaseUserId: supabaseUser.id
        })
        .select('id')
        .single();
      
      if (createError || !newUser) {
        return res.status(404).json({ message: 'User not found and could not be created' });
      }
      userId = newUser.id;
    } else {
      userId = localUser.id;
    }

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

    const offers = applications.filter(app => app.response === 'Offer').length;
    const rejections = applications.filter(app => app.response === 'Rejected').length;
    const pendingResponse = applications.filter(app => 
      app.response === 'No Response' || app.response === 'Open'
    ).length;
    
    // Calculate follow-up reminders (applications older than 7 days without response)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const followUpReminders = applications.filter(app => {
      const applyDate = new Date(app.apply_date);
      return applyDate < sevenDaysAgo && (app.response === 'No Response' || app.response === 'Open');
    }).length;
    
    // Calculate late follow-ups (applications older than 14 days without response)  
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const lateFollowUps = applications.filter(app => {
      const applyDate = new Date(app.apply_date);
      return applyDate < fourteenDaysAgo && (app.response === 'No Response' || app.response === 'Open');
    }).length;
    
    const offerRate = totalApplications > 0 
      ? Math.round((offers / totalApplications) * 100) 
      : 0;

    const dashboardData = {
      totalApplications,
      totalResponses,
      interviews,
      offers,
      rejections,
      pendingResponse,
      followUpReminders,
      lateFollowUps,
      responseRate,
      interviewRate,
      offerRate
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