// Login API endpoint for Vercel
export default function handler(req, res) {
  // For demo purposes, redirect to the home page with a simulated login
  // In production, this would integrate with your actual auth provider
  
  if (req.method === 'GET') {
    // Simulate successful authentication by setting a simple session indicator
    // and redirecting to home page
    res.setHeader('Set-Cookie', 'demo-auth=true; Path=/; HttpOnly; SameSite=Strict');
    res.writeHead(302, { Location: '/' });
    res.end();
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}