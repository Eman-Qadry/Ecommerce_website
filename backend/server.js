require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "../frontend")));

// Database setup with connection pooling for serverless
const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 2, // Limit connections for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// For local development with self-signed certs (Supabase), disable cert verification
if (isDevelopment) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Helper function to run queries
const db = {
  run: (query, params, callback) => {
    pool.query(query, params, (err, result) => {
      if (callback) callback(err, result);
    });
  },
  get: (query, params, callback) => {
    pool.query(query, params, (err, result) => {
      if (callback) callback(err, result?.rows?.[0]);
    });
  },
  all: (query, params, callback) => {
    pool.query(query, params, (err, result) => {
      if (callback) callback(err, result?.rows);
    });
  },
  serialize: (callback) => {
    callback();
  },
};

// Initialize database on startup
console.log("Starting database initialization...");
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to PostgreSQL database");
    initializeDatabase();
  }
});

// Initialize database tables sequentially
function initializeDatabase() {
  console.log("Initializing database tables...");

  // Step 1: Create users table
  pool.query(
    `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      profile_image TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating users table:", err);
        return;
      }
      console.log("✓ Users table created");

      // Step 2: Create products table
      pool.query(
        `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
        (err) => {
          if (err) {
            console.error("Error creating products table:", err);
            return;
          }
          console.log("✓ Products table created");

          // Step 3: Create cart table (depends on users & products)
          pool.query(
            `
        CREATE TABLE IF NOT EXISTS cart (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        )
      `,
            (err) => {
              if (err) {
                console.error("Error creating cart table:", err);
                return;
              }
              console.log("✓ Cart table created");

              // Step 4: Create orders table (depends on users)
              pool.query(
                `
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            total_price DECIMAL(10, 2) NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
          )
        `,
                (err) => {
                  if (err) {
                    console.error("Error creating orders table:", err);
                    return;
                  }
                  console.log("✓ Orders table created");

                  // Step 5: Create order_items table (depends on orders & products)
                  pool.query(
                    `
            CREATE TABLE IF NOT EXISTS order_items (
              id SERIAL PRIMARY KEY,
              order_id INTEGER NOT NULL,
              product_id INTEGER NOT NULL,
              quantity INTEGER NOT NULL,
              price DECIMAL(10, 2) NOT NULL,
              FOREIGN KEY(order_id) REFERENCES orders(id),
              FOREIGN KEY(product_id) REFERENCES products(id)
            )
          `,
                    (err) => {
                      if (err) {
                        console.error("Error creating order_items table:", err);
                        return;
                      }
                      console.log("✓ Order items table created");

                      // Step 6: Check and seed sample products
                      console.log("Checking for existing products...");
                      pool.query(
                        "SELECT COUNT(*) as count FROM products",
                        (err, result) => {
                          if (err) {
                            console.error("Error checking products:", err);
                            return;
                          }

                          const count = result.rows[0].count;
                          console.log(`Found ${count} existing products`);

                          if (count === 0) {
                            console.log("⏳ Seeding sample products...");
                            const sampleProducts = [
                              [
                                "The Great Gatsby",
                                "F. Scott Fitzgerald",
                                "12.99",
                                "A classic American novel",
                                "50",
                                "Fiction",
                                "https://picsum.photos/200/300?random=1",
                              ],
                              [
                                "To Kill a Mockingbird",
                                "Harper Lee",
                                "14.99",
                                "A gripping tale of racial injustice",
                                "40",
                                "Fiction",
                                "https://picsum.photos/200/300?random=2",
                              ],
                              [
                                "1984",
                                "George Orwell",
                                "13.99",
                                "A dystopian novel about totalitarianism",
                                "35",
                                "Fiction",
                                "https://picsum.photos/200/300?random=3",
                              ],
                              [
                                "Pride and Prejudice",
                                "Jane Austen",
                                "11.99",
                                "A romantic novel set in Georgian England",
                                "45",
                                "Romance",
                                "https://picsum.photos/200/300?random=4",
                              ],
                              [
                                "The Catcher in the Rye",
                                "J.D. Salinger",
                                "13.99",
                                "A story of teenage rebellion",
                                "30",
                                "Fiction",
                                "https://picsum.photos/200/300?random=5",
                              ],
                              [
                                "Sapiens",
                                "Yuval Noah Harari",
                                "18.99",
                                "A brief history of humankind",
                                "60",
                                "Non-fiction",
                                "https://picsum.photos/200/300?random=6",
                              ],
                            ];

                            // Insert all products immediately
                            let i = 0;
                            sampleProducts.forEach((product) => {
                              i++;
                              console.log(
                                `  Inserting product ${i}: ${product[0]}`,
                              );
                              pool.query(
                                "INSERT INTO products (title, author, price, description, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                                product,
                                (err) => {
                                  if (err) {
                                    console.error(
                                      `  ERROR on product ${i}:`,
                                      err.message,
                                    );
                                  } else {
                                    console.log(`  ✓ Product ${i} inserted`);
                                  }
                                },
                              );
                            });
                            console.log("✓ Seeded 6 sample products");
                          }

                          // Always check for admin user
                          checkAdminUser();
                        },
                      );
                    },
                  );
                },
              );
            },
          );
        },
      );
    },
  );
}

