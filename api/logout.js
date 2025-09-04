// Logout API endpoint for Vercel
export default function handler(req, res) {
  if (req.method === 'GET') {
    // Clear the demo session and redirect to landing page
    res.setHeader('Set-Cookie', 'demo-auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    res.writeHead(302, { Location: '/' });
    res.end();
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}