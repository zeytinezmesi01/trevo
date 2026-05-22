-- FILE VERSIONS — dosya surum gecmisi
-- Her files satiri mantiksal bir dosya; file_versions her yuklenen surumu tutar.
-- files satiri GUNCEL surumun url/size/name bilgisini tasir (portal bunu gosterir).
-- Surum gecmisi yalnizca ajans tarafinda gorunur; portal file_versions'a hic dokunmaz.
-- Run in Supabase SQL Editor. (Once 017 calistirilmis olmali.)

CREATE TABLE IF NOT EXISTS file_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id        UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_number INT  NOT NULL,
  name           TEXT NOT NULL,
  size           TEXT,
  file_type      TEXT,
  url            TEXT NOT NULL,
  uploaded_by    UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_versions_file_num ON file_versions(file_id, version_number);

-- files.current_version: guncel surum numarasi
ALTER TABLE files ADD COLUMN IF NOT EXISTS current_version INT NOT NULL DEFAULT 1;

-- Mevcut dosyalar icin v1 gecmis kaydi olustur
INSERT INTO file_versions (file_id, tenant_id, version_number, name, size, file_type, url, uploaded_by, created_at)
SELECT f.id, f.tenant_id, 1, f.name, f.size, f.file_type, f.url, f.user_id, f.created_at
FROM files f
WHERE NOT EXISTS (SELECT 1 FROM file_versions v WHERE v.file_id = f.id);

-- RLS
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS file_versions_select ON file_versions;
DROP POLICY IF EXISTS file_versions_insert ON file_versions;
DROP POLICY IF EXISTS file_versions_update ON file_versions;
DROP POLICY IF EXISTS file_versions_delete ON file_versions;

CREATE POLICY file_versions_select ON file_versions
  FOR SELECT USING (tenant_id = auth_tenant_id());
CREATE POLICY file_versions_insert ON file_versions
  FOR INSERT WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY file_versions_update ON file_versions
  FOR UPDATE USING (tenant_id = auth_tenant_id()) WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY file_versions_delete ON file_versions
  FOR DELETE USING (tenant_id = auth_tenant_id());
