# SendGrid Configuration Diagnostic

## Current Issue
The SendGrid API key is returning 401 Unauthorized errors consistently, preventing email invitations from being sent.

## Troubleshooting Steps

### 1. Verify API Key Creation
- Go to https://app.sendgrid.com/settings/api_keys
- Create a new API key with these permissions:
  - **Mail Send**: Full Access (required for sending emails)
  - **Sender Verification**: Read Access (helpful for debugging)

### 2. Verify Sender Email Address
- Go to https://app.sendgrid.com/settings/sender_auth/senders
- Add and verify `info@maptheorie.nl` as a sender
- Complete email verification process

### 3. Test Configuration
After updating the API key and verifying the sender:
1. Update the SENDGRID_API_KEY secret in Replit
2. The application will automatically restart
3. Try sending an invitation from the admin panel

### 4. Common Issues
- **API Key Format**: Should start with "SG." and be ~76 characters long
- **Permissions**: Must have "Mail Send" permission enabled
- **Sender Verification**: From address must be verified in SendGrid
- **Account Status**: SendGrid account must be active and in good standing

### 5. Alternative Solutions
If SendGrid continues to fail:
- Consider using a different email service (Mailgun, AWS SES)
- Implement a fallback notification system
- Use SMTP instead of SendGrid API

## Current Configuration Status
- API Key: Present but returning 401 errors
- From Email: info@maptheorie.nl
- Error logs: Available in server console when sending invitations