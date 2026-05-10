# Database Setup for Vercel Deployment

Your project has been migrated from SQLite to **PostgreSQL** to support serverless deployment on Vercel.

## Why PostgreSQL?

- ✅ **Vercel Compatible**: Cloud database, works with serverless functions
- ✅ **No Local Files**: Data persists in the cloud, not on ephemeral file system
- ✅ **SQL Database**: Same SQL syntax you're already using
- ✅ **Scalable**: Works with connection pooling for serverless

## Setup Steps

### 1. Choose a PostgreSQL Provider

Pick one of these options:

#### Option A: Vercel PostgreSQL (Recommended)
- Go to [Vercel Dashboard](https://vercel.com)
- Select your project → Storage → Create Database (PostgreSQL)
- Vercel will automatically add `DATABASE_URL` to your environment variables
- **No manual setup needed!**

#### Option B: Supabase (Free Tier)
- Sign up at [supabase.com](https://supabase.com)
- Create new project
- Go to Settings → Database → Connection String
- Copy the PostgreSQL connection string

#### Option C: Railway, Render, or other hosting
- Sign up and create PostgreSQL database
- Copy your connection string (format: `postgresql://user:password@host:port/database`)

### 2. Set Environment Variables

#### Local Development (Create `.env` in backend folder):
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/bookstore
JWT_SECRET=your-super-secret-key-change-this
PORT=5000
```

#### Vercel Deployment:
- If using Vercel PostgreSQL: **Done automatically** ✅
- If using external service: 
  1. Go to Vercel Project Settings → Environment Variables
  2. Add these variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `JWT_SECRET`: Your secret key

### 3. Install Dependencies

```bash
cd backend
npm install
```

This will install `pg` (PostgreSQL driver) instead of `sqlite3`.

### 4. Test Locally

```bash
npm start
```

The server will:
- Connect to your PostgreSQL database
- Automatically create all tables on first run
- Insert sample products
- Create default admin user (admin@bookstore.com / admin123)

If you see "Connected to PostgreSQL database" - You're good! ✅

### 5. Deploy to Vercel

```bash
vercel deploy
```

## Important Notes

### Default Admin User
- **Email**: admin@bookstore.com
- **Password**: admin123
- ⚠️ **CHANGE THIS in production!**

### Connection Pooling
The code uses connection pooling optimized for serverless:
- Max 2 simultaneous connections
- Automatic idle timeout
- Perfect for Vercel's ephemeral functions

### Environment Variables to Update
Before going to production, update in Vercel Settings:
```bash
JWT_SECRET=your-real-secret-key-here
```

## Troubleshooting

### Connection Refused
- Make sure `DATABASE_URL` environment variable is set correctly
- Test locally with `console.log(process.env.DATABASE_URL)`
- Check that your PostgreSQL server is running (if local)

### Tables Not Created
- Check database logs
- Verify user has permissions to CREATE TABLE
- Look for error messages in server console

### Old SQLite Database
- Your old `bookstore.db` file won't be used anymore
- All data is now in PostgreSQL cloud database
- You can safely delete `./bookstore.db` if it exists

## Migration Complete! 🎉

Your app now:
- ✅ Works on Vercel
- ✅ Uses cloud PostgreSQL (no local files)
- ✅ Has automatic connection pooling for serverless
- ✅ Maintains all SQL functionality

Next step: Deploy to Vercel and test!
