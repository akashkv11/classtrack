-- Historical duplicate diaries are preserved pending explicit resolution.
-- Serialize writes per session to enforce uniqueness for all new diary links.
CREATE FUNCTION enforce_diary_session_uniqueness() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.session_id = OLD.session_id THEN RETURN NEW; END IF;
  PERFORM id FROM attendance_sessions WHERE id = NEW.session_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM teaching_diary_entries WHERE session_id = NEW.session_id AND id <> NEW.id) THEN
    RAISE EXCEPTION 'This session already has a diary entry' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER teaching_diary_session_unique_guard BEFORE INSERT OR UPDATE OF session_id
ON teaching_diary_entries FOR EACH ROW EXECUTE FUNCTION enforce_diary_session_uniqueness();
-- A unique index can be installed after historical duplicates are resolved.
