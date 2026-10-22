"""마젠타(#FF00FF) 단색 배경 그림 → 투명 PNG. (몬스터 게임의 art/monsters/key.py 를 가져와 긴 변만 1200px로 바꿈)

사용: python key.py <원본.png> <결과.png>
- 가장자리와 이어진 배경, 그리고 팔·다리 사이에 갇힌 배경(진한 마젠타 핵이 있는 덩어리)을 모두 지운다.
  예전 판은 가장자리와 이어진 것만 지워서 몽돌이 팔 근처에 보라 자국이 남았다.
- 경계의 마젠타 번짐(spill)을 빼고, 캐릭터에 딱 맞게 자른 뒤 긴 변 1200px로 줄인다.
- 남은 마젠타 화소 수를 출력한다(0에 가까워야 정상).
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

T0, T1, CORE = 70.0, 190.0, 120.0  # 마젠타 세기 m = min(R,B) - G 기준

src, dst = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
m = np.minimum(R, B) - G

cand = m > T0
lab, n = ndimage.label(cand)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
core = set(np.unique(lab[m > CORE])) - {0}
keep_labels = np.array(sorted(edge | core), dtype=lab.dtype)
bg = np.isin(lab, keep_labels)
# 경계 한두 화소의 반투명 띠까지 포함
bg = ndimage.binary_dilation(bg, iterations=2) & (m > T0 * 0.5)

alpha = np.where(bg, 1 - np.clip((m - T0) / (T1 - T0), 0, 1), 1.0)
spill = np.clip(m, 0, None)
k = np.where(bg, 1.0, 0.0)
# 머리카락 사이처럼 배경 덩어리로 안 잡힌 곳의 남은 분홍기도 뺀다(갈색·피부·흰색은 m<=0이라 그대로).
k = np.maximum(k, 0.8)
rgb = np.stack([R - spill * k, G, B - spill * k], -1).clip(0, 255)
alpha = ndimage.gaussian_filter(alpha, 0.6)
alpha[alpha < 0.04] = 0

im = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
x0, y0, x1, y1 = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
pad = 12
im = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
s = 1200 / max(im.size)
if s < 1:
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
im.save(dst, optimize=True)

o = np.asarray(im).astype(np.float32)
mm = np.minimum(o[..., 0], o[..., 2]) - o[..., 1]
left = int(((o[..., 3] > 128) & (mm > 60)).sum())
print(f'{dst} {im.size} 남은 마젠타 화소 {left}')
