-- ========== 清理旧应用结构（先删表使策略随之删除，再删函数） ==========
DROP TRIGGER on_auth_user_confirmed ON auth.users;
DROP VIEW public_profiles;
DROP TABLE favorites;
DROP TABLE glossary;
DROP TABLE locations;
DROP TABLE organizations;
DROP TABLE storylines;
DROP TABLE characters;
DROP TABLE profiles;
DROP FUNCTION handle_new_user();
DROP FUNCTION is_admin(uid uuid);
DROP TYPE user_role;

-- ========== 分类表 ==========
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========== 笔记表 ==========
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_category_id ON notes(category_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_set_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ========== RLS：个人存档应用，无登录系统，anon 与 authenticated 均开放读写 ==========
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "anon_select_notes" ON notes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE TO anon USING (true);
CREATE POLICY "auth_select_notes" ON notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_notes" ON notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_notes" ON notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_notes" ON notes FOR DELETE TO authenticated USING (true);

-- ========== 种子数据：三个领域分类 ==========
INSERT INTO categories (name, sort_order) VALUES
  ('计算机硬件维护', 1),
  ('基础自然科学常识', 2),
  ('室内植物培育', 3);

-- ========== 示例笔记 ==========
INSERT INTO notes (title, content, category_id, created_at, updated_at) VALUES
(
  '台式机清灰与硅脂更换实践记录',
  E'【实践背景】\n家里台式机用了两年多，最近玩游戏时 CPU 温度经常飙到 85℃ 以上，风扇噪音明显变大，判断是积灰和硅脂干涸导致的散热效率下降。\n\n【操作步骤】\n1. 断电拔线，按几下开机键释放余电；\n2. 拆侧板，用软毛刷配合皮吹气球清理主板和风扇叶片上的浮灰，避免用嘴吹（唾液水汽可能腐蚀元件）；\n3. 拆下散热器，用无尘布蘸少量高纯度酒精擦掉 CPU 顶盖和散热器底座上的旧硅脂；\n4. 在 CPU 中心点挤一颗米粒大小的新硅脂，装上散热器靠压力自然摊开，不要涂太厚；\n5. 装回后开机进 BIOS 观察待机温度。\n\n【结果与心得】\n待机温度从 52℃ 降到 38℃，满载从 87℃ 降到 71℃。硅脂"薄而匀"比"多"更重要，涂太厚反而影响导热。清灰建议每半年一次，硅脂一到两年换一次即可。',
  (SELECT id FROM categories WHERE name = '计算机硬件维护'),
  '2026-08-20 10:00:00+00',
  '2026-08-20 10:00:00+00'
),
(
  '机械硬盘异响排查笔记',
  E'【现象】\n老硬盘开机时偶尔发出"咔哒咔哒"的声音，读写大文件时更明显。\n\n【排查过程】\n1. 先用 CrystalDiskInfo 查看 S.M.A.R.T. 信息，发现"重新分配扇区计数"（05）原始值不为 0，说明已有坏道被替换；\n2. 用 HD Tune 做慢速全盘扫描，确认有少量红色坏块；\n3. 检查供电线和 SATA 线，重新插拔排除接触不良。\n\n【知识点整理】\n- "咔哒"声通常是磁头反复归位的声音，属于硬盘故障的典型前兆；\n- S.M.A.R.T. 重点关注：05（重分配扇区）、C5（待映射扇区）、C7（接口CRC错误，多为线材问题）；\n- 机械硬盘怕震、怕突然断电，通电工作时不要搬动机箱。\n\n【处理结论】\n数据已完整备份到新硬盘，老盘降级为不重要的临时盘使用。重要数据务必遵守"3-2-1 备份原则"：3 份副本、2 种介质、1 份异地。',
  (SELECT id FROM categories WHERE name = '计算机硬件维护'),
  '2026-08-25 14:30:00+00',
  '2026-09-01 09:00:00+00'
),
(
  '内存条接触不良的识别与处理',
  E'【典型症状】\n开机黑屏无显示、主板蜂鸣器连续长响、或系统运行中莫名蓝屏重启，都可能是内存接触不良。\n\n【处理方法】\n1. 断电后拔下内存条，用橡皮擦轻轻擦拭金手指（触点）两面，去除氧化层；\n2. 用皮吹清理内存插槽内的灰尘；\n3. 重新插入时注意听到卡扣"咔"的一声，确保两端卡扣完全扣紧；\n4. 多根内存可先单根逐一测试，定位故障条。\n\n【心得】\n橡皮擦擦金手指是维修店最常用的土办法，确实有效，原理是去除氧化层恢复导电。另外 XMP 超频不稳定也会导致蓝屏，排查时先恢复默认频率排除变量。',
  (SELECT id FROM categories WHERE name = '计算机硬件维护'),
  '2026-09-02 20:00:00+00',
  '2026-09-02 20:00:00+00'
),
(
  '光的折射与全反射笔记',
  E'【核心概念】\n光从一种介质斜射入另一种介质时，传播方向发生偏折，叫折射。折射率 n = c / v，真空中的光速与介质中光速之比。\n\n【斯涅尔定律】\nn₁sinθ₁ = n₂sinθ₂。从光密介质射向光疏介质时，折射角大于入射角；当入射角大于临界角时，发生全反射，光全部反射回原介质。\n\n【生活实例】\n1. 筷子插入水中看起来"弯折"——折射；\n2. 夏天路面远处像有积水（海市蜃楼的一种）——空气温度梯度导致折射率变化形成的全反射；\n3. 光纤通信——利用全反射让光在纤芯中长距离低损耗传输；\n4. 钻石特别闪——折射率高（约2.42），临界角小（约24°），容易在内部多次全反射。\n\n【记忆口诀】\n"空气角大"——无论折射方向如何，光在空气（光疏介质）一侧的角度总是更大。',
  (SELECT id FROM categories WHERE name = '基础自然科学常识'),
  '2026-08-22 16:00:00+00',
  '2026-08-22 16:00:00+00'
),
(
  '常见酸碱指示剂变色范围整理',
  E'【三种常用指示剂】\n1. 石蕊：pH < 5.0 红色，5.0~8.0 紫色，> 8.0 蓝色（"酸红碱蓝"）；\n2. 酚酞：pH < 8.2 无色，8.2~10.0 粉红色，> 10.0 红色（遇碱变红，酸中无色）；\n3. 甲基橙：pH < 3.1 红色，3.1~4.4 橙色，> 4.4 黄色。\n\n【为什么指示剂会变色】\n指示剂本身是弱酸或弱碱，其分子和电离出的离子颜色不同。溶液 pH 变化时电离平衡移动，两种形态比例改变，颜色随之变化。\n\n【注意事项】\n- 指示剂有变色范围而非突变点，滴定终点判断要选变色范围与等当点 pH 匹配的指示剂；\n- 强酸滴强碱用甲基橙或酚酞均可；强酸滴弱碱用甲基橙；弱酸滴强碱用酚酞；\n- 指示剂用量宜少，2~3 滴即可，加多反而干扰判断。',
  (SELECT id FROM categories WHERE name = '基础自然科学常识'),
  '2026-08-28 11:00:00+00',
  '2026-09-03 08:30:00+00'
),
(
  '牛顿三定律的生活实例',
  E'【第一定律（惯性定律）】\n物体不受外力或合力为零时保持静止或匀速直线运动。\n实例：公交车急刹车时乘客向前倾——身体因惯性保持原来的运动状态；抖掉伞上的水珠。\n\n【第二定律（F = ma）】\n加速度与合外力成正比，与质量成反比。\n实例：空购物车比满载的更容易推动；同样力度踢足球和铅球，足球飞得远。\n\n【第三定律（作用力与反作用力）】\n两个物体间的作用力和反作用力大小相等、方向相反、作用在不同物体上。\n实例：划船时桨向后推水，水向前推船；火箭向下喷气体获得向上的推力；走路时脚蹬地，地推人前进。\n\n【易混淆点】\n作用力与反作用力作用在"两个不同物体"上，不能相互抵消；平衡力作用在"同一物体"上，可以抵消。这是初学者最容易犯的错误。',
  (SELECT id FROM categories WHERE name = '基础自然科学常识'),
  '2026-09-04 19:00:00+00',
  '2026-09-04 19:00:00+00'
),
(
  '绿萝水培转土培实践记录',
  E'【起因】\n水培绿萝养了半年，根系发达但叶子越长越小，猜测是水培营养不足，决定转土培。\n\n【操作记录】\n1. 准备疏松透气的营养土（泥炭土:珍珠岩约 3:1）；\n2. 将绿萝从水中取出，用清水冲洗根系，剪掉发黑腐烂的老根；\n3. 栽入盆中，浇透定根水，放在明亮散射光处缓苗；\n4. 缓苗期约两周，期间保持土壤微湿，不施肥。\n\n【两周后观察】\n最初几天有两片老叶发黄，属于正常应激反应；一周后长出新叶尖，说明缓苗成功。\n\n【心得】\n- 水培转土培的关键是"缓苗"：根系从水生环境到土壤环境需要适应期，此时忌暴晒、忌施肥；\n- 绿萝耐阴但不等于不需要光，长期放在完全无光的角落会徒长、叶色变淡；\n- 浇水原则："见干见湿"，表土干了再浇透，宁干勿涝。',
  (SELECT id FROM categories WHERE name = '室内植物培育'),
  '2026-08-18 09:00:00+00',
  '2026-09-05 10:00:00+00'
),
(
  '多肉植物浇水频率总结',
  E'【核心原则】\n多肉原产地多为干旱地区，叶片储水能力强，最怕的不是干而是涝。烂根 90% 是浇水过多造成的。\n\n【我的浇水节奏（北方室内）】\n- 春秋生长季：约 10~14 天一次，浇则浇透（盆底孔出水为止）；\n- 夏季高温休眠期：20~30 天少量给水，沿盆边浇一圈即可，避免叶心积水；\n- 冬季：室内有暖气约 15 天一次，无暖气低温时基本断水。\n\n【判断该浇水的信号】\n1. 最可靠的信号：底部叶片微微发皱、变软——植物在消耗自身水分；\n2. 掂盆法：浇透后和快干透时的盆重差异明显，掂几次就有手感；\n3. 竹签插入土中 5 分钟，拔出干燥无潮气即可浇。\n\n【教训】\n刚入门时按"每周一次"机械浇水，两个月烂了两盆。浇水要看植物状态和环境，而不是看日历。',
  (SELECT id FROM categories WHERE name = '室内植物培育'),
  '2026-08-30 15:00:00+00',
  '2026-08-30 15:00:00+00'
),
(
  '散射光与直射光的区分心得',
  E'【概念区分】\n直射光：阳光不经过遮挡直接照射到植物上，特点是光斑边缘清晰、强度大。\n散射光：阳光经过玻璃、纱帘、树荫等介质散射后的柔和光线，明亮但不灼人。\n\n【简单判断法】\n把手放在植物叶片位置，如果手上能投出边缘清晰的浓重阴影，就是直射光；阴影模糊柔和则是散射光。\n\n【常见室内植物的光照偏好】\n- 喜直射光：多肉、仙人掌、茉莉（需要南向窗台）；\n- 喜明亮散射光：绿萝、龟背竹、白掌、虎皮兰（东向或离南窗 1~2 米）；\n- 耐弱光：一叶兰、铁线蕨（可放北向房间，但长势会慢）。\n\n【心得】\n"耐阴"不等于"喜阴"，耐阴植物只是能忍受弱光，给足明亮散射光会长得更好。另外光照不足时植物会"徒长"——茎节拉长、叶片稀疏，这是它在拼命找光，此时补光比施肥有用。',
  (SELECT id FROM categories WHERE name = '室内植物培育'),
  '2026-09-06 10:30:00+00',
  '2026-09-06 10:30:00+00'
);