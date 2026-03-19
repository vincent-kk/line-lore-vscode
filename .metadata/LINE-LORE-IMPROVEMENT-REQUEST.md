# Line Lore VSCode Extension — line-lore Improvement Request

## 1. 요청 배경

`line-lore-vscode`는 `@lumy-pack/line-lore`를 CLI보다 TypeScript 라이브러리로 소비하려는 사용 사례를 가진다.

현재 `line-lore`는 CLI 기능이 풍부하지만, 라이브러리 API 관점에서는 다음 문제가 있다.

- 공개 API와 README 설명이 완전히 일치하지 않는다.
- CLI 전용 옵션이 라이브러리 타입에 섞여 있다.
- graph 기능은 공개되어 있지만, 실제 소비하기 쉬운 고수준 진입점이 부족하다.
- 일부 옵션은 문서에 존재하지만 실제 동작 연결이 약하다.

이 문서는 현재 코드 기준 문제를 정리하고, 라이브러리 소비성 향상을 위한 기능 개선 및 문서 개선을 요청하기 위한 문서이다.

---

## 2. 현재 상태 진단

### 2.1 실제 공개 export

현재 루트 공개 API는 아래와 같다.

```1:46:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/index.ts
// Public API — Core functions
export { clearCache, health, trace } from './core/core.js';
export type { TraceFullResult } from './core/core.js';

// Public API — Issue graph
export { traverseIssueGraph } from './core/issue-graph/index.js';
export type { GraphTraversalOptions } from './core/issue-graph/index.js';
```

요약:

- `trace`, `health`, `clearCache`는 바로 사용 가능
- graph는 `traverseIssueGraph`만 공개
- `detectPlatformAdapter`와 `createAdapter`는 루트 공개 API에 없음

### 2.2 graph API의 공개 경계 문제

현재 graph 순회 함수는 `PlatformAdapter`를 직접 요구한다.

```13:18:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/core/issue-graph/issue-graph.ts
export async function traverseIssueGraph(
  adapter: PlatformAdapter,
  startType: 'pr' | 'issue',
  startNumber: number,
  options?: GraphTraversalOptions,
): Promise<GraphResult> {
```

반면 CLI는 내부 비공개 경로로 어댑터를 얻는다.

```20:24:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/commands/graph.tsx
try {
  const { adapter } = await detectPlatformAdapter();
  const result = await traverseIssueGraph(adapter, 'pr', prNumber, {
    maxDepth: depth,
  });
```

즉 현재 공개 API만으로는 CLI 수준의 graph 사용성을 그대로 재현하기 어렵다.

### 2.3 CLI 전용 옵션이 라이브러리 타입에 섞여 있음

`TraceOptions`에는 현재 라이브러리 핵심 옵션과 출력 포맷 옵션이 함께 들어 있다.

```17:39:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/types/trace.ts
export interface TraceOptions {
  file: string;
  line: number;
  endLine?: number;
  remote?: string;
  json?: boolean;
  deep?: boolean;
  graphDepth?: number;
  noAst?: boolean;
  noCache?: boolean;
  output?: 'human' | 'json' | 'llm';
  quiet?: boolean;
}
```

하지만 실제 포맷 분기는 CLI 레이어에 존재한다.

```44:53:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/commands/trace.tsx
let output: string;
if (options.quiet) {
  output = formatQuiet(result);
} else if (options.json || options.output === 'json') {
  output = formatJson(result);
} else if (options.output === 'llm') {
  output = formatLlm(result);
} else {
  output = formatHuman(result);
}
```

즉 `json`, `output`, `quiet`는 라이브러리 의미보다 CLI 출력 옵션에 가깝다.

### 2.4 `deep`, `graphDepth`, `noCache`의 실동작 연결 부족

현재 `deep`와 `graphDepth`는 `featureFlags` 계산에 반영되지만, 핵심 추적 로직 연결은 제한적이다.

```39:49:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/core/core.ts
function computeFeatureFlags(
  operatingLevel: OperatingLevel,
  options: TraceOptions,
): FeatureFlags {
  return {
    astDiff: isAstAvailable() && !options.noAst,
    deepTrace: operatingLevel === 2 && (options.deep ?? false),
    commitGraph: false,
    issueGraph: operatingLevel === 2 && (options.graphDepth ?? 0) > 0,
    graphql: operatingLevel === 2,
  };
}
```

