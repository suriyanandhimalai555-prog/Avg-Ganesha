-- =============================================================
--  GANESHA SEVA PLATFORM — PostgreSQL Schema
--  Run this to initialize a fresh database
-- =============================================================

-- Clean up if re-running
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS kyc_status_enum CASCADE;

-- =============================================================
--  ENUMS
-- =============================================================
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE kyc_status_enum AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- =============================================================
--  USERS TABLE
-- =============================================================
CREATE TABLE users (
  id              SERIAL        PRIMARY KEY,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  full_name       VARCHAR(255)  NOT NULL,
  role            user_role     NOT NULL DEFAULT 'USER',

  -- Invite System (replaces multi-level referral tree)
  invite_code     VARCHAR(20)   UNIQUE,         -- e.g. GAN-AB12X
  invited_by      INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  invite_count    INTEGER       NOT NULL DEFAULT 0,

  -- KYC
  kyc_status      kyc_status_enum NOT NULL DEFAULT 'PENDING',

  -- Timestamps
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_invite_code  ON users(invite_code);
CREATE INDEX idx_users_invited_by   ON users(invited_by);
CREATE INDEX idx_users_kyc_status   ON users(kyc_status);

-- =============================================================
--  MEMBERSHIP PLANS TABLE
-- =============================================================
CREATE TABLE membership_plans (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  element     VARCHAR(50)   NOT NULL,           -- e.g. Modak, Lotus, Om, Ganesha
  tagline     VARCHAR(255),
  subtitle    VARCHAR(255),
  description TEXT,
  price       VARCHAR(50)   NOT NULL,           -- e.g. '₹11,000'
  benefits    JSONB         NOT NULL DEFAULT '[]',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
--  SYSTEM SETTINGS TABLE
-- =============================================================
CREATE TABLE system_settings (
  key         VARCHAR(100)  PRIMARY KEY,
  value       TEXT          NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
--  DONATIONS TABLE
-- =============================================================
CREATE TABLE donations (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  plan_id     INTEGER       REFERENCES membership_plans(id) ON DELETE SET NULL,
  status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, REJECTED
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status  ON donations(status);

-- =============================================================
--  SEED: System Settings (Bank Details)
-- =============================================================
INSERT INTO system_settings (key, value) VALUES
  ('bank_account_name',   'Ganesha Seva Foundation'),
  ('bank_account_number', ''),
  ('bank_name',           ''),
  ('bank_ifsc',           ''),
  ('bank_branch',         '');

-- =============================================================
--  SEED: Membership Plans (Ganesha-Themed)
-- =============================================================
INSERT INTO membership_plans (name, element, tagline, subtitle, description, price, benefits) VALUES
(
  'Pratham Seva',
  'Modak',
  'The First Sweet Step',
  'Begin Your Devotee Journey',
  'The Pratham Seva plan initiates your journey into the Ganesha Seva community. Like the modak — Ganesha''s favorite sweet — this plan brings sweetness and blessings to your path of service.',
  '₹1,100',
  '["Devotee membership certificate", "Access to Ganesha Seva dashboard", "Participate in online satsangs", "Monthly digital prasad", "Invite 5 fellow devotees"]'
),
(
  'Lotus Seva',
  'Lotus',
  'Rise from the Sacred Waters',
  'Grow Your Devotion',
  'The Lotus Seva plan represents spiritual growth and purity. Like the lotus that blooms untouched in muddy waters, this plan elevates you in the Ganesha Seva community.',
  '₹5,100',
  '["All Pratham Seva benefits", "Priority KYC review", "Exclusive Ganesha Aarti participation", "Digital Ganesha art collection", "Invite 15 fellow devotees", "Monthly seva blessings certificate"]'
),
(
  'Om Seva',
  'Om',
  'The Sound of the Universe',
  'Resonate with the Divine',
  'The Om Seva plan connects you deeply with the primal vibration of Ganesha''s universe. This plan is for those who feel the call to serve with full heart and devotion.',
  '₹11,000',
  '["All Lotus Seva benefits", "Virtual temple darshan access", "Special mention in annual Ganesh utsav", "Exclusive devotee community access", "Invite 30 fellow devotees", "Annual Ganesha blessing ceremony", "Personalized digital thali"]'
),
(
  'Maha Seva',
  'Ganesha',
  'The Supreme Offering',
  'Walk Beside the Vighnaharta',
  'The Maha Seva plan is the highest expression of devotion within Ganesha Seva. Reserved for those who walk beside Vighnaharta as pillars of this sacred community.',
  '₹21,000',
  '["All Om Seva benefits", "Lifetime membership recognition", "Annual physical prasad parcel", "Direct Admin consultation access", "Invite unlimited devotees", "Name inscribed in Ganesha Seva Golden Register", "Priority event access", "Personalised blessing letter from seva committee"]'
);

-- =============================================================
--  SEED: Super Admin (optional — change email/password before use)
--  Password below is bcrypt hash for 'Admin@1234'
-- =============================================================
-- INSERT INTO users (email, password_hash, full_name, role, invite_code)
-- VALUES (
--   'admin@ganeshaseva.com',
--   '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH',
--   'Ganesha Seva Admin',
--   'ADMIN',
--   'GAN-ADMIN'
-- );

-- =============================================================
--  Auto-update updated_at via trigger
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
