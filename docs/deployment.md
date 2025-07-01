# Citizenly MVP - 5-Minute Deployment Guide

Deploy Citizenly to production in under 5 minutes using Vercel + Supabase.

## 🚀 Quick Deployment (Recommended)

### Step 1: Set Up Database (2 minutes)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub (recommended)

2. **Create New Project**
   - Click "New Project"
   - Choose organization (or create one)
   - Project name: `citizenly-mvp`
   - Database password: Generate strong password
   - Region: Choose closest to your users
   - Click "Create new project"

3. **Get Database URL**
   - Wait for project creation (1-2 minutes)
   - Go to Settings → Database
   - Copy "Connection string" under "Connection parameters"
   - Replace `[YOUR-PASSWORD]` with your database password

4. **Set Up Database Schema**
   - Go to SQL Editor in Supabase
   - Click "New Query"
   - Copy contents of `database/schema.sql` and paste
   - Click "Run" to execute

### Step 2: Deploy to Vercel (2 minutes)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial Citizenly MVP setup"
   git remote add origin https://github.com/yourusername/citizenly-mvp.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "Import Project"
   - Select your `citizenly-mvp` repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - In Vercel dashboard, go to your project
   - Click Settings → Environment Variables
   - Add the following variables:

   ```bash
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=your-32-character-secret-key
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   MOCK_VERIFICATION=true
   ```

4. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment

### Step 3: Verify Deployment (1 minute)

1. **Check Health**
   - Visit `https://your-app.vercel.app/api/health`
   - Should return `{"status":"healthy"}`

2. **Test Application**
   - Visit your app URL
   - Click "Get Started" to register
   - Test with Nevada address

3. **Access Test Accounts**
   - Admin: `admin@citizenly.com` / `admin123`
   - Citizen: `citizen@test.com` / `password123`

## ✅ Success! Your app is live!

## 🔧 Optional Enhancements

### Add Google Maps API (Address Verification)

1. **Get API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Maps JavaScript API, Geocoding API
   - Create API Key

2. **Add to Vercel**
   ```bash
   GOOGLE_MAPS_API_KEY=your-google-maps-key
   MOCK_VERIFICATION=false
   ```

### Add Email Service (SendGrid)

1. **Get SendGrid API Key**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create API Key

2. **Add to Vercel**
   ```bash
   SMTP_PASSWORD=your-sendgrid-key
   FROM_EMAIL=noreply@yourdomain.com
   ```

### Custom Domain

1. **Add Domain in Vercel**
   - Go to Settings → Domains
   - Add your domain
   - Follow DNS configuration

2. **Update Environment**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

## 🛟 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project is not paused
- Ensure IP restrictions allow Vercel

### Build Failures
- Check environment variables are set
- Verify all required variables from `.env.example`
- Check Vercel build logs

### Runtime Errors
- Check `/api/health` endpoint
- Review Vercel function logs
- Verify database schema is applied

## 💰 Cost Breakdown

### Free Tier (Perfect for MVP)
- **Vercel**: Free for hobby projects
- **Supabase**: 500MB database, 50MB file storage
- **Total**: $0/month for development and small scale

### Paid Tier (When You Scale)
- **Vercel Pro**: $20/month (team features, analytics)
- **Supabase Pro**: $25/month (8GB database, 100GB storage)
- **Total**: $45/month for production-ready scale

## 🔄 Continuous Deployment

Once set up, any push to `main` branch automatically deploys:

```bash
git add .
git commit -m "Add new feature"
git push origin main
# Automatically deploys to Vercel
```

## 📊 Monitoring

### Built-in Monitoring
- Vercel Analytics (included)
- Supabase Dashboard
- Application logs in Vercel

### Health Checks
- `/api/health` - Application status
- Vercel automatically monitors uptime
- Supabase monitors database health

## 🚀 Production Checklist

Before going live with real users:

- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure Google Maps API for address verification
- [ ] Set up SendGrid for email notifications
- [ ] Add custom domain
- [ ] Set MOCK_VERIFICATION=false
- [ ] Configure monitoring and alerts
- [ ] Test all user flows
- [ ] Review security settings

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Citizenly GitHub](https://github.com/yourusername/citizenly-mvp)

---

**Need help?** Create an issue in the GitHub repository or contact team@citizenly.com
