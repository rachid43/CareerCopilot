// Direct test of Hostinger SMTP settings
import nodemailer from 'nodemailer';

async function testHostingerSMTP() {
  console.log('Testing Hostinger SMTP directly...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Password configured:', !!process.env.SMTP_PASSWORD);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT || '587') === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true // Log to console
    });

    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully!');

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'test@example.com',
      subject: 'Hostinger SMTP Test',
      text: 'This is a test email from Hostinger SMTP',
      html: '<h3>Hostinger SMTP Test</h3><p>This is a test email from Hostinger SMTP</p>'
    });

    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Hostinger SMTP test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testHostingerSMTP();
}

export { testHostingerSMTP };