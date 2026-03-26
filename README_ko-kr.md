# PR Tracer

**코드 한 줄의 출처를 원본 Pull Request까지 추적합니다** — 에디터를 떠나지 않고.

PR Tracer는 _"이 코드가 왜 여기 있지?"_ 라는 질문에 3초 만에 답합니다. 커서를 라인에 놓고, git blame을 통해 추적하여, 해당 코드를 도입한 PR을 확인하세요 — VSCode 안에서 모든 것이 완료됩니다.

## 설치

[VSCode Marketplace](https://marketplace.visualstudio.com/)에서 **PR Tracer**를 검색하고 **Install**을 클릭하거나, 다음 명령을 실행하세요:

```
ext install vincent-kkelvin.pr-tracer
```

## 기능

### PR 추적

라인을 우클릭하거나 커맨드 팔레트에서 원본 Pull Request까지 추적합니다.

- **알림 메시지**: PR 제목과 함께 "Open PR", "Copy Link" 버튼 제공
- **상세 보기**: 전체 추적 체인을 사이드 패널에 표시 (커밋 → 머지 → PR → 이슈)
- **인라인 데코레이션**: 추적된 라인 위에 CodeLens로 `PR #42: title` 표시 (Show Details, Dismiss 액션 포함, 파일을 닫으면 자동으로 숨겨짐)

### 두 가지 추적 모드

| 모드 | 설명 |
| --- | --- |
| **Change** (기본) | 해당 라인을 마지막으로 수정한 PR을 추적 |
| **Origin** | 리네임/이동 이력을 따라 코드를 최초 생성한 PR까지 추적 |

초기 추적 후 호버 툴팁에서 두 모드 모두 접근할 수 있습니다.

### 호버 툴팁

라인이 추적된 후 라인 끝 뒤에 커서를 올리면 리치 툴팁이 표시됩니다:

- PR 번호와 제목 (직접 링크 포함)
- 액션 버튼: **Copy Link**, **Show Details**
- 추적 버튼: **Re-trace**, **Origin**
- Change와 Origin 결과가 모두 캐시된 경우, 두 결과를 비교하여 함께 표시

### 범위 추적

여러 라인을 선택하여 전체 범위를 한 번에 추적합니다.

### 그래프 탐색

PR 번호를 입력하여 플랫폼 API를 통해 연결된 이슈를 탐색합니다.

### 헬스 체크

운영 레벨과 플랫폼 연동 상태를 확인합니다.

| 레벨 | 조건 | 사용 가능 기능 |
| --- | --- | --- |
| 0 | Git만 존재 | 커밋 수준 추적 |
| 1 | CLI 감지, 인증 제한 | 기본 PR 식별 |
| 2 | 완전 인증 | 전체 PR/이슈 메타데이터 |

### 상태 바

하단 상태 바에 운영 레벨 표시기가 상시 표시됩니다. 클릭하면 헬스 체크를 실행합니다.

### 상세 패널

전체 추적 체인을 렌더링하는 웹뷰 사이드 패널:

- **Original Commit** → **Cosmetic Commit** → **Merge Commit** → **Pull Request** → **Issue**
- 신뢰도, 추적 방식, 머지 날짜, 연결된 URL 표시
- VSCode 테마 변수를 사용한 완전한 테마 지원

## 사용법

1. Git 리포지토리의 파일을 엽니다
2. 커서를 라인에 놓습니다
3. **PR Tracer: Trace PR**을 실행합니다:
   - 커맨드 팔레트 (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - 우클릭 컨텍스트 메뉴
   - 호버 툴팁 링크 (라인 텍스트 끝 뒤)

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `PR Tracer: Trace PR` | 현재 라인의 원본 PR 추적 |
| `PR Tracer: Trace PR (Range)` | 선택한 라인 범위 추적 |
| `PR Tracer: Explore Graph` | PR → 이슈 그래프 탐색 |
| `PR Tracer: Health Check` | 운영 레벨 및 플랫폼 상태 확인 |
| `PR Tracer: Clear Cache` | 캐시된 추적 데이터 삭제 |

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `prTracer.enabled` | `true` | 확장 프로그램 활성화/비활성화 |
| `prTracer.hoverProvider.enabled` | `true` | 호버 툴팁에 추적 정보 표시 |
| `prTracer.inlineDecoration.enabled` | `true` | 추적 후 인라인 PR 번호 표시 |
| `prTracer.inlineDecoration.timeout` | `30` | 데코레이션 자동 제거 시간 (초, 0 = 제거 안 함) |
| `prTracer.trace.deep` | `false` | squash 머지를 위한 딥 추적 활성화 |
| `prTracer.trace.noAst` | `false` | AST 분석 비활성화 |
| `prTracer.trace.noCache` | `false` | 캐싱 비활성화 |

## 요구 사항

- VSCode 1.85+
- Git 리포지토리 (로컬 파일시스템만 지원 — 가상/원격 워크스페이스는 지원하지 않음)
- **레벨 1+**: [GitHub CLI](https://cli.github.com/) (`gh`) 또는 [GitLab CLI](https://gitlab.com/gitlab-org/cli) (`glab`) 설치
- **레벨 2**: CLI 인증 완료 (`gh auth login` / `glab auth login`)

## 키보드 단축키

기본 단축키는 등록되어 있지 않습니다. `Cmd+K Cmd+S` (macOS) / `Ctrl+K Ctrl+S` (Windows/Linux)에서 직접 설정하세요:

| 추천 단축키 | 명령어 |
| --- | --- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | `prTracer.tracePR` |

## 지원 플랫폼

| 플랫폼 | CLI | 상태 |
| --- | --- | --- |
| GitHub | `gh` | 지원 |
| GitLab | `glab` | 지원 |

## 라이선스

MIT
