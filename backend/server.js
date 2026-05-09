const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const db = new sqlite3.Database('./bookstore.db', (err) => {
  if (err) {
    console.error('Database opening error: ', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        profile_image TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart table
    db.run(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);

    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);

    // Insert sample products if table is empty
    db.all('SELECT COUNT(*) as count FROM products', (err, rows) => {
      if (rows && rows[0].count === 0) {
        const sampleProducts = [
          ['The Great Gatsby', 'F. Scott Fitzgerald', 12.99, 'A classic American novel', 50, 'Fiction', 'https://picsum.photos/200/300?random=1'],
          ['To Kill a Mockingbird', 'Harper Lee', 14.99, 'A gripping tale of racial injustice', 40, 'Fiction', 'https://picsum.photos/200/300?random=2'],
          ['1984', 'George Orwell', 13.99, 'A dystopian novel about totalitarianism', 35, 'Fiction', 'https://picsum.photos/200/300?random=3'],
          ['Pride and Prejudice', 'Jane Austen', 11.99, 'A romantic novel set in Georgian England', 45, 'Romance', 'https://picsum.photos/200/300?random=4'],
          ['The Catcher in the Rye', 'J.D. Salinger', 13.99, 'A story of teenage rebellion', 30, 'Fiction', 'https://picsum.photos/200/300?random=5'],
          ['Sapiens', 'Yuval Noah Harari', 18.99, 'A brief history of humankind', 60, 'Non-fiction', 'https://picsum.photos/200/300?random=6']
        ];

        sampleProducts.forEach(product => {
          db.run('INSERT INTO products (title, author, price, description, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)', product);
        });
      }
    });

    // Create default admin user if not exists
    db.get('SELECT * FROM users WHERE email = ?', ['admin@bookstore.com'], (err, user) => {
      if (!user) {
        const hashedPassword = bcryptjs.hashSync('admin123', 10);
        db.run(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          ['admin@bookstore.com', hashedPassword, 'Admin', 'admin'],
          () => {
            console.log('✓ Default admin user created');
            console.log('  Email: admin@bookstore.com');
            console.log('  Password: admin123');
          }
        );
      }
    });
  });
}

// Helper function to verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// AUTH ROUTES
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);
  
  db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, hashedPassword, name],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      const token = jwt.sign({ id: this.lastID, email, role: 'user' }, JWT_SECRET);
      res.json({ message: 'User registered successfully', token, userId: this.lastID });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ message: 'Login successful', token, userId: user.id, role: user.role });
  });
});

// USER PROFILE ROUTES
app.get('/api/users/profile', verifyToken, (req, res) => {
  db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

app.put('/api/users/profile', verifyToken, (req, res) => {
  const { name, email, currentPassword } = req.body;

  if (!name || !email || !currentPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const isPasswordValid = bcryptjs.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    db.run(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id],
      (err) => {
        if (err) {
          return res.status(400).json({ error: 'Email already in use' });
        }
        res.json({ message: 'Profile updated successfully' });
      }
    );
  });
});

app.post('/api/users/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const isPasswordValid = bcryptjs.compareSync(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = bcryptjs.hashSync(newPassword, 10);
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Password changed successfully' });
      }
    );
  });
});

app.delete('/api/users/profile', verifyToken, (err, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    // Also delete related orders and cart
    db.run('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    db.run('DELETE FROM orders WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  });
});

// Profile image upload
app.post('/api/users/profile-image', verifyToken, (req, res) => {
  const { imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  db.run(
    'UPDATE users SET profile_image = ? WHERE id = ?',
    [imageData, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Profile image updated successfully', imageData });
    }
  );
});

// Get profile image
app.get('/api/users/profile-image', verifyToken, (req, res) => {
  db.get(
    'SELECT profile_image FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error('Database error fetching profile image:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        console.warn('User not found for id:', req.user.id);
        return res.status(200).json({ profileImage: null });
      }
      res.json({ profileImage: user.profile_image || null });
    }
  );
});

// PRODUCT ROUTES
app.get('/api/products', (req, res) => {
  const search = req.query.search || '';
  const category = req.query.category || '';

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (title LIKE ? OR author LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });
});

// CART ROUTES
app.get('/api/cart', verifyToken, (req, res) => {
  db.all(
    `SELECT cart.id, cart.quantity, products.* FROM cart 
     JOIN products ON cart.product_id = products.id 
     WHERE cart.user_id = ?`,
    [req.user.id],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(items);
    }
  );
});

app.post('/api/cart', verifyToken, (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get(
    'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
    [req.user.id, product_id],
    (err, item) => {
      if (item) {
        const newQuantity = item.quantity + quantity;
        db.run(
          'UPDATE cart SET quantity = ? WHERE id = ?',
          [newQuantity, item.id],
          (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Cart updated' });
          }
        );
      } else {
        db.run(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [req.user.id, product_id, quantity],
          (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Item added to cart' });
          }
        );
      }
    }
  );
});

app.delete('/api/cart/:cartId', verifyToken, (req, res) => {
  db.run(
    'DELETE FROM cart WHERE id = ? AND user_id = ?',
    [req.params.cartId, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Item removed from cart' });
    }
  );
});

app.put('/api/cart/:cartId', verifyToken, (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  db.run(
    'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
    [quantity, req.params.cartId, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Cart updated' });
    }
  );
});

// ORDER ROUTES
app.post('/api/orders', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT SUM(products.price * cart.quantity) as total FROM cart 
     JOIN products ON cart.product_id = products.id 
     WHERE cart.user_id = ?`,
    [userId],
    (err, result) => {
      if (err || !result.total) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const totalPrice = result.total;

      db.run(
        'INSERT INTO orders (user_id, total_price) VALUES (?, ?)',
        [userId, totalPrice],
        function(err) {
          if (err) return res.status(500).json({ error: 'Database error' });

          const orderId = this.lastID;

          db.all(
            `SELECT cart.product_id, cart.quantity, products.price FROM cart 
             JOIN products ON cart.product_id = products.id 
             WHERE cart.user_id = ?`,
            [userId],
            (err, items) => {
              if (err) return res.status(500).json({ error: 'Database error' });

              // Insert order items and update stock
              items.forEach(item => {
                db.run(
                  'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                  [orderId, item.product_id, item.quantity, item.price]
                );

                db.run(
                  'UPDATE products SET stock = stock - ? WHERE id = ?',
                  [item.quantity, item.product_id]
                );
              });

              // Clear cart
              db.run('DELETE FROM cart WHERE user_id = ?', [userId]);

              res.json({ message: 'Order placed successfully', orderId });
            }
          );
        }
      );
    }
  );
});

app.get('/api/orders', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, orders) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(orders);
    }
  );
});

// ADMIN ROUTES
app.post('/api/admin/products', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { title, author, price, description, stock, category, image_url } = req.body;

  db.run(
    'INSERT INTO products (title, author, price, description, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, author, price, description, stock, category, image_url],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Product added', id: this.lastID });
    }
  );
});

app.put('/api/admin/products/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { title, author, price, description, stock, category, image_url } = req.body;

  db.run(
    'UPDATE products SET title = ?, author = ?, price = ?, description = ?, stock = ?, category = ?, image_url = ? WHERE id = ?',
    [title, author, price, description, stock, category, image_url, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Product updated' });
    }
  );
});

app.delete('/api/admin/products/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Product deleted' });
  });
});

app.get('/api/admin/products', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.all('SELECT * FROM products', (err, products) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(products);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
