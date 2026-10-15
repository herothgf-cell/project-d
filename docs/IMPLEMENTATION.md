# Mobile v0.2 Implementation Plan

Goal: 모바일 우선 몸 나눠쓰기 12개 퍼즐과 PC 테스트 환경을 GitHub Pages에 제공한다.
Architecture: DOM-free UMD rules + replay-validated session/store + local level data + canvas view.
Tech stack: vanilla JS/CSS, Node 22 built-in tests/server, Python Playwright UI verification.
Spec: DESIGN.md

1. [x] 기존 규칙 회귀 검사 → 실패 판정/저장 세션 테스트 RED → 구현 GREEN.
   Files: src/core.js, src/session.js, tests/*.test.js.
   Interfaces: classify(level,state), fresh(level), step/undo/reset, pack/restore.
2. [x] 12개 스테이지 구성, 실제 해답 및 선택/막힘 경로 검사.
   Files: src/levels.js, scripts/verify-levels.cjs, docs/LEVELS.md.
   Solver limit is unknown, not unsolvable. 난이도 라벨은 플레이 테스트 전 가설.
3. [x] 모바일/PC 입력 UI, 시범 분리, 저장, PC 테스트 모드 UI tests RED → GREEN.
   Files: index.html, src/style.css, src/app.js, tests/ui_test.py.
   Key cases: reload+undo, denied/corrupt storage, win+undo, pointercancel, long swipe, dialog keyboard isolation.
4. [x] build/dev commands and CI/Pages workflow. Relative URL paths. No runtime CDN.
   Files: package.json, scripts/*.cjs, .github/workflows/pages.yml, README.md.
5. [ ] Fresh full verification, screenshots, review, push non-destructively, check CI/Pages state.

## Review focus
Won takes precedence over blocked; original history immutable; invalid input does not count.
Hint demonstration never modifies saved play. Schema/level changes cannot restore an impossible board.
Only one move per gesture; mobile layouts from 320px; controls usable when browser chrome is present.
No claim of real iOS/Android tests from emulation alone. Never equate search cap to failure.
