-- O-23: file_versions.uploaded_by için eksik FK constraint
-- uploaded_by auth.users(id)'i referans almali, kullanici silinince null'lansin
ALTER TABLE file_versions
  ADD CONSTRAINT fk_file_versions_uploaded_by
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
