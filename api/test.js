// Simple test endpoint to debug the issue
export default async function handler(req, res) {
  try {
    // Check if environment variables are available
    const envCheck = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      method: req.method,
      body: req.body
    };
    
    res.status(200).json({
      message: 'API is working',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test endpoint failed',
      message: error.message
    });
  }
}