# 📚 BookStore Ecommerce Website

A complete, simple-to-edit ecommerce bookstore built with HTML, CSS, JavaScript (frontend) and Node.js (backend) with SQLite database.

## Features

✅ **User Features:**
- User Registration & Login
- Browse Products (with search & filtering)
- View Product Details
- Add to Shopping Cart
- Manage Cart (update quantity, remove items)
- Checkout & Place Orders
- View Order History

✅ **Admin Features:**
- Add New Books
- Update Product Stock & Details
- Delete Products
- View All Inventory

## Project Structure

```
Ecommerce_website/
├── frontend/
│   ├── index.html              # Home page
│   ├── products.html           # Products listing page
│   ├── product.html            # Product detail page
│   ├── cart.html               # Shopping cart
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── orders.html             # Order history
│   ├── admin.html              # Admin panel
│   ├── css/
│   │   └── styles.css          # All styling
│   └── js/
│       └── app.js              # Frontend logic
└── backend/
    ├── package.json            # Node.js dependencies
    ├── server.js               # Express server & API
    └── bookstore.db            # SQLite database (auto-created)
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Backend Setup

1. **Open terminal in the backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Open the frontend folder in your browser:**
   - Simply open `frontend/index.html` in your browser
   - Or use a local server (recommended):
     ```bash
     # If you have Python 3 installed:
     python -m http.server 8000
     ```
     Then visit `http://localhost:8000`

## How to Use

### For Users

1. **Register**: Click "Register" → Fill form → Submit
2. **Login**: Click "Login" → Enter credentials
3. **Browse**: Go to "Products" page
4. **Search**: Use search bar to find books by title or author
5. **Filter**: Filter by category
6. **Add to Cart**: Click "View" on a book → Click "Add to Cart"
7. **Checkout**: Go to "Cart" → Click "Proceed to Checkout"
8. **View Orders**: Click "Orders" to see history

### For Admins

1. **Login** with admin account (currently need to add admin manually in database)
2. **Go to Admin Panel** (button appears after login for admins)
3. **Add Books**: Fill the form and click "Add Product"
4. **Manage Stock**: Delete products with the delete button
5. **View Inventory**: See all products in the table

### To Make Admin Account

Edit the database or modify the registration to add an admin. For now:

1. Open `backend/server.js`
2. Find the registration code and change default role or manually add admin user

## Database Schema

### Users Table
- id (Primary Key)
- email (Unique)
- password (Hashed)
- name
- role (user/admin)
- created_at

### Products Table
- id (Primary Key)
- title
- author
- price
- description
- stock
- category
- image_url
- created_at

### Cart Table
- id (Primary Key)
- user_id (Foreign Key)
- product_id (Foreign Key)
- quantity

### Orders Table
- id (Primary Key)
- user_id (Foreign Key)
- total_price
- status
- created_at

### Order Items Table
- id (Primary Key)
- order_id (Foreign Key)
- product_id (Foreign Key)
- quantity
- price

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Product Routes
- `GET /api/products` - Get all products (supports search & category filter)
- `GET /api/products/:id` - Get product details

### Cart Routes
- `GET /api/cart` - Get user's cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:cartId` - Update cart item quantity
- `DELETE /api/cart/:cartId` - Remove item from cart

### Order Routes
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user's orders

### Admin Routes
- `POST /api/admin/products` - Add new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/products` - Get all products (admin view)

## Customization Guide

### Modify Colors
Open `frontend/css/styles.css` and change the color values:
- Primary color: `#3498db`
- Secondary color: `#2c3e50`
- Accent color: `#e74c3c`

### Modify Database
Edit `backend/server.js` lines 15-70 to change table structure or fields

### Add New Features
1. **Backend**: Add new routes in `server.js`
2. **Frontend**: Add new HTML pages and JavaScript functions

### Connect to Remote Database
Replace SQLite connection in `server.js` with your database connection string

## Security Notes

⚠️ **For Production Use:**
1. Change `JWT_SECRET` in `server.js` to a strong random string
2. Use HTTPS instead of HTTP
3. Add input validation and sanitization
4. Use environment variables for sensitive data
5. Add CORS restrictions
6. Implement rate limiting

## Troubleshooting

**Error: "Cannot find module 'express'"**
- Solution: Run `npm install` in the backend folder

**Error: "Port 5000 already in use"**
- Solution: Change PORT in `server.js` to another number like 5001

**Frontend shows "Connection refused"**
- Solution: Make sure backend server is running on localhost:5000

**No products showing**
- Solution: Wait a moment for the backend to create the database and add sample products

## Sample Products

The system comes with 6 sample books:
- The Great Gatsby
- To Kill a Mockingbird
- 1984
- Pride and Prejudice
- The Catcher in the Rye
- Sapiens

## License

This project is open source and free to use.

## Support

For issues or questions, check the code comments in the files. The code is intentionally simple and well-commented for easy editing.

---

**Happy Coding! 📚**
