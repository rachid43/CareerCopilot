import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// SMTP Email Service using Hostinger SMTP
export async function sendEmailSMTP(params: EmailParams): Promise<boolean> {
  try {
    console.log('Sending email with Hostinger SMTP...');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);

    if (!process.env.SMTP_PASSWORD || !process.env.SMTP_HOST) {
      console.error('Hostinger SMTP credentials not configured');
      return false;
    }
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000, // 10 seconds connection timeout
      greetingTimeout: 5000,    // 5 seconds greeting timeout  
      socketTimeout: 15000,     // 15 seconds socket timeout
      tls: {
        rejectUnauthorized: false
      },
      pool: true,               // Use connection pooling
      maxConnections: 5,        // Max 5 concurrent connections
      maxMessages: 100,         // Max 100 messages per connection
    });
    
    // Add timeout wrapper for the entire operation
    const emailPromise = transporter.sendMail({
      from: process.env.SMTP_USER,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    // Race against timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email timeout after 20 seconds')), 20000)
    );

    await Promise.race([emailPromise, timeoutPromise]);

    console.log('Email sent successfully via Hostinger SMTP');
    return true;
  } catch (error: any) {
    console.error('Hostinger SMTP email error:', error.message);
    return false;
  }
}

// Email service using only Hostinger SMTP
export async function sendEmailWithFallback(params: EmailParams): Promise<boolean> {
  console.log('Using Hostinger SMTP for email delivery...');
  return await sendEmailSMTP(params);
}

export function generateInvitationEmail(email: string, token: string, inviterName: string): EmailParams {
  // Always use the Replit domain for invitation links to ensure accessibility
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
    : 'https://careercopilot.replit.app';
  const inviteUrl = `${baseUrl}/invite/${token}`;
  
  return {
    to: email,
    from: process.env.SMTP_USER || 'info@maptheorie.nl',
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
  
  <p>You've been invited by <strong>${inviterName}</strong> to join CareerCopilot, an AI-powered career assistant that helps you create outstanding CVs and cover letters.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="background-color: #F08A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Account Setup</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
  
  <p><strong>Important:</strong> This invitation will expire in 30 days.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #666; font-size: 12px;">
    Best regards,<br>
    CareerCopilot Team<br>
    <a href="mailto:info@maptheorie.nl">info@maptheorie.nl</a>
  </p>
</div>
    `,
  };
}