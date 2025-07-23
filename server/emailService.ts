import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateInvitationEmail(email: string, token: string, inviterName: string): EmailParams {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'careercopilot.replit.app'}`;
  const inviteUrl = `${baseUrl}/invite/${token}`;
  
  return {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com', // Note: You may need to verify this domain in SendGrid
    subject: 'Welcome to CareerCopilot - Complete Your Account Setup',
    text: `
Hello,

You've been invited by ${inviterName} to join CareerCopilot, an AI-powered career assistant.

To complete your account setup, please visit: ${inviteUrl}

This invitation will expire in 30 days.

Best regards,
CareerCopilot Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #F08A5D;">Welcome to CareerCopilot!</h2>
  
  <p>Hello,</p>
  
  <p>You've been invited by <strong>${inviterName}</strong> to join CareerCopilot, an AI-powered career assistant that helps you create, review, and assess CVs and cover letters.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" 
       style="background-color: #F08A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Complete Account Setup
    </a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="background-color: #f5f5f5; padding: 10px; border-radius: 3px; word-break: break-all;">
    ${inviteUrl}
  </p>
  
  <p><small>This invitation will expire in 30 days.</small></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #666; font-size: 12px;">
    Best regards,<br>
    CareerCopilot Team
  </p>
</div>
    `
  };
}