PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, price_cents INTEGER NOT NULL CHECK(price_cents >= 0), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    stripe_session_id TEXT UNIQUE,

    customer_email TEXT,

    status TEXT NOT NULL DEFAULT 'pending',

    total_cents INTEGER NOT NULL DEFAULT 0,

    currency TEXT NOT NULL DEFAULT 'eur',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    paid_at TEXT

);
DROP TABLE IF EXISTS order_items;

CREATE TABLE order_items (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    order_id INTEGER NOT NULL,

    product_name TEXT NOT NULL,

    size TEXT,

    quantity INTEGER NOT NULL,

    unit_price_cents INTEGER NOT NULL,

    FOREIGN KEY(order_id)

    REFERENCES orders(id)

    ON DELETE CASCADE

);
CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS contact_messages (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
INSERT OR IGNORE INTO products(name, price_cents) VALUES
('T-shirt Albanie',2499),('T-shirt Algérie',2499),('T-shirt Italie',2499),('T-shirt Japon',2499),('T-shirt Jordanie',2499),('T-shirt Madagascar',2499),('T-shirt Maroc',2499),('T-shirt RD Congo',2499),('T-shirt Réunion',2499),('T-shirt Russie',2499),('T-shirt Turquie',2499);
