-- =========================================================
--  CDIMS — schema.sql
--  Criminal Dossier & Intelligence Management System
--  UP Police Headquarters
--
--  HOW TO RUN:
--  1. Go to https://supabase.com → your project
--  2. Navigate to: SQL Editor → New Query
--  3. Paste this entire file → click "Run"
--  4. All tables and policies are created automatically
-- =========================================================

-- Enable UUID extension (needed for auto-generated IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
--  TABLE: criminals
--  Main criminal dossier record (one row per criminal)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS criminals (
  id                    TEXT         PRIMARY KEY,
  name                  TEXT         NOT NULL,
  alias_name            TEXT         DEFAULT '',
  nickname              TEXT         DEFAULT '',
  father_name           TEXT         DEFAULT '',
  mother_name           TEXT         DEFAULT '',
  gender                TEXT         DEFAULT 'Male',
  dob                   TEXT         DEFAULT '',
  age                   INTEGER      DEFAULT 0,
  mobile                TEXT         DEFAULT '',
  aadhaar               TEXT         DEFAULT '',
  address               TEXT         DEFAULT '',
  permanent_address     TEXT         DEFAULT '',
  photograph            TEXT         DEFAULT '',
  village               TEXT         DEFAULT '',
  blood_group           TEXT         DEFAULT '',
  height                TEXT         DEFAULT '',
  weight                TEXT         DEFAULT '',
  eye_color             TEXT         DEFAULT '',
  fingerprints          TEXT         DEFAULT '',
  face_image            TEXT         DEFAULT '',
  identification_marks  TEXT         DEFAULT '',
  gang_name             TEXT         DEFAULT '',
  gang_leader           TEXT         DEFAULT '',
  gang_members          JSONB        DEFAULT '[]',
  area_of_operation     TEXT         DEFAULT '',
  network_mapping       JSONB        DEFAULT '[]',
  history_sheet_number  TEXT         DEFAULT '',
  surveillance_category TEXT         DEFAULT '',
  surveillance_notes    TEXT         DEFAULT '',
  beat_officer_remarks  TEXT         DEFAULT '',
  intelligence_inputs   TEXT         DEFAULT '',
  property_details      JSONB        DEFAULT '[]',
  vehicle_details       JSONB        DEFAULT '[]',
  status                TEXT         DEFAULT 'Active',
  approval_status       TEXT         DEFAULT 'Pending Verification',
  submitted_by          TEXT         DEFAULT '',
  verified_by           TEXT         DEFAULT '',
  approved_by           TEXT         DEFAULT '',
  last_updated          TIMESTAMPTZ  DEFAULT NOW(),
  created_at            TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE criminals IS 'Main criminal dossier records for CDIMS UP Police';
COMMENT ON COLUMN criminals.village         IS 'Village/locality where criminal resides or is active';
COMMENT ON COLUMN criminals.gang_members    IS 'JSONB array of gang member names';
COMMENT ON COLUMN criminals.network_mapping IS 'JSONB array of {targetId, relation} objects for network graph';
COMMENT ON COLUMN criminals.property_details IS 'JSONB array of {type, address, estimatedValue, status} objects';
COMMENT ON COLUMN criminals.vehicle_details  IS 'JSONB array of {vehicleNumber, vehicleType, registrationDetails} objects';

-- ──────────────────────────────────────────────────────────
--  TABLE: criminal_firs
--  FIR / case records linked to a criminal (one-to-many)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS criminal_firs (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  criminal_id           TEXT         NOT NULL REFERENCES criminals(id) ON DELETE CASCADE,
  fir_number            TEXT         DEFAULT '',
  crime_number          TEXT         DEFAULT '',
  police_station        TEXT         DEFAULT '',
  district              TEXT         DEFAULT '',
  sections              TEXT         DEFAULT '',
  charge_sheet_status   TEXT         DEFAULT '',
  conviction_details    TEXT         DEFAULT '',
  bail_status           TEXT         DEFAULT '',
  court_case_details    TEXT         DEFAULT '',
  created_at            TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE criminal_firs IS 'FIR and case records linked to each criminal dossier';
COMMENT ON COLUMN criminal_firs.district IS 'District ID matching MASTER_DATA (e.g. lucknow, varanasi)';
COMMENT ON COLUMN criminal_firs.sections IS 'IPC/CrPC sections applied in this case';

-- ──────────────────────────────────────────────────────────
--  TABLE: audit_logs
--  Complete audit trail of all user actions
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username   TEXT         DEFAULT '',
  role       TEXT         DEFAULT '',
  action     TEXT         DEFAULT '',
  details    TEXT         DEFAULT '',
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all user actions in CDIMS';

-- ──────────────────────────────────────────────────────────
--  INDEXES — For fast queries
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_criminals_status          ON criminals(status);
CREATE INDEX IF NOT EXISTS idx_criminals_approval_status ON criminals(approval_status);
CREATE INDEX IF NOT EXISTS idx_criminals_village         ON criminals(village);
CREATE INDEX IF NOT EXISTS idx_criminals_name            ON criminals(name);
CREATE INDEX IF NOT EXISTS idx_criminals_created_at      ON criminals(created_at);

CREATE INDEX IF NOT EXISTS idx_firs_criminal_id          ON criminal_firs(criminal_id);
CREATE INDEX IF NOT EXISTS idx_firs_police_station       ON criminal_firs(police_station);
CREATE INDEX IF NOT EXISTS idx_firs_district             ON criminal_firs(district);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_username       ON audit_logs(username);

-- ──────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY (RLS)
--  Currently open for anonymous access (demo mode).
--  In production: replace these with Supabase Auth policies.
-- ──────────────────────────────────────────────────────────
ALTER TABLE criminals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE criminal_firs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts on re-run
DROP POLICY IF EXISTS "cdims_criminals_open"    ON criminals;
DROP POLICY IF EXISTS "cdims_firs_open"         ON criminal_firs;
DROP POLICY IF EXISTS "cdims_audit_open"        ON audit_logs;

-- Open policies (anon key full access for demo)
CREATE POLICY "cdims_criminals_open"
  ON criminals FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "cdims_firs_open"
  ON criminal_firs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "cdims_audit_open"
  ON audit_logs FOR ALL
  USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────
--  TABLE: cdims_users
--  User credentials and system roles
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cdims_users (
  username    TEXT        PRIMARY KEY,
  password    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL,
  level       INTEGER     NOT NULL,
  station     TEXT        NOT NULL,
  district    TEXT        NOT NULL,
  avatar      TEXT        NOT NULL,
  permissions JSONB       DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cdims_users IS 'CDIMS user account credentials and roles';

-- ──────────────────────────────────────────────────────────
--  TABLE: cdims_dossiers
--  Criminal dossiers stored as structured JSONB columns
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cdims_dossiers (
  id               TEXT        PRIMARY KEY,
  personal_info    JSONB       NOT NULL,
  biometrics       JSONB       NOT NULL,
  history          JSONB       NOT NULL,
  gang_info        JSONB       NOT NULL,
  surveillance     JSONB       NOT NULL,
  property_details JSONB       DEFAULT '[]',
  vehicle_details  JSONB       DEFAULT '[]',
  status           TEXT        DEFAULT 'Active',
  approval_status  TEXT        DEFAULT 'Pending Verification',
  submitted_by     TEXT        DEFAULT '',
  verified_by      TEXT        DEFAULT 'Awaiting Verification',
  approved_by      TEXT        DEFAULT 'Awaiting Approval',
  last_updated     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cdims_dossiers IS 'Criminal dossiers records with nested JSONB objects';

-- ──────────────────────────────────────────────────────────
--  TABLE: cdims_audit_logs
--  Audit log trail in the backend database
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cdims_audit_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username   TEXT        DEFAULT '',
  role       TEXT        DEFAULT '',
  action     TEXT        DEFAULT '',
  details    TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cdims_audit_logs IS 'System audit trail logs';

-- ──────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY & OPEN POLICIES FOR CDIMS_ TABLES
-- ──────────────────────────────────────────────────────────
ALTER TABLE cdims_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdims_dossiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdims_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cdims_users_open"      ON cdims_users;
DROP POLICY IF EXISTS "cdims_dossiers_open"   ON cdims_dossiers;
DROP POLICY IF EXISTS "cdims_audit_logs_open" ON cdims_audit_logs;

CREATE POLICY "cdims_users_open"      ON cdims_users      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cdims_dossiers_open"   ON cdims_dossiers   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cdims_audit_logs_open" ON cdims_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Seed default users
INSERT INTO cdims_users (username, password, name, role, level, station, district, avatar, permissions)
VALUES
  ('sho_hazratganj', 'up@1234', 'SHO Rajiv Sharma', 'Police Station User', 1, 'Hazratganj PS, Lucknow', 'lucknow', 'RS', '["create", "update", "upload", "search"]'),
  ('co_lucknow', 'up@1234', 'CO Prashant Mishra', 'District Nodal Officer', 2, 'CO Office, Lucknow', 'lucknow', 'PM', '["view_all_district", "verify", "approve", "return", "reports", "search"]'),
  ('phq_admin', 'up@1234', 'DG Intelligence (PHQ)', 'State Administrator', 3, 'PHQ — UP Police Headquarters', 'all', 'PH', '["all"]')
ON CONFLICT (username) DO NOTHING;

