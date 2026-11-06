CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  sku varchar(80),
  category varchar(120),
  unit varchar(40) NOT NULL,
  current_quantity integer NOT NULL DEFAULT 0,
  minimum_quantity integer NOT NULL DEFAULT 0,
  batch_number varchar(120),
  expiry_date timestamp,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelf_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'processing',
  raw_analysis jsonb,
  created_by varchar(200) NOT NULL,
  reviewed_by varchar(200),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory_items(id),
  movement_type varchar(30) NOT NULL,
  quantity_delta integer NOT NULL,
  reason text NOT NULL,
  source varchar(30) NOT NULL DEFAULT 'manual',
  shelf_scan_id uuid REFERENCES shelf_scans(id),
  actor_id varchar(200) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shelf_scan_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES shelf_scans(id),
  product_label varchar(200) NOT NULL,
  quantity integer NOT NULL,
  unit varchar(40),
  batch_number varchar(120),
  expiry_date timestamp,
  confidence_basis_points integer NOT NULL,
  review_status varchar(30) NOT NULL DEFAULT 'pending',
  reviewer_note text
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id varchar(200) NOT NULL,
  action varchar(100) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
