## QUICK START GUIDE

### 🚀 Getting Started (5 minutes)

**Step 0: Database Setup** ⚠️ NEW!
1. Read [DATABASE_SETUP.md](DATABASE_SETUP.md) for PostgreSQL configuration
2. Create `.env` file in `backend/` folder (copy from `.env.example`)
3. Add your PostgreSQL connection string to `.env`

**Step 1: Backend Setup**
1. Open PowerShell/Terminal
2. Navigate to: `d:\Ecommerce_website\backend`
3. Run: `npm install`
4. Run: `npm start`
5. You should see: "Connected to PostgreSQL database" and "Server running on http://localhost:5000"

**Step 2: Frontend Access**
1. Open your browser
2. Go to: `http://localhost:5000` (the backend now serves the frontend)
   
   OR if you want to run frontend separately:
   - Open PowerShell in: `d:\Ecommerce_website\frontend`
   - Run: `python -m http.server 8000`
   - Visit: `http://localhost:8000`

**Step 3: Test the System**

1. **Login with Admin Account:**
   - Email: `admin@bookstore.com`
   - Password: `admin123`
   
   OR **Register a New User Account:**
   - Click "Register"
   - Fill in: Name, Email, Password
   - Submit

2. **Browse & Search Products:**
   - Click "Products"
   - Try searching for "1984" or "Gatsby"
   - Click "View" on any book

3. **Add to Cart:**
   - Increase quantity if needed
   - Click "Add to Cart"
   - See count update in navbar

4. **Checkout:**
   - Click "Cart"
   - Review items
   - Click "Proceed to Checkout"

5. **View Orders:**
   - Click "Orders" to see purchase history

6. **Admin Features:**
   - When logged in as admin, you'll have access to admin panel
   - Manage products, view all orders, etc.

---

### 📝 To Create an Admin Account (for testing)

Edit `backend/server.js`:

**Find this code (around line 56):**
```javascript
db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
```

**Change it to:**
```javascript
db.run(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
```

**Find the VALUES section and change:**
```javascript
[email, hashedPassword, name],
```

**To:**
```javascript
[email, hashedPassword, name, (email === 'admin@test.com' ? 'admin' : 'user')],
```

Then register with email: `admin@test.com` and you'll get admin access.

---

### 🛠️ Easy Customizations

**Change Colors:**
- Open: `frontend/css/styles.css`
- Find: `#3498db` (main blue) and replace with your color
- Or find: `#e74c3c` (red) for accents

**Change Store Name:**
- Open: `frontend/index.html`
- Find: `<h1>📚 BookStore</h1>`
- Change to your store name

**Add Sample Products:**
- The database auto-adds 6 sample books on first run
- To add more manually, use the admin panel

**Change Port:**
- Open: `backend/server.js`
- Find: `const PORT = 5000;`
- Change 5000 to any unused port

---

### 🐛 Quick Troubleshooting

**"Cannot find module"**
- Run `npm install` in backend folder

**"Port 5000 already in use"**
- Change PORT in server.js or kill the process using port 5000

**Frontend not connecting to backend**
- Check: Is `node server.js` running?
- Check: Are you on http://localhost:5000?

**No products showing**
- Wait 5 seconds for database to initialize
- Refresh the page

---

### 📚 Database File
- Location: `backend/bookstore.db`
- Auto-created on first server run
- Delete it anytime to reset (will recreate with sample data)

---

**Ready to go! Start the server and enjoy building!** 🎉
