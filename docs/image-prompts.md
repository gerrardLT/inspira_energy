# Inspira Energy — AI 图片生成提示词

> **品牌色系**：深海军蓝 `#051937` / 金色 `#C4963A` / 青绿 `#2A8A7A`
>
> **推荐工具**：Midjourney / DALL-E 3 / Stable Diffusion / 即梦 / 通义万相
>
> **本文档不含导航页 Hero 背景图**（`hero-*.png` 已定稿，无需重新生成）

---

## 通用设置（每张都加）

**统一风格后缀**（拼在每条提示词末尾）：

```
shot on Hasselblad, cinematic color grading, deep navy blue (#051937) dominant tone with warm gold (#C4963A) accents, dramatic directional lighting, fine film grain, high contrast, institutional luxury finance aesthetic, photorealistic, 8K
```

**统一负面提示词**（Negative prompt，场景图通用）：

```
text, words, letters, watermark, logo, signature, people, faces, crowds, cartoon, illustration, 3d render, oversaturated, lens flare overload, distorted, blurry, low quality, cluttered
```

---

## 一、基金详情图（4 张，3:2，1200×800）

> 放置路径：`public/images/funds/{name}.png`

### 1. 债权基金 `debt.png` — 强调"稳健、固定收益"

```
A single modern wind turbine standing tall against a calm twilight sky, viewed from a stable low angle conveying stability and reliability, muted navy blue gradient sky with a thin band of gold on the horizon, still and serene atmosphere, minimalist composition with lots of negative space, sense of dependable long-term income
```

### 2. 股权基金 `equity.png` — 强调"规模、增长"

```
Expansive aerial top-down view of a massive solar farm forming a vast geometric grid of photovoltaic panels stretching to the horizon, strong perspective lines conveying scale and growth, late afternoon golden light casting long shadows between panel rows, deep navy shadows, sense of large-scale capital and expansion
```

### 3. 开发基金 `development.png` — 强调"在建、早期"

```
A solar farm under construction at dawn, half-installed photovoltaic panels with visible mounting structures and a crane in the misty distance, partially completed rows showing work in progress, soft golden sunrise breaking through morning haze, dynamic sense of building and creation, navy-toned shadows
```

### 4. 运营基金 `cod.png` — 强调"已并网、稳定运营"

```
A fully operational solar power plant at blue hour, neat rows of panels with a substation and transmission towers softly lit in the background, steady warm glow reflecting off panel surfaces, calm and mature atmosphere of a completed revenue-generating asset, deep navy sky with subtle gold
```

---

## 二、团队头像（3 张，1:1，600×600）

> 放置路径：`public/images/team/{name}.png`
>
> 头像专用负面词：`text, watermark, logo, cartoon, 3d render, distorted face, extra fingers, blurry, low quality`

### 1. 陈伟 — 管理合伙人 `wei.png`

```
Professional studio headshot of a distinguished East Asian man in his late 40s, short neat graying hair, wearing a charcoal navy tailored suit with no tie, calm authoritative expression with a faint confident smile, looking directly at camera, dark gradient charcoal background, soft Rembrandt lighting with subtle warm gold rim light, shallow depth of field, executive portrait, photorealistic, 8K
```

### 2. Sarah Lim — 投资主管 `sarah.png`

```
Professional studio headshot of a poised East Asian woman in her mid 30s, sleek shoulder-length black hair, wearing a dark navy blazer, intelligent approachable expression with a slight smile, looking directly at camera, dark gradient charcoal background, soft butterfly lighting with warm gold rim light, shallow depth of field, executive portrait, photorealistic, 8K
```

### 3. 张大为 — 中国业务总监 `david.png`

```
Professional studio headshot of a confident East Asian man in his early 40s, short black hair, wearing a dark slate blue suit with open collar, friendly determined expression, looking directly at camera, dark gradient charcoal background, soft loop lighting with warm gold accent, shallow depth of field, executive portrait, photorealistic, 8K
```

---

## 三、开发商服务图（3 张，3:2，1200×800）

> 放置路径：`public/images/services/{name}.png`

### 1. 项目联合投资 `coinvest.png` — 强调"合作、共同投资"

```
Two adjacent solar farm sections meeting at a clean dividing line seen from aerial perspective, symbolizing partnership and joint ownership, golden hour light evenly across both halves, deep navy shadows, balanced symmetrical composition conveying collaboration and shared capital
```

