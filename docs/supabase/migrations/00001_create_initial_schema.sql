-- 创建用户角色枚举
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- 创建用户配置表
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建角色表
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  rarity int NOT NULL CHECK (rarity >= 1 AND rarity <= 6),
  faction text,
  class text,
  description text,
  background_story text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建剧情时间线表
CREATE TABLE public.storylines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date text,
  chapter text,
  category text,
  content text,
  related_characters text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建组织机构表
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  description text,
  history text,
  leader text,
  members text[],
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建地点表
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text,
  type text,
  description text,
  coordinates text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建术语表
CREATE TABLE public.glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  category text,
  definition text NOT NULL,
  related_terms text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建收藏表
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('character', 'storyline', 'organization', 'location', 'glossary')),
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- 创建索引
CREATE INDEX idx_characters_name ON public.characters(name);
CREATE INDEX idx_characters_faction ON public.characters(faction);
CREATE INDEX idx_characters_class ON public.characters(class);
CREATE INDEX idx_storylines_chapter ON public.storylines(chapter);
CREATE INDEX idx_organizations_name ON public.organizations(name);
CREATE INDEX idx_locations_region ON public.locations(region);
CREATE INDEX idx_glossary_term ON public.glossary(term);
CREATE INDEX idx_glossary_category ON public.glossary(category);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_content ON public.favorites(content_type, content_id);

-- 创建用户同步触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), NEW.id::text),
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 启用RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storylines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 创建辅助函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Profiles 策略
CREATE POLICY "管理员可以查看所有用户" ON profiles
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的资料" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "管理员可以更新所有用户" ON profiles
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- 内容表策略（所有人可读，管理员可写）
CREATE POLICY "所有人可以查看角色" ON characters
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理角色" ON characters
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "所有人可以查看剧情" ON storylines
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理剧情" ON storylines
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "所有人可以查看组织" ON organizations
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理组织" ON organizations
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "所有人可以查看地点" ON locations
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理地点" ON locations
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "所有人可以查看术语" ON glossary
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "管理员可以管理术语" ON glossary
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 收藏表策略
CREATE POLICY "用户可以查看自己的收藏" ON favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以添加收藏" ON favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的收藏" ON favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 创建公开视图
CREATE VIEW public_profiles AS
  SELECT id, username, role FROM profiles;