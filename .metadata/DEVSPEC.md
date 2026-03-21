# Line Lore VSCode Extension — Project Overview

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | Line Lore |
| **레포지토리** | `line-lore-vscode` |
| **Marketplace ID** | `lumy-pack.line-lore` |
| **핵심 의존성** | `@lumy-pack/line-lore` (node module) |
| **대상 환경** | VSCode 1.85+ (2024.01~), Node.js >= 20 |
| **라이선스** | MIT |

### 한 줄 요약

에디터에서 코드 라인을 선택하면, 해당 라인이 도입된 Pull Request를 역추적하여 보여주는 VSCode 확장.

### 핵심 가치

- **개발자가 "이 코드 왜 이렇게 됐지?"라는 질문에 3초 안에 답을 얻는다.**
- Git blame → PR → Issue 까지의 계보를 에디터 안에서 완결한다.
- API 호출은 사용자의 명시적 의도(클릭)가 있을 때만 발생한다.

---

## 2. 제약 사항 및 고려 사항

### 2.1 `@lumy-pack/line-lore`의 런타임 의존성

line-lore는 내부적으로 `git`, `gh`, `glab` CLI를 `child_process`로 호출한다.
VSCode 확장의 Extension Host는 Node.js 프로세스이므로 `child_process` 사용에 문제 없음.
단, **Web Extension (브라우저 기반 VSCode)** 에서는 동작 불가 — `package.json`의 `capabilities`에 명시 완료.

### 2.2 API 호출 비용

- Hover 시점에서는 API 호출 없음 (command link만 렌더링)
- trace 실행 시에만 API 호출 발생
- line-lore 내장 캐싱이 중복 호출 방지
- Rate limit 에러는 사용자에게 명시적으로 안내

### 2.3 성능

- trace() 호출은 비동기이며, git blame + API 호출 포함 시 수백ms~수초 소요 가능
- StatusBar 스피너로 진행 상태 표시 필수
- cancellation token 지원 고려 (사용자가 ESC로 취소)

---

## 3. 결정 사항 (Resolved Decisions)

| # | 질문 | 결정 | 비고 |
|---|------|------|------|
| 1 | dependency 전략 | **Bundled dependency** | esbuild로 `@lumy-pack/line-lore`를 확장 번들에 포함. 사용자가 별도 설치할 필요 없음. |
| 2 | Webview 스타일링 | **VSCode 테마 연동** | `--vscode-*` CSS 변수를 사용하여 Light/Dark/High Contrast 테마에 자동 적응. |
| 3 | 키바인딩 | **기본 등록 안 함** | `package.json`의 `commands`에 command만 정의. 사용자가 Keyboard Shortcuts에서 자유롭게 바인딩 가능. |
| 4 | Range trace 표시 | **관계 기반 그룹핑** | 동일 PR에 속하는 라인들은 그룹으로 묶어 표시. 서로 다른 PR이면 별도 항목으로 나열하되, "이 범위가 N개의 서로 다른 PR에서 유래했습니다" 안내 문구 표시. |
| 5 | `cwd` 처리 | **Adapter에서 workspace root 주입** | VSCode 확장 표준 패턴: `vscode.workspace.getWorkspaceFolder(uri).uri.fsPath`를 cwd로 사용하고, file은 해당 root 기준 상대 경로로 변환하여 전달. Multi-root workspace에서도 정확한 git root 보장. |

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [API-SPEC.md](./API-SPEC.md) | `@lumy-pack/line-lore` 프로그래매틱 API 정의 (검증 완료, 2026-03-22 Accepted) |
| [UX-SPEC.md](./UX-SPEC.md) | UX 설계 (진입점, 결과 표시, 상태 표시, 에러 표시) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 기술 아키텍처, 모듈 구조, 빌드 |
| [CONFIGURATION.md](./CONFIGURATION.md) | 확장 설정, package.json 매니페스트 |
| [PHASES.md](./PHASES.md) | 구현 페이즈 (Phase 1~3) |
| [PLAN.md](./PLAN.md) | 개발 계획 |
