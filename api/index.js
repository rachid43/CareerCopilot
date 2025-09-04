// Main API handler - removed complex Express app import
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'CareerCopilot API is working',
    timestamp: new Date().toISOString()
  });
}