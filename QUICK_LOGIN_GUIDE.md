# 🔑 Admin Login - Quick Reference

## ✅ Admin Credentials (WORKING)

```
Email:    admin@adafashion.com  
Password: admin123
```

## 🚀 Quick Start

### Step 1: Configure Database (in `server/.env`)

Choose ONE of these:

**Local MySQL:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=adafashion
```

**Supabase (Recommended):**
```env
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
```

### Step 2: Install & Start

```bash
# Install if needed
cd c:\PROJETOS\AdaFashion
npm install
cd server && npm install

# Start server
npm run dev
```

### Step 3: Login

Open browser: **http://localhost:4000/admin**

Use the credentials above.

## 🧪 Verify It Works

```bash
# Test authentication
npm run test-admin

# Test login endpoint
npm run test-login

# See configuration status
npm run setup
```

## ✨ Features

✅ Works even if database is temporarily down (fallback mode)  
✅ Auto-creates admin user on first server start  
✅ Supports local MySQL, Supabase PostgreSQL, or InfinityFree  
✅ Secure password hashing ready  
✅ Full role-based access control  

## 📁 Important Files

- `server/.env` - Your database configuration
- `server/index.js` - Backend API server
- `src/pages/admin/Login.jsx` - Admin login page

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Serviço indisponível" | Database not running - check `.env` config |
| "Credenciais inválidas" | Use exact email/password above |
| Server won't start | Run `npm install` in both root and `server` folders |

## 📚 Full Documentation

See `AUTHENTICATION_FIXED_SUMMARY.md` for complete details.

---

**Status:** ✅ FIXED AND TESTED  
**Ready to use!** 🎉
