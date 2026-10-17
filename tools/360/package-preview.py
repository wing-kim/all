#!/usr/bin/env python3
"""Build a minimal public review artifact without changing the source checkout."""
import argparse
import datetime as dt
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
RUNTIME_FILES = {'cafe.js', 'integrated.js', 'environment.js', 'viewer.js',
                 'scene.js', 'modern.js', 'viewer.css'}
ASSET_SUFFIXES = {'.js', '.jpg', '.jpeg', '.png', '.webp', '.hdr', '.glb',
                  '.gltf', '.bin', '.wasm', '.tza', '.json', '.txt'}
LITERAL = re.compile(r'''(["'])([^"'\n<>]{1,240})\1''')
EXTENSION = re.compile(r'\.(?:js|css|jpg|jpeg|png|webp|hdr|glb|gltf|bin|wasm|tza|json)(?:\?[^\s]*)?$')


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()


def audit(out, paths):
    missing, remote, checked = set(), set(), set()
    for rel in paths:
        if rel.suffix not in {'.html', '.js', '.css', '.json', '.gltf'}:
            continue
        source = (out / rel).read_text(errors='replace')
        # Module paths resolve against module URL; scene's 360/... loader paths
        # resolve against the containing viewer document at new/3d-model.html.
        if rel.suffix == '.gltf':
            # glTF image names are labels, not dependencies. Only URI fields load files.
            def uris(value):
                if isinstance(value, dict):
                    for key, item in value.items():
                        if key == 'uri' and isinstance(item, str):
                            yield item
                        else:
                            yield from uris(item)
                elif isinstance(value, list):
                    for item in value:
                        yield from uris(item)
            values = uris(json.loads(source))
        else:
            values = (value for _, value in LITERAL.findall(source))
        for value in values:
            if not EXTENSION.search(value) or any(c.isspace() for c in value):
                continue
            if value.startswith(('https://', 'http://', '//')):
                remote.add(value)
                continue
            if value.startswith(('data:', 'blob:', '#')) or '${' in value:
                continue
            if value.startswith('360/'):
                target = Path('new') / urlsplit(value).path
            elif value.startswith(('./', '../')):
                target = rel.parent / unquote(urlsplit(value).path)
            elif rel.suffix == '.gltf':
                target = rel.parent / unquote(urlsplit(value).path)
            else:
                continue  # Bare names may be extension patterns, not URLs.
            key = f'{rel}: {value}'
            checked.add(key)
            if not (out / target).is_file():
                missing.add(key)
    return {'checked_local_references': len(checked),
            'missing_local_references': sorted(missing),
            'remote_references': sorted(remote),
            'limitations': [
                'Static literal audit only; computed URLs require browser/network verification.',
                'Original photo catalog tries sibling media repos and render/manifest.js before/after its remote fallback; these optional fallback probes may return 404.',
                'External photo catalogs, CDN resources and remote model/texture URLs require network access.',
                'This audit does not establish visual quality or feature parity.'
            ]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', required=True, type=Path,
                        help='New, non-existent output directory outside the source repository')
    parser.add_argument('--mirror-base', metavar='GIT_REF',
                        help='Copy the whole published site at this ref (e.g. origin/main) first, '
                             'then overlay only the photoreal runtime, so the preview equals production plus this feature')
    args = parser.parse_args()
    out = args.out.expanduser().resolve()
    if out == ROOT or ROOT in out.parents or out in ROOT.parents:
        parser.error('output must be outside the source repository and cannot be its ancestor')
    if out.exists():
        parser.error('output must not exist; no existing files are overwritten')
    commit = git('rev-parse', 'HEAD')
    dirty = bool(git('status', '--porcelain'))
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    paths = [Path('new/3d-model.html')]
    # Only this visual review page and its three images are public; other project
    # documents and offline bake sources remain outside the deployment artifact.
    paths += [Path('docs/360') / name for name in (
        'cafe-review.html', 'cafe-ambient-before.jpg', 'cafe-ambient-denoised.jpg')]
    paths += [Path('new/360') / name for name in sorted(RUNTIME_FILES)]
    for directory in ('assets', 'renderer-chunks'):
        paths += sorted(p.relative_to(ROOT) for p in (ROOT / 'new/360' / directory).rglob('*')
                        if p.is_file() and p.suffix.lower() in ASSET_SUFFIXES)
    # Resolve every candidate before creating output, rejecting symlinks outside
    # the allowlisted subtree and unknown assets with secret-like names.
    for rel in paths:
        source = ROOT / rel
        if not source.is_file() or source.is_symlink() or ROOT not in source.resolve().parents:
            parser.error(f'invalid source: {rel}')
        if any(token in source.name.lower() for token in ('.env', 'credential', 'secret', 'token')):
            parser.error(f'sensitive-looking filename: {rel}')
    out.mkdir(parents=True)
    mirrored = []
    base_commit = None
    if args.mirror_base:
        # 운영 사이트(main:/) 전체를 먼저 그대로 풀고, 아래에서 이번 기능의 런타임 파일만 덮어쓴다.
        base_commit = git('rev-parse', args.mirror_base)
        archive = subprocess.check_output(['git', '-C', str(ROOT), 'archive', '--format=tar', base_commit])
        subprocess.run(['tar', '-x', '-C', str(out)], input=archive, check=True)
        mirrored = sorted(p.relative_to(out) for p in out.rglob('*') if p.is_file())
    for rel in paths:
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / rel, out / rel)
    mirror_links = [('운영과 같은 첫 화면 · 신축 진행 대시보드 (new/)', 'new/'),
                    ('3D 모델 · 운영과 같은 화면에 보기 방식 \u2018실사 3D\u2019 추가', 'new/3d-model.html'),
                    ('원본 그대로(추가 기능 끔) · 비교용', 'new/3d-model.html?lab=off')] if args.mirror_base else []
    links = mirror_links + [('통합 실사 3D 검토 · 바로 실사로 시작', 'new/3d-model.html?lab=review'),
             ('카페 · 원본 UI와 연결된 3D', 'new/3d-model.html?lab=review&view=cafe'),
             ('카페 · 원본 실사와 나란히 비교', 'new/3d-model.html?lab=review&view=cafe&compare=1'),
             ('간접광 베이크 시험 · 호환 구조에서만 적용', 'new/3d-model.html?lab=review&view=cafe&ambientBake=study'),
             ('화면·성능 비교 기록', 'docs/360/cafe-review.html'),
             ('기존 모드 검토', 'new/3d-model.html')]
    intro = (f'운영 사이트(wing-kim.github.io/all, main {base_commit[:7]}) 전체를 그대로 옮기고 실사 3D 표현 모드만 더한 검토본입니다. '
             '경로도 운영과 같습니다(/new/, /new/3d-model.html). 운영 사이트는 변경하지 않습니다.') if base_commit else \
            '기존 앱에 추가하는 실사 3D 모드의 격리된 검토본입니다. 기능 연결 및 시각 품질은 검증 중이며 기존 운영 사이트는 변경하지 않습니다.'
    buttons = ''.join(f'<a href="{html.escape(url, quote=True)}">{label}</a>' for label, url in links)
    (out / 'index.html').write_text(f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cape Horn · 실험 검토</title><style>body{{font:18px system-ui;background:#111b23;color:#ecf1f5;max-width:780px;margin:10vh auto;padding:24px}}a{{display:block;background:#d9ecda;color:#13241b;padding:20px;margin:14px 0;border-radius:8px;text-decoration:none}}small{{overflow-wrap:anywhere}}</style><main><h1>Cape Horn · 실험 검토</h1><p>{intro}</p>{buttons}<small>Source commit: {commit}<br>Build UTC: {timestamp}<br>Working tree changes: {str(dirty).lower()}</small></main></html>''')
    report = audit(out, paths)
    report.update({'commit': commit, 'build_utc': timestamp, 'working_tree_dirty': dirty,
                   'test_links': [url for _, url in links],
                   'mirror_base': base_commit,
                   'mirrored_file_count': len(mirrored),
                   'overlaid_from_mirror': sorted(str(p) for p in set(mirrored) & set(paths)),
                   'copied_file_count': len(paths),
                   'copied_bytes': sum((out / p).stat().st_size for p in paths),
                   'files': [str(p) for p in paths]})
    (out / 'preview-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: report[k] for k in ('commit', 'copied_file_count', 'copied_bytes', 'missing_local_references')}, indent=2))
    print(f'Output: {out}')
    if report['missing_local_references']:
        raise SystemExit('Static dependency audit failed; inspect preview-audit.json before publishing')


if __name__ == '__main__':
    main()
