#!/usr/bin/env python3
"""ambientCG LeafSet024(CC0) 낱장 잎 9장으로 가로수 잎 카드용 잔가지 텍스처를 만든다.

사용: python3 make-twig-texture.py <LeafSet024 폴더> <출력 폴더>
출력: street-tree-twig_color.png(RGBA, 알파=잎), street-tree-twig_normal.png(OpenGL)
잔가지 밑동은 아래 가운데(ez-tree 잎 카드 규약)에 둔다.
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

SIZE = 1024
SEED = 24


def leaves(folder):
    """3×3 배치 아틀라스에서 잎 9장을 잘라 (색 RGBA, 노멀 RGB)로 돌려준다. 잎 끝이 위를 향한다."""
    color = Image.open(next(folder.glob('*_Color.png'))).convert('RGB')
    alpha = Image.open(next(folder.glob('*_Opacity.png'))).convert('L')
    normal = Image.open(next(folder.glob('*_NormalGL.png'))).convert('RGB')
    w, h = color.size
    out = []
    for gy in range(3):
        for gx in range(3):
            box = (gx * w // 3, gy * h // 3, (gx + 1) * w // 3, (gy + 1) * h // 3)
            a = np.asarray(alpha.crop(box))
            ys, xs = np.nonzero(a > 40)
            if len(xs) < 50:
                continue
            tight = (box[0] + xs.min(), box[1] + ys.min(), box[0] + xs.max() + 1, box[1] + ys.max() + 1)
            rgba = color.crop(tight).copy()
            rgba.putalpha(alpha.crop(tight))
            out.append((rgba, normal.crop(tight)))
    return out


def rotate_normal(img, degrees):
    """노멀맵 이미지를 회전하고 접선 평면 벡터(XY)도 같은 각도로 돌린다."""
    rad = math.radians(degrees)
    arr = np.asarray(img.rotate(degrees, resample=Image.BICUBIC, expand=True, fillcolor=(128, 128, 255))).astype(np.float32) / 127.5 - 1
    x, y = arr[..., 0], arr[..., 1]
    # PIL은 반시계 회전, 이미지 y축은 아래 방향이므로 벡터는 화면 기준 반시계로 회전.
    rx = x * math.cos(rad) - y * math.sin(rad)
    ry = x * math.sin(rad) + y * math.cos(rad)
    arr[..., 0], arr[..., 1] = rx, ry
    return Image.fromarray(np.clip((arr + 1) * 127.5, 0, 255).astype(np.uint8))


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    parts = leaves(src)
    rng = np.random.default_rng(SEED)
    color = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    normal = Image.new('RGB', (SIZE, SIZE), (128, 128, 255))
    # 줄기: 아래 가운데에서 위로 약간 휘어 올라간다.
    stem = [(SIZE / 2 + 18 * math.sin(t * 2.4), SIZE - 8 - t * (SIZE - 150)) for t in np.linspace(0, 1, 40)]
    draw = ImageDraw.Draw(color)
    for i in range(len(stem) - 1):
        width = int(7 - 4 * i / len(stem))
        draw.line([stem[i], stem[i + 1]], fill=(92, 74, 52, 255), width=max(2, width))
    # 잎: 좌우로 번갈아, 위로 갈수록 작게. 마지막은 끝잎.
    slots = [(0.10 + 0.058 * i, -1 if i % 2 == 0 else 1) for i in range(15)] + [(1.0, 0)]
    for k, (t, side) in enumerate(slots):
        rgba, nrm = parts[k % len(parts)]
        if rng.random() < .5:  # 같은 잎이 반복돼 보이지 않게 좌우 반전(노멀 X도 반전)
            rgba = rgba.transpose(Image.FLIP_LEFT_RIGHT)
            n = np.asarray(nrm.transpose(Image.FLIP_LEFT_RIGHT)).copy()
            n[..., 0] = 255 - n[..., 0]
            nrm = Image.fromarray(n)
        length = SIZE * (0.215 - 0.075 * t) * rng.uniform(.9, 1.1)
        scale = length / rgba.height
        rgba = rgba.resize((max(1, int(rgba.width * scale)), max(1, int(length))), Image.LANCZOS)
        nrm = nrm.resize(rgba.size, Image.LANCZOS)
        angle = 0 if side == 0 else side * rng.uniform(46, 66)  # 줄기에서 벌어지는 각도
        rot = -angle
        leaf = rgba.rotate(rot, resample=Image.BICUBIC, expand=True)
        leafn = rotate_normal(nrm, rot)
        sx, sy = stem[min(len(stem) - 1, int(t * (len(stem) - 1)))]
        # 잎자루(잎 아래 끝)를 줄기 점에 맞춘다.
        rad = math.radians(angle)
        base = (sx + math.sin(rad) * length / 2, sy - math.cos(rad) * length / 2)
        pos = (int(base[0] - leaf.width / 2), int(base[1] - leaf.height / 2))
        color.alpha_composite(leaf, pos)
        mask = leaf.split()[3]
        normal.paste(leafn, pos, mask)
    color.save(out / 'street-tree-twig_color.png', optimize=True)
    normal.save(out / 'street-tree-twig_normal.png', optimize=True)
    a = np.asarray(color.split()[3])
    print({'leaves': len(parts), 'coverage': round(float((a > 128).mean()), 3), 'size': SIZE})


if __name__ == '__main__':
    main()