### 2. 许可证转让 `permit.png` — 强调"前期、土地、规划"

```
Aerial view of an undeveloped land parcel marked with survey stakes and boundary markers at the edge of an existing solar installation, planning and pre-construction stage, soft golden morning light over open terrain, sense of opportunity and project rights transfer, navy-toned distant landscape
```

### 3. 商业运营收购 `cod-acquisition.png` — 强调"成熟资产、收购"

```
A mature operational wind and solar hybrid site at golden sunrise, spinning turbine blades and rows of panels working in harmony, established infrastructure conveying a proven revenue-generating asset ready for acquisition, warm gold light, deep navy sky
```

---

## 四、洞察文章封面（8 张，4:3，800×600）

> 放置路径：`public/images/insights/art-{n}.png`

### 1. 东南亚太阳能部署 `art-1.png`

```
Aerial view of a solar farm integrated into a lush tropical Southeast Asian landscape, palm trees and green hills surrounding blue panels, humid golden afternoon light, navy shadows
```

### 2. 欧盟碳边境税 (CBAM) `art-2.png`

```
Conceptual split scene: a heavy industrial factory with cooling towers on one side dissolving into clean wind turbines on the other, symbolizing carbon transition policy, dramatic gold-to-navy gradient sky, moody atmospheric
```

### 3. 电池储能 `art-3.png`

```
Rows of large white grid-scale battery energy storage containers in an outdoor facility, clean industrial composition, cool blue tones with warm gold edge lighting at dusk, navy sky
```

### 4. 基金动态 `art-4.png`

```
Abstract financial concept image: elegant glowing gold light trails and ascending data-flow lines over a deep navy background, premium institutional finance visualization, soft bokeh, no charts no numbers
```

### 5. 澳大利亚 CIS 招标 `art-5.png`

```
Aerial view of a solar farm on the red Australian outback earth, striking contrast between rust-red soil and deep blue photovoltaic panels, harsh golden sunlight, vast arid landscape, navy sky
```

### 6. ESG 影响力报告 `art-6.png`

```
A solar installation seamlessly blended into a thriving green meadow with wildflowers, harmony between renewable technology and nature, soft golden backlight, fresh and optimistic mood, navy-toned distant treeline
```

### 7. 中国绿色电力 `art-7.png`

```
Aerial view of vast rooftop solar panels covering modern industrial factory buildings in China, repeating geometric blue patterns from above, hazy golden urban light, navy shadows
```

### 8. 越南 PDP8 电力规划 `art-8.png`

```
A solar farm bordering terraced green rice paddies in the Vietnamese countryside, water reflections between panels, warm golden sunset, peaceful rural development scene, navy sky
```

---

## 五、社会证明配图（2 张，4:3，600×450）

> 放置路径：`public/images/testimonials/project-{n}.png`

### 1. 越南太阳能项目 `project-1.png`

```
Ground-level wide shot of a completed solar farm in Vietnam at golden hour, panels receding toward green tropical hills, warm sunlight glancing across panel surfaces, sense of a successful delivered project, navy sky with gold horizon
```

### 2. 基础设施投资 `project-2.png`

```
Cinematic aerial of a large-scale hybrid solar-and-wind energy installation at sunset, turbines and panel arrays coexisting across the landscape, golden light unifying the scene, conveying major infrastructure scale, deep navy sky
```

---

## 六、文件目录结构

```
public/images/
├── funds/
│   ├── debt.png
│   ├── equity.png
│   ├── development.png
│   └── cod.png
├── team/
│   ├── wei.png
│   ├── sarah.png
│   └── david.png
├── services/
│   ├── coinvest.png
│   ├── permit.png
│   └── cod-acquisition.png
├── insights/
│   ├── art-1.png  ~  art-8.png
└── testimonials/
    ├── project-1.png
    └── project-2.png
```

**合计：20 张**（4 基金 + 3 头像 + 3 服务 + 8 洞察 + 2 社会证明）

---

## 使用说明

1. 复制对应提示词到 AI 绘图工具，末尾拼上"统一风格后缀"，并填入"统一负面提示词"
2. 生成后按上方文件名保存到 `public/images/` 对应目录
3. 注意比例：基金/服务图 3:2，头像 1:1，洞察图 4:3，社会证明 4:3
4. 图片就位后通知我，我会核对代码中的路径引用是否正确
