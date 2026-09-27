-- Safely clear existing data and reset auto-increment IDs
TRUNCATE reviews, condition_logs, bookings, items, categories, users RESTART IDENTITY CASCADE;

-- Pre-seeded Users (Password for all: Passw0rd!)
INSERT INTO users (name, email, password_hash) VALUES
('Ali Khan', 'ali@borrowbox.dev', '$2b$10$wK1BfUfO2fR1Uv/9aX5Uuu1f2bC.Z3Y4x5W6v7U8t9S0r1Q2P3O4N'),
('Sara Ahmed', 'sara@borrowbox.dev', '$2b$10$wK1BfUfO2fR1Uv/9aX5Uuu1f2bC.Z3Y4x5W6v7U8t9S0r1Q2P3O4N'),
('Usman Raza', 'usman@borrowbox.dev', '$2b$10$wK1BfUfO2fR1Uv/9aX5Uuu1f2bC.Z3Y4x5W6v7U8t9S0r1Q2P3O4N'),
('Admin User', 'admin@borrowbox.dev', '$2b$10$wK1BfUfO2fR1Uv/9aX5Uuu1f2bC.Z3Y4x5W6v7U8t9S0r1Q2P3O4N');

-- Categories (6 Categories)
INSERT INTO categories (name) VALUES
('Electronics & Gadgets'),
('Outdoor & Camping'),
('Power & Hand Tools'),
('Party & Events'),
('Sports & Fitness'),
('Books & Board Games');

-- Items (18 Sample Items matching exact table schema)
INSERT INTO items (owner_id, category_id, title, description, condition, max_days, pickup_area, is_active) VALUES
-- Electronics & Gadgets
(1, 1, 'Sony Alpha A7 III Camera', 'Full-frame mirrorless camera with 28-70mm lens kit.', 'good', 7, 'Gulberg, Lahore', true),
(2, 1, 'Epson HD Mini Projector', 'Portable 1080p LED projector for outdoor movie nights.', 'good', 5, 'DHA Phase 5, Lahore', true),
(3, 1, 'PlayStation 5 Console', 'Includes 2 DualSense controllers and 3 popular games.', 'new', 3, 'Model Town, Lahore', true),
(1, 1, 'Bose SoundLink Bluetooth Speaker', 'High-bass waterproof portable speaker.', 'good', 10, 'Gulberg, Lahore', true),

-- Outdoor & Camping
(2, 2, '4-Person Waterproof Camping Tent', 'Easy pop-up tent with rainfly and ground tarp.', 'good', 14, 'DHA Phase 3, Lahore', true),
(3, 2, 'Osprey 65L Hiking Backpack', 'Ergonomic internal frame trek pack with rain cover.', 'fair', 7, 'Johar Town, Lahore', true),
(1, 2, 'Coleman Dual Burner Camp Stove', 'Propane camp stove ideal for weekend trips.', 'good', 5, 'Gulberg, Lahore', true),

-- Power & Hand Tools
(3, 3, 'DeWalt 20V Max Cordless Drill', 'Includes 2 batteries, charger, and 30-piece drill bit set.', 'new', 7, 'Model Town, Lahore', true),
(2, 3, 'Bosch Circular Saw', '7-1/4 inch circular saw with carbide blade.', 'good', 4, 'DHA Phase 5, Lahore', true),
(1, 3, '108-Piece Mechanics Tool Set', 'Complete socket wrench set and screwdrivers.', 'good', 10, 'Gulberg, Lahore', true),

-- Party & Events
(2, 4, 'JBL PartyBox 310 Speaker', '240W party speaker with built-in dynamic light show.', 'new', 3, 'DHA Phase 2, Lahore', true),
(3, 4, 'Chauvet DJ Fog Machine', 'Water-based fogger with wireless remote control.', 'good', 5, 'Johar Town, Lahore', true),
(1, 4, 'Folding Event Tables & Chairs Set', 'Lightweight heavy-duty plastic folding furniture set.', 'good', 7, 'Gulberg, Lahore', true),

-- Sports & Fitness
(3, 5, 'Trek Mountain Bike (Medium Frame)', '21-speed front-suspension mountain bike with helmet.', 'good', 7, 'Model Town, Lahore', true),
(2, 5, 'Wilson Pro Staff Tennis Racket Set', 'Includes 2 tennis rackets and a tube of balls.', 'good', 14, 'DHA Phase 5, Lahore', true),
(1, 5, 'Inflatable 2-Person Kayak', 'Comes with 2 paddles, pump, and carry bag.', 'fair', 5, 'Gulberg, Lahore', true),

-- Books & Board Games
(2, 6, 'Catan Board Game (Collector Edition)', 'Classic strategy board game for 3-4 players.', 'new', 30, 'DHA Phase 1, Lahore', true),
(3, 6, 'Ticket to Ride Europe', 'Popular train strategy board game.', 'good', 30, 'Johar Town, Lahore', true);