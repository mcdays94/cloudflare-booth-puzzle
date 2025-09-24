# Cloudflare Turnstile Setup Guide

## Overview
This guide explains how to configure Cloudflare Turnstile for the booth puzzle application to protect against bot submissions.

## Prerequisites
- Cloudflare account with Turnstile access
- Deployed Cloudflare Workers application

## Setup Steps

### 1. Create Turnstile Site
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to "Turnstile" in the left sidebar
3. Click "Add Site"
4. Configure your site:
   - **Site name**: Cloudflare Booth Puzzle
   - **Domain**: Your worker domain (e.g., `your-worker.your-subdomain.workers.dev`)
   - **Widget mode**: Managed (recommended)
   - **Pre-clearance**: Disabled (recommended for this use case)

### 2. Get Your Keys
After creating the site, you'll receive:
- **Site Key**: Set as environment secret `TURNSTILE_SITE_KEY`
- **Secret Key**: Set as environment secret `TURNSTILE_SECRET_KEY`

### 3. Configure Keys as Secrets
Set both keys as Wrangler secrets (recommended for production):

```bash
wrangler secret put TURNSTILE_SITE_KEY
wrangler secret put TURNSTILE_SECRET_KEY
```

### 4. Deploy
Deploy your updated application:
```bash
wrangler deploy
```

## How It Works

### Frontend Protection
- Turnstile widget appears below the email field
- Submit button is disabled until verification completes
- JavaScript callback `onTurnstileSuccess()` enables the submit button
- Form submission includes the Turnstile token

### Backend Validation
- Server receives Turnstile token with form data
- Makes verification request to Cloudflare's siteverify API
- Rejects submissions with invalid or missing tokens
- Only processes verified submissions

## Testing
1. Navigate to a puzzle submission page
2. Fill out the form fields
3. Complete the Turnstile challenge
4. Submit button should become enabled
5. Form submission should work normally

## Troubleshooting

### Common Issues
- **Submit button stays disabled**: Check browser console for JavaScript errors
- **"Turnstile verification failed"**: Verify secret key is correct
- **Widget not loading**: Check site key and domain configuration

### Debug Steps
1. Check browser console for errors
2. Verify Turnstile site configuration matches your domain
3. Confirm secret key is properly set in environment
4. Test with different browsers/devices

## Security Notes
- Never expose the secret key in client-side code
- Use Wrangler secrets for production deployments
- Monitor Turnstile analytics in Cloudflare Dashboard
- Consider rate limiting for additional protection
