# Google OAuth Setup Guide for Chapturs

This guide will help you set up Google OAuth authentication for the Chapturs platform.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select an existing project
3. Give your project a name like "Chapturs Auth"
4. Note down your Project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" 
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Chapturs
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Save and continue through the scopes (you can skip adding scopes for now)
5. Add test users if needed (your own email for testing)

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Give it a name like "Chapturs Web Client"
5. Add Authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
6. Click "Create"

## Step 5: Copy Your Credentials

After creating the OAuth client, you'll see a dialog with:
- **Client ID**: Looks like `xxxxx-xxxxx.apps.googleusercontent.com`
- **Client Secret**: A random string

## Step 6: Update Environment Variables

Update your `.env.local` file with the real credentials:

```bash
AUTH_SECRET="4Rp5H8TZDRT6Rv7Ixk4DBJaAemCMo0o4NZco4qdzyQU="

# Replace these with your actual Google OAuth credentials
AUTH_GOOGLE_ID="your-actual-client-id.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-actual-client-secret"

NEXTAUTH_URL="http://localhost:3000"
```

## Step 7: Test Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign In" in the sidebar
4. You should be redirected to Google's OAuth consent screen
5. After granting permission, you'll be redirected back to your app

## Security Notes

- Never commit your `.env.local` file to version control
- The client secret should be kept secure
- For production, make sure to set up proper authorized domains
- Consider setting up domain verification in Google Cloud Console

## Troubleshooting

### "redirect_uri_mismatch" Error
- Make sure the redirect URI in Google Cloud Console exactly matches `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or typos

### "access_denied" Error  
- Make sure the OAuth consent screen is properly configured
- Check that your email is added as a test user if the app is still in testing mode

### "invalid_client" Error
- Verify your client ID and client secret are correct
- Make sure there are no extra spaces in the environment variables

## Production Deployment

When deploying to production:
1. Update `NEXTAUTH_URL` to your production domain
2. Add your production domain to authorized redirect URIs
3. Update any other environment-specific settings
4. Consider publishing your OAuth consent screen (removing "Testing" mode)
