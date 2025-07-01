# Citizenly Supabase Security Setup Guide

## 🔑 **Required Keys & Security Configuration**

### **1. Keys You Need from Supabase**

Go to your Supabase project → **Settings** → **API**:

| Key | Usage | Security Level | Where to Use |
|-----|-------|----------------|--------------|
| `SUPABASE_URL` | API endpoint | ✅ Public | Client & Server |
| `SUPABASE_ANON_KEY` | Client operations | ✅ Public | Client-side (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | 🔒 **PRIVATE** | Server-side only (bypasses RLS) |
| `DATABASE_URL` | Direct DB connection | 🔒 **PRIVATE** | Server-side migrations |

### **2. Environment Variables Setup**

```bash
# Public (safe for client-side)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

## 🛡️ **Row Level Security (RLS) Configuration**

### **Why RLS Matters**
- **SUPABASE_ANON_KEY**: Can only access data allowed by RLS policies
- **SUPABASE_SERVICE_ROLE_KEY**: Bypasses all RLS (admin access)
- **Client-side requests**: Always use anon key, respect user permissions

### **Current RLS Policies**

Our schema includes these security policies:

#### **Users Table**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users FOR SELECT 
USING (EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'));
```

#### **Addresses Table**
```sql
-- Users can only manage their own addresses
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
```

#### **Politicians Table**
```sql
-- Politicians can manage their own data
CREATE POLICY "Politicians can manage own data" ON politicians FOR ALL 
USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Public can view verified politicians
CREATE POLICY "Public can view verified politicians" ON politicians FOR SELECT 
USING (is_verified = true);
```

## 🔧 **Required Supabase Dashboard Configuration**

### **1. Authentication Settings**

Go to **Authentication** → **Settings**:

```bash
# Site URL (for redirects)
Site URL: https://your-domain.com

# Additional redirect URLs (for development)
Redirect URLs: 
- http://localhost:3000
- https://your-staging-domain.com

# Email confirmation
Enable email confirmations: ✅ ON
Enable phone confirmations: ❌ OFF (for MVP)

# Password requirements
Minimum password length: 8
```

### **2. Email Templates**

Go to **Authentication** → **Email Templates**:

#### **Confirmation Email**
```html
<h2>Welcome to Citizenly!</h2>
<p>Thanks for signing up. Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>If you didn't sign up for Citizenly, you can safely ignore this email.</p>
```

#### **Password Reset Email**
```html
<h2>Reset your Citizenly password</h2>
<p>Follow this link to reset the password for your account:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### **3. Database Policies**

Go to **Authentication** → **Policies**:

✅ **Enable RLS on all tables**:
- `users` ✅ Enabled
- `addresses` ✅ Enabled  
- `politicians` ✅ Enabled
- `verification_attempts` ✅ Enabled
- `sessions` ✅ Enabled
- `polls` ✅ Enabled
- `poll_responses` ✅ Enabled

## 🚨 **Critical Security Settings**

### **1. API Key Restrictions**

#### **SUPABASE_ANON_KEY (Public)**
- ✅ Can be exposed in client-side code
- ✅ Respects RLS policies
- ✅ Safe for frontend applications
- ❌ Cannot bypass security rules

#### **SUPABASE_SERVICE_ROLE_KEY (Private)**
- 🔒 **NEVER expose in client-side code**
- 🔒 Server-side operations only
- 🔒 Bypasses all RLS policies
- 🔒 Full database access

### **2. Network Security**

Configure in **Settings** → **API**:

```bash
# API Gateway
Enable API Gateway: ✅ ON

# Rate limiting (important for civic platform)
Requests per minute: 100 (adjust based on needs)

# CORS settings (for web app)
Allowed origins: 
- https://your-domain.com
- http://localhost:3000 (development only)
```

### **3. Database Access**

Configure in **Settings** → **Database**:

```bash
# Connection pooling
Connection pooling: ✅ Enabled
Pool size: 15 (default)

# SSL enforcement
SSL enforcement: ✅ Required

# IP restrictions (production)
Restrict to specific IPs: Configure for production
```

## 🛠️ **Setup Checklist**

### **Phase 1: Basic Setup**
- [ ] Get Supabase project URL and API keys
- [ ] Add environment variables to `.env`
- [ ] Run `npm run db:setup:supabase`
- [ ] Execute `database/supabase-schema.sql` in SQL Editor
- [ ] Verify tables exist in Table Editor

### **Phase 2: Authentication**
- [ ] Configure Site URL and redirect URLs
- [ ] Customize email templates
- [ ] Test user registration flow
- [ ] Verify RLS policies are working

### **Phase 3: Production Security**
- [ ] Set up IP restrictions
- [ ] Configure rate limiting
- [ ] Enable database backups
- [ ] Set up monitoring alerts
- [ ] Review and test all RLS policies

## 🔍 **Testing Security**

### **Test RLS Policies**

1. **Create test user in Supabase Auth**
2. **Try accessing data with anon key**:
```javascript
// Should only return user's own data
const { data } = await supabase
  .from('users')
  .select('*')
```

3. **Verify policy enforcement**:
```javascript
// Should fail - can't access other users' data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', 'other-user-id')
```

### **Test Authentication Flow**

1. **Registration**: `supabase.auth.signUp()`
2. **Email confirmation**: Check email templates work
3. **Login**: `supabase.auth.signInWithPassword()`
4. **Password reset**: `supabase.auth.resetPasswordForEmail()`

## 🚨 **Common Security Issues**

### **1. Service Role Key Exposure**
❌ **NEVER do this**:
```javascript
// Client-side code (WRONG!)
const supabase = createClient(url, SERVICE_ROLE_KEY) // 🔥 DANGEROUS!
```

✅ **Always do this**:
```javascript
// Client-side code (CORRECT)
const supabase = createClient(url, ANON_KEY) // ✅ Safe

// Server-side code only
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY) // ✅ Safe on server
```

### **2. RLS Policy Gaps**
- Always test policies with different user roles
- Ensure policies cover INSERT, UPDATE, DELETE operations
- Test edge cases (deleted users, deactivated accounts)

### **3. CORS Misconfiguration**
- Restrict origins to your actual domains
- Don't use `*` wildcard in production
- Test from different domains to verify restrictions

## 📊 **Monitoring & Alerts**

Set up in **Settings** → **Integrations**:

1. **Database performance monitoring**
2. **Authentication attempt alerts**
3. **API usage monitoring**
4. **Error rate tracking**

## 🆘 **Emergency Response**

If security is compromised:

1. **Rotate API keys** immediately in Supabase dashboard
2. **Update environment variables** in all deployments
3. **Review audit logs** for suspicious activity
4. **Check RLS policies** for potential bypasses
5. **Force password reset** for affected users

---

**🔒 Remember: Security is not optional for civic platforms. Citizens trust us with their data.**