하지만 `buildTraceNodes()`는 issue graph를 실제로 붙이지 않는다.

```153:168:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/core/core.ts
const targetSha = nodes[nodes.length - 1].sha;
if (targetSha) {
  const prInfo = await lookupPR(targetSha, adapter, execOptions);
  if (prInfo) {
    nodes.push({
      type: 'pull_request',
      sha: prInfo.mergeCommit,
      trackingMethod: prInfo.url ? 'api' : 'message-parse',
      confidence: prInfo.url ? 'exact' : 'heuristic',
      prNumber: prInfo.number,
      prUrl: prInfo.url || undefined,
      prTitle: prInfo.title || undefined,
      mergedAt: prInfo.mergedAt,
    });
  }
}
```

정리:

- `deep`: feature flag는 켜지지만 실동작 연결이 약함
- `graphDepth`: feature flag는 켜지지만 `trace()` 결과에 issue 노드가 붙지 않음
- `noCache`: 타입과 CLI에는 있으나 현재 구현 연결이 불명확함

### 2.5 CLI 문서와 실제 커맨드 형태 차이

현재 실제 graph CLI는 `graph pr <number>` 또는 `graph issue <number>` 형태이다.

```11:16:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/commands/graph.tsx
graphCmd
  .command('pr <number>')
  .description('Show issues linked to a PR')
  .option('--depth <n>', 'Traversal depth', '1')
  .option('--json', 'Output in JSON format')
```

따라서 README에 `graph --pr 42 --depth 2` 형태가 있다면 실제 구현과 맞지 않는다.

---

## 3. 기능 개선 요청

### 3.1 고수준 `graph()` 함수 공개

요청:

- 루트 공개 API에 `graph(options: GraphOptions): Promise<GraphResult>` 추가
- 내부에서 플랫폼 감지와 인증 상태 확인까지 수행
- 라이브러리 사용자는 `PlatformAdapter`를 직접 다루지 않도록 정리

제안 예시:

```typescript
const result = await graph({
  type: 'pr',
  number: 42,
  depth: 2,
});
```

### 3.2 `trace()`의 `graphDepth` 실동작 보강

요청:

- `graphDepth > 0`일 때 `trace()` 결과에 PR 이후 Issue 노드를 실제로 포함
- 또는 `trace()`에서 `graphDepth`를 제거하고 graph 탐색을 완전히 별도 API로 분리

둘 중 어떤 방향이든 문서와 구현이 일치해야 한다.

### 3.3 `deep` 의미를 구현에 연결

요청:

- `deep: true`일 때 squash merge, ancestry 탐색, patch-id 탐색 범위를 실제로 강화
- 최소한 어떤 단계에서 무엇이 달라지는지 코드와 문서에 명시

현재처럼 `featureFlags.deepTrace`만 바꾸는 상태는 라이브러리 소비자에게 오해를 준다.

### 3.4 라이브러리 옵션과 CLI 옵션 분리

요청:

- `TraceOptions`에서 `json`, `output`, `quiet`를 제거하거나 deprecated 처리
- CLI 전용 포맷 옵션은 커맨드 레이어에서만 관리
- 라이브러리 함수는 데이터 반환에만 집중

### 3.5 `noCache` 구현 보강

요청:

- `noCache`가 실제 PR lookup, patch-id lookup, 기타 내부 캐시에 일관되게 반영되도록 구현
- 문서에 “이번 호출에서만 캐시 비활성화” 범위를 명확히 기재

### 3.6 어댑터 공개 정책 정리

선택지:

1. `graph()` 같은 고수준 함수만 공개하고 어댑터는 계속 내부로 유지
2. 루트 export 또는 공식 서브패스로 `detectPlatformAdapter()`를 공개

라이브러리 소비자 UX 측면에서는 `1`이 더 단순하다.

---

## 4. 문서 개선 요청

### 4.1 README의 프로그래밍 API 섹션 보강

요청:

- 라이브러리 사용 예시를 CLI보다 명확히 분리
- 현재 실제 공개 API 기준으로 함수 목록과 타입을 다시 정리
- graph 기능은 현재 공개 범위와 제약을 분명히 설명

