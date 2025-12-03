INSERT INTO users (username, password_hash, role) VALUES
  ('owner', 'owner123', 'owner')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, role) VALUES
  ('cashier', 'cashier123', 'cashier')
ON CONFLICT (username) DO NOTHING;
