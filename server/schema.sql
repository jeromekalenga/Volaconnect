CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
 phone TEXT UNIQUE, password_hash TEXT NOT NULL, full_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('farmer','buyer','technician','admin')),
 is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS farms (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES users(id),
 name TEXT NOT NULL, address TEXT, livestock_type TEXT, animal_count INTEGER NOT NULL DEFAULT 0 CHECK(animal_count>=0),
 location GEOGRAPHY(POINT,4326), boundary GEOGRAPHY(POLYGON,4326), tracking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS flocks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
 label TEXT NOT NULL, species TEXT NOT NULL, purpose TEXT NOT NULL, initial_count INTEGER NOT NULL CHECK(initial_count>=0),
 start_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'active', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS health_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
 flock_id UUID REFERENCES flocks(id) ON DELETE SET NULL, record_type TEXT NOT NULL,
 quantity NUMERIC(12,2), occurred_at TIMESTAMPTZ NOT NULL, details TEXT, created_by UUID REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('income','expense')), category TEXT NOT NULL,
 amount NUMERIC(14,2) NOT NULL CHECK(amount>0), currency CHAR(3) NOT NULL DEFAULT 'USD',
 occurred_at DATE NOT NULL, note TEXT, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
 seller_id UUID NOT NULL REFERENCES users(id), name TEXT NOT NULL, description TEXT,
 price NUMERIC(14,2) NOT NULL CHECK(price>=0), currency CHAR(3) NOT NULL DEFAULT 'USD',
 quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0), unit TEXT NOT NULL DEFAULT 'piece',
 image_key TEXT, is_published BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id UUID NOT NULL REFERENCES users(id),
 farm_id UUID NOT NULL REFERENCES farms(id), status TEXT NOT NULL DEFAULT 'pending',
 total NUMERIC(14,2) NOT NULL CHECK(total>=0), currency CHAR(3) NOT NULL DEFAULT 'USD',
 delivery_address TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id UUID NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price NUMERIC(14,2) NOT NULL CHECK(unit_price>=0)
);
CREATE TABLE IF NOT EXISTS payment_intents (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id),
 provider TEXT NOT NULL, provider_reference TEXT UNIQUE, amount NUMERIC(14,2) NOT NULL,
 currency CHAR(3) NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'created',
 phone_masked TEXT, provider_payload JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), author_id UUID NOT NULL REFERENCES users(id),
 product_id UUID REFERENCES products(id), farm_id UUID REFERENCES farms(id), rating INTEGER CHECK(rating BETWEEN 1 AND 5),
 body TEXT NOT NULL, is_published BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id UUID NOT NULL REFERENCES users(id),
 recipient_id UUID NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), read_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS sync_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
 client_event_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT, operation TEXT NOT NULL,
 payload JSONB NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,client_event_id)
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, actor_id UUID REFERENCES users(id), action TEXT NOT NULL,
 entity_type TEXT, entity_id TEXT, ip INET, user_agent TEXT, metadata JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_public ON products(is_published,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_farm_date ON transactions(farm_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_user_time ON sync_events(user_id,received_at);

CREATE TABLE IF NOT EXISTS sync_snapshots (
 user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 version BIGINT NOT NULL DEFAULT 1,
 data JSONB NOT NULL DEFAULT '{}'::jsonb,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