// Check and create admin user
function checkAdminUser() {
  console.log("Checking for admin user...");
  pool.query(
    "SELECT * FROM users WHERE email = $1",
    ["admin@bookstore.com"],
    (err, result) => {
      if (err) {
        console.error("Error checking admin user:", err);
        return;
      }

      if (result.rows.length === 0) {
        console.log("Creating admin user...");
        const hashedPassword = bcryptjs.hashSync("admin123", 10);
        pool.query(
          "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)",
          ["admin@bookstore.com", hashedPassword, "Admin", "admin"],
          (err) => {
            if (err) {
              console.error("Error creating admin user:", err);
            } else {
              console.log("✓ Default admin user created");
              console.log("  Email: admin@bookstore.com");
              console.log("  Password: admin123");
              console.log("\n✅ Database initialization complete!");
            }
          },
        );
      } else {
        console.log("✓ Admin user already exists");
        console.log("\n✅ Database initialization complete!");
      }
    },
  );
}

// Helper function to verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// AUTH ROUTES
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  pool.query(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id",
    [email, hashedPassword, name],
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: "Email already exists" });
      }
      const userId = result.rows[0].id;
      const token = jwt.sign({ id: userId, email, role: "user" }, JWT_SECRET);
      res.json({ message: "User registered successfully", token, userId });
    },
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  db.get("SELECT * FROM users WHERE email = $1", [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
    );
    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      role: user.role,
    });
  });
});

// USER PROFILE ROUTES
app.get("/api/users/profile", verifyToken, (req, res) => {
  db.get(
    "SELECT id, email, name, role, created_at FROM users WHERE id = $1",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    },
  );
});

app.put("/api/users/profile", verifyToken, (req, res) => {
  const { name, email, currentPassword } = req.body;

  if (!name || !email || !currentPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.get(
    "SELECT password FROM users WHERE id = $1",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const isPasswordValid = bcryptjs.compareSync(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      db.run(
        "UPDATE users SET name = $1, email = $2 WHERE id = $3",
        [name, email, req.user.id],
        (err) => {
          if (err) {
            return res.status(400).json({ error: "Email already in use" });
          }
          res.json({ message: "Profile updated successfully" });
        },
      );
    },
  );
});

app.post("/api/users/change-password", verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  }

  db.get(
    "SELECT password FROM users WHERE id = $1",
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const isPasswordValid = bcryptjs.compareSync(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedNewPassword = bcryptjs.hashSync(newPassword, 10);
      db.run(
        "UPDATE users SET password = $1 WHERE id = $2",
        [hashedNewPassword, req.user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json({ message: "Password changed successfully" });
        },
      );
    },
  );
});

app.delete("/api/users/profile", verifyToken, (req, res) => {
  db.run("DELETE FROM users WHERE id = $1", [req.user.id], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    // Also delete related orders and cart
    db.run("DELETE FROM cart WHERE user_id = $1", [req.user.id]);
    db.run("DELETE FROM orders WHERE user_id = $1", [req.user.id]);
    res.json({ message: "Account deleted successfully" });
  });
});

// Profile image upload
app.post("/api/users/profile-image", verifyToken, (req, res) => {
  const { imageData } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided" });
  }

  db.run(
    "UPDATE users SET profile_image = $1 WHERE id = $2",
    [imageData, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Profile image updated successfully", imageData });
    },
  );
});

