// User API endpoint for Vercel
export default function handler(req, res) {
  if (req.method === 'GET') {
    // Check for demo authentication cookie
    const cookies = req.headers.cookie || '';
    const isAuthenticated = cookies.includes('demo-auth=true');
    
    if (isAuthenticated) {
      // Return demo user data
      res.json({
        id: 'demo-user',
        username: 'demo-user',
        email: 'demo@careercopilot.nl',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user',
        subscriptionTier: 'professional',
        isActive: true,
        accountExpiresAt: null
      });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}