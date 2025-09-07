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
    
    let userId;
    
    if (userError || !localUser) {
      // Create local user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.first_name || '', // Use camelCase to match schema
          lastName: supabaseUser.user_metadata?.last_name || '', // Use camelCase to match schema
          supabaseUserId: supabaseUser.id // Use camelCase to match schema
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

    if (req.method === 'GET') {
      // Get all job applications for the user
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId) // Keep snake_case - this matches the schema
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to fetch applications' });
      }

      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      // Create new job application - map camelCase to snake_case
      const applicationData = {
        user_id: userId, // Keep snake_case - this matches the schema
        applied_roles: req.body.appliedRoles,
        company: req.body.company,
        apply_date: req.body.applyDate,
        where_applied: req.body.whereApplied,
        credentials_used: req.body.credentialsUsed || null,
        comments_information: req.body.commentsInformation || null,
        response: req.body.response || 'No Response',
        response_date: req.body.responseDate || null,
        location_city: req.body.locationCity || null,
        location_country: req.body.locationCountry || null,
        interview_comments: req.body.interviewComments || null
      };

      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to create application' });
      }

      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      // Update job application
      const { id, ...updateData } = req.body;
      
      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('job_applications')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing || existing.user_id !== userId) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Map camelCase to snake_case for update
      const mappedUpdateData = {
        applied_roles: updateData.appliedRoles,
        company: updateData.company,
        apply_date: updateData.applyDate,
        where_applied: updateData.whereApplied,
        credentials_used: updateData.credentialsUsed || null,
        comments_information: updateData.commentsInformation || null,
        response: updateData.response || 'No Response',
        response_date: updateData.responseDate || null,
        location_city: updateData.locationCity || null,
        location_country: updateData.locationCountry || null,
        interview_comments: updateData.interviewComments || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('job_applications')
        .update(mappedUpdateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to update application' });
      }

      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // Delete job application
      const { id } = req.query;
      
      const { data, error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Failed to delete application' });
      }

      return res.status(200).json({ message: 'Application deleted successfully' });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}