// Get profile image
app.get("/api/users/profile-image", verifyToken, (req, res) => {
  db.get(
    "SELECT profile_image FROM users WHERE id = $1",
    [req.user.id],
    (err, user) => {
      if (err) {
        console.error("Database error fetching profile image:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        console.warn("User not found for id:", req.user.id);
        return res.status(200).json({ profileImage: null });
      }
      res.json({ profileImage: user.profile_image || null });
    },
  );
});

// PRODUCT ROUTES
app.get("/api/products", (req, res) => {
  const search = req.query.search || "";
  const category = req.query.category || "";

  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];
  let paramCount = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount + 1} OR description ILIKE $${paramCount + 2})`;
    params.push(searchTerm, searchTerm, searchTerm);
    paramCount += 3;
  }

  if (category) {
    query += ` AND category = $${paramCount}`;
    params.push(category);
  }

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(products);
  });
});

app.get("/api/products/:id", (req, res) => {
  db.get(
    "SELECT * FROM products WHERE id = $1",
    [req.params.id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    },
  );
});
// GET ALL CATEGORIES
app.get("/api/categories", (req, res) => {
  db.all(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC",
    [],
    (err, categories) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      res.json(categories);
    },
  );
});
// CART ROUTES
app.get("/api/cart", verifyToken, (req, res) => {
  db.all(
    `SELECT 
    cart.id AS cart_id,
    cart.quantity,
    products.*
FROM cart
JOIN products ON cart.product_id = products.id
WHERE cart.user_id = $1`,

    [req.user.id],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(items);
    },
  );
});

app.post("/api/cart", verifyToken, (req, res) => {
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.get(
    "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
    [req.user.id, product_id],
    (err, item) => {
      if (item) {
        const newQuantity = item.quantity + quantity;
        db.run(
          "UPDATE cart SET quantity = $1 WHERE id = $2",
          [newQuantity, item.id],
          (err) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ message: "Cart updated" });
          },
        );
      } else {
        db.run(
          "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)",
          [req.user.id, product_id, quantity],
          (err) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ message: "Item added to cart" });
          },
        );
      }
    },
  );
});

app.delete("/api/cart/:cartId", verifyToken, (req, res) => {
  db.run(
    "DELETE FROM cart WHERE id = $1 AND user_id = $2",
    [req.params.cartId, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Item removed from cart" });
    },
  );
});

app.put("/api/cart/:cartId", verifyToken, (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  db.run(
    "UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3",
    [quantity, req.params.cartId, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Cart updated" });
    },
  );
});

// ORDER ROUTES
app.post("/api/orders", verifyToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT SUM(products.price * cart.quantity) as total FROM cart 
     JOIN products ON cart.product_id = products.id 
     WHERE cart.user_id = $1`,
    [userId],
    (err, result) => {
      if (err || !result.total) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const totalPrice = result.total;

      pool.query(
        "INSERT INTO orders (user_id, total_price) VALUES ($1, $2) RETURNING id",
        [userId, totalPrice],
        (err, result) => {
          if (err) return res.status(500).json({ error: "Database error" });

          const orderId = result.rows[0].id;

          db.all(
            `SELECT cart.product_id, cart.quantity, products.price FROM cart 
             JOIN products ON cart.product_id = products.id 
             WHERE cart.user_id = $1`,
            [userId],
            (err, items) => {
              if (err) return res.status(500).json({ error: "Database error" });

              // Insert order items and update stock
              items.forEach((item) => {
                db.run(
                  "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
                  [orderId, item.product_id, item.quantity, item.price],
                );

                db.run("UPDATE products SET stock = stock - $1 WHERE id = $2", [
                  item.quantity,
                  item.product_id,
                ]);
              });

              // Clear cart
              db.run("DELETE FROM cart WHERE user_id = $1", [userId]);

              res.json({ message: "Order placed successfully", orderId });
            },
          );
        },
      );
    },
  );
});

app.get("/api/orders", verifyToken, (req, res) => {
  db.all(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id],
    (err, orders) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(orders);
    },
  );
});

// ADMIN ROUTES
app.post("/api/admin/products", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { title, author, price, description, stock, category, image_url } =
    req.body;

  pool.query(
    "INSERT INTO products (title, author, price, description, stock, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    [title, author, price, description, stock, category, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Product added", id: result.rows[0].id });
    },
  );
});

app.put("/api/admin/products/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { title, author, price, description, stock, category, image_url } =
    req.body;

  db.run(
    "UPDATE products SET title = $1, author = $2, price = $3, description = $4, stock = $5, category = $6, image_url = $7 WHERE id = $8",
    [
      title,
      author,
      price,
      description,
      stock,
      category,
      image_url,
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Product updated" });
    },
  );
});

app.delete("/api/admin/products/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.run("DELETE FROM products WHERE id = $1", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Product deleted" });
  });
});

app.get("/api/admin/products", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.all("SELECT * FROM products", [], (err, products) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(products);
  });
});

// Serve frontend for all non-API routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    pool.end();
  });
});