### 4.2 CLI 예시를 실제 커맨드와 맞추기

요청:

- `graph --pr 42` 대신 `graph pr 42`처럼 실제 명령 구조와 일치하게 수정
- `--quiet`, `--output`, `--json`이 라이브러리 옵션이 아니라 CLI 출력 옵션이라는 점을 분리 설명

### 4.3 옵션별 “현재 보장되는 동작” 명시

특히 다음 항목은 README에서 단정적으로 서술하지 않는 것이 좋다.

- `deep`
- `graphDepth`
- `noCache`

이 항목들은 구현 완료 전까지 “planned”, “experimental”, 또는 “currently limited”로 표기하는 편이 안전하다.

### 4.4 반환 타입 문서 정합성 보강

`health()`는 실제로 `operatingLevel`을 포함해 반환한다.

```206:220:/Users/Vincent/Workspace/lumy-pack/packages/line-lore/src/core/core.ts
export async function health(options?: {
  cwd?: string;
}): Promise<HealthReport & { operatingLevel: OperatingLevel }> {
  const healthReport = await checkGitHealth(options);
  ...
  return { ...healthReport, operatingLevel };
}
```

README도 이 실제 반환 형태에 맞추어 수정하는 것이 좋다.

---

## 5. 권장 목표 인터페이스

다음 인터페이스를 권장한다.

```typescript
import {
  trace,
  graph,
  health,
  clearCache,
  LineLoreError,
  type TraceOptions,
  type GraphOptions,
  type TraceFullResult,
  type GraphResult,
} from '@lumy-pack/line-lore';

const traceResult = await trace({
  file: 'src/auth.ts',
  line: 42,
  deep: true,
  graphDepth: 1,
});

const graphResult = await graph({
  type: 'pr',
  number: 42,
  depth: 2,
});
```

권장 방향:

- `trace()`는 라인/범위 역추적의 단일 진입점
- `graph()`는 PR/Issue 그래프 탐색의 단일 진입점
- CLI 출력 포맷 관련 개념은 라이브러리 API에서 제거

---

## 6. 기대 효과

### 6.1 VSCode 확장 관점

- 공개 API만으로 line trace, health check, cache clear, issue 탐색까지 구성 가능
- 내부 플랫폼 어댑터 구현에 의존하지 않아 유지보수가 쉬워짐
- 문서와 코드가 일치해 통합 리스크가 줄어듦

### 6.2 일반 라이브러리 소비자 관점

- CLI 사용자가 아닌 Node.js/TypeScript 소비자에게 진입 장벽이 낮아짐
- 타입 정의가 API 의미를 정확히 반영하게 됨
- 테스트 작성과 mock 구성 포인트가 더 명확해짐

### 6.3 line-lore 자체 품질 관점

- README와 실제 구현의 정합성 개선
- feature flag와 실동작 사이의 괴리 축소
- 앞으로 VSCode, IDE plugin, automation script 같은 2차 소비처 확장에 유리

---

## 7. 요청 우선순위

| 우선순위 | 항목 | 이유 |
|----------|------|------|
| P1 | 고수준 `graph()` 공개 | 라이브러리 소비성에 가장 직접적인 영향 |
| P1 | README와 실제 커맨드/반환 타입 정합성 수정 | 현재 사용자 혼란 방지 |
| P2 | `deep`, `graphDepth` 실동작 연결 | 기능 신뢰도 향상 |
| P2 | 라이브러리 옵션과 CLI 옵션 분리 | 타입 설계 정리 |
| P3 | `noCache` 보강 | 운영/디버깅 편의성 향상 |

이 요청들이 수용되면, `line-lore-vscode`는 `line-lore`를 CLI 래퍼가 아니라 정식 라이브러리 의존성으로 안정적으로 사용할 수 있다.

수용 이후의 검증은 아래 순서로 진행한다.

- [DEV-COMPLETE-CHECKLIST.md](./DEV-COMPLETE-CHECKLIST.md): 개발 완료 직후 셀프체크
- [SPEC-EXPANSION-REVIEW.md](./SPEC-EXPANSION-REVIEW.md): 스펙 확장 수용 여부 최종 판정
