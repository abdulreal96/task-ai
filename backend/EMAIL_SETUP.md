# Email Verification Setup (Resend)

## Steps to Get Your Resend API Key

1. **Sign Up for Resend**
   - Go to https://resend.com
   - Click "Sign Up" (Free tier includes 3,000 emails/month for first 30 days, then 100 emails/day)
   - Sign up with GitHub or email

2. **Get Your API Key**
   - After signing in, go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "Task AI Development")
   - Select permission: "Sending access"
   - Click "Add"
   - **Copy the API key** (starts with `re_`)

3. **Add API Key to Project**
   - Open `backend/.env.local`
   - Replace `your-resend-api-key-here` with your actual API key:
     ```
     RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
     ```
   - Save the file

4. **Verify Domain (Optional for Production)**
   - For development, you can use `onboarding@resend.dev` (default sender)
   - For production, verify your own domain at https://resend.com/domains

5. **Test Email Sending**
   - Register a new user in the app
   - Check your email for the 6-digit OTP code
   - OTP expires in 10 minutes

## Email Flow

1. User registers with fullName, email, password
2. Backend generates 6-digit OTP (expires in 10 minutes)
3. OTP saved to database
4. Email sent via Resend with OTP code
5. User enters OTP in verification screen
6. Backend verifies OTP and marks email as verified
7. User can now login

## API Endpoints

- `POST /auth/register` - Register with fullName, email, password
- `POST /auth/verify-otp` - Verify OTP with email and otp code
- `POST /auth/resend-otp` - Resend OTP if expired (60-second cooldown recommended in frontend)

## Troubleshooting

- **Email not received**: Check spam folder, verify API key is correct
- **"Failed to send verification email"**: Check Resend API key is set in `.env.local`
- **OTP expired**: Request new OTP via resend-otp endpoint
- **Invalid OTP**: Ensure 6-digit code matches exactly (case-sensitive)
