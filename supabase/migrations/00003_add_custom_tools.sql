-- ========== 自定义工具表（Jev 工具箱） ==========
CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  shortcut text NOT NULL UNIQUE CHECK (shortcut ~ '^[A-Z0-9]$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 自动更新 updated_at（复用已有函数 set_updated_at）
CREATE TRIGGER tools_set_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ========== RLS：个人存档应用，无登录系统，anon 与 authenticated 均开放读写 ==========
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_tools" ON tools FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_tools" ON tools FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_tools" ON tools FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tools" ON tools FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_tools" ON tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_tools" ON tools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_tools" ON tools FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_tools" ON tools FOR DELETE TO authenticated USING (true);

-- ========== 种子数据：一个示例自定义工具 ==========
INSERT INTO tools (name, description, url, shortcut) VALUES
  ('MDN Web 文档', '查前端 API 用', 'https://developer.mozilla.org/zh-CN/', 'M');