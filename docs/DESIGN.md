# Theme Name: 手写笔记本
# Vibe & Description: 手写字体，单色纹理，采用灰度调色板，强调排版层次结构，模拟笔记本的感觉。

# Color
- 严格限制色彩，仅使用纯黑、深灰、浅灰和纸张白。
- 模拟“铅笔在白纸上”的效果。背景使用极淡的纹理白（#FDFBF7 或 纯白带噪点），文字使用石墨灰（#333333），强调色使用深炭黑（#000000）。这种配色传达出专注、纯粹、理性的情感。

# Font
- Heading: YangRenDongZhuShiTi-Semibold (url: https://resource-static.bj.bcebos.com/fonts/YangRenDongZhuShiTi-Semibold.woff2)
- Body: YangRenDongZhuShiTi-Regular (url: https://resource-static.bj.bcebos.com/fonts/YangRenDongZhuShiTi-Regular.woff2)
# Animation
-  鼠标悬停时，元素会有微小的“浮动”或线条重绘效果，仿佛笔触在加深。点击时有“按压”纸张的反馈。
-  元素出现时采用“书写”动画（Stroke animation）或“淡入+轻微位移”，模拟文字被写在纸上的过程。

# Layout
- 元素像是在纸上随意拼贴或书写，稍微的错位和旋转（1-2度）增加真实感。使用左侧“装订线”或顶部“螺旋线圈”作为视觉锚点，但保持页面主体的自由度。
- 页面布局宽松，模拟随意但有条理的笔记习惯。

# Elements
- 按钮和卡片使用 SVG 滤镜或 CSS `border-image` 模拟手绘线条。
- 涂改痕迹: 强调文字或链接时，使用类似荧光笔（灰色）或下划线的涂鸦效果。
- 纸张纹理: 背景叠加一层淡淡的纸张纹理噪点（使用生图或搜图工具）。
- 所有的边框、分割线都模拟手绘的自然抖动感（Rough.js 风格）。