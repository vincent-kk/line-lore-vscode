# Line Lore VSCode Extension — line-lore API Spec

## 1. 문서 목적

이 문서는 `line-lore-vscode`가 의존하는 `@lumy-pack/line-lore`의 프로그래매틱 인터페이스를 정리한다.

- 이 문서는 개선 요청(LINE-LORE-IMPROVEMENT-REQUEST) 수용 후 검증을 거친 실제 인터페이스 문서이다.
- 판정일: 2026-03-22. 판정 결과: `Accepted`.
- CLI 예시보다 TypeScript 라이브러리 사용성을 우선한다.
- 출력 포맷 제어보다 구조화된 데이터 반환을 우선한다.

---

## 2. 공개 API

```typescript
import {
  trace,
  graph,
  health,
  clearCache,
  LineLoreError,
  type TraceOptions,
  type TraceFullResult,
  type GraphOptions,
  type GraphResult,
  type TraceNode,
  type OperatingLevel,
} from '@lumy-pack/line-lore';
```

### 2.1 핵심 함수

| 함수 | 목적 | 반환 |
|------|------|------|
| `trace(options)` | 파일의 단일 라인 또는 라인 범위를 PR까지 역추적 | `Promise<TraceFullResult>` |
| `graph(options)` | PR 또는 Issue를 시작점으로 관련 PR/Issue 그래프 순회 | `Promise<GraphResult>` |
| `health(options?)` | 현재 저장소와 플랫폼 연동 상태 확인 | `Promise<HealthReport & { operatingLevel: OperatingLevel }>` |
| `clearCache()` | line-lore 내부 캐시 삭제 | `Promise<void>` |

### 2.2 설계 원칙

- 라이브러리 함수는 항상 구조화된 데이터를 반환한다.
- `json`, `output`, `quiet` 같은 출력 포맷 옵션은 CLI 전용으로 분리되어 있다.
- graph 탐색은 `PlatformAdapter` 직접 주입이 아니라 고수준 함수 `graph()`로 노출한다.
- `trace()`와 `graph()`는 VSCode 확장에서 바로 호출할 수 있다.

---

## 3. `trace()` 사용 방식

### 3.1 기본 사용

```typescript
import { trace } from '@lumy-pack/line-lore';

const result = await trace({
  file: 'src/auth.ts',
  line: 42,
});

console.log(result.nodes);          // TraceNode[]
console.log(result.operatingLevel); // 0 | 1 | 2
console.log(result.warnings);       // string[]
```

### 3.2 라인 범위 추적

```typescript
const result = await trace({
  file: 'src/config.ts',
  line: 10,
  endLine: 50,
});
```

### 3.3 깊은 추적

```typescript
const result = await trace({
  file: 'src/auth.ts',
  line: 42,
  deep: true,
});
```

`deep: true`는 다음 두 가지 동작을 활성화한다:

1. merge commit 매칭 후에도 patch-id 기반 추가 탐색을 계속한다.
2. patch-id 스캔 범위를 기본값 500에서 2000으로 확장한다.

squash merge, rebase, cosmetic commit 우회 등 계보가 단순하지 않은 경우에 원본 PR까지 추적할 확률을 높인다.

### 3.4 Issue 연계 탐색

`trace()`는 라인→커밋→PR 추적에 집중한다. PR에서 연결된 Issue를 탐색하려면 별도로 `graph()` API를 사용한다:

```typescript
const traceResult = await trace({ file: 'src/auth.ts', line: 42 });
const prNode = traceResult.nodes.find(n => n.type === 'pull_request');

if (prNode?.prNumber) {
  const graphResult = await graph({
    type: 'pr',
    number: prNode.prNumber,
    depth: 1,
  });
  // graphResult.nodes에서 issue 노드 추출
}
```

### 3.5 옵션 정의

```typescript
interface TraceOptions {
  file: string;
  line: number;
  endLine?: number;
  remote?: string;
  deep?: boolean;
  noAst?: boolean;
  noCache?: boolean;
}
```

라이브러리 문서에서는 위 필드만 핵심 옵션으로 취급한다. CLI 출력 관련 옵션(`json`, `output`, `quiet`)은 CLI 레이어에서 별도 관리된다.

---

## 4. `graph()` 사용 방식

### 4.1 PR에서 연결된 Issue 탐색

```typescript
import { graph } from '@lumy-pack/line-lore';

const result = await graph({
  type: 'pr',
  number: 42,
  depth: 2,
});

console.log(result.nodes); // TraceNode[]
console.log(result.edges); // { from, to, relation }[]
```

### 4.2 Issue에서 연결된 PR 탐색

```typescript
const result = await graph({
  type: 'issue',
  number: 128,
  depth: 2,
});
```

### 4.3 옵션 정의

```typescript
interface GraphOptions {
  type: 'pr' | 'issue';
  number: number;
  depth?: number;
  remote?: string;
}
```

`graph()`는 내부에서 플랫폼 감지와 인증 상태 확인을 수행하며, 호출자는 `PlatformAdapter`를 직접 생성하지 않는다. Level 2 (인증된 CLI)가 필요하며, 미인증 시 `LineLoreError`(`CLI_NOT_AUTHENTICATED`)를 throw한다.

---

## 5. 반환 타입 해석

### 5.1 `TraceFullResult`

```typescript
interface TraceFullResult {
  nodes: TraceNode[];
  operatingLevel: 0 | 1 | 2;
  featureFlags: FeatureFlags;
  warnings: string[];
}
```

### 5.2 `FeatureFlags`

```typescript
interface FeatureFlags {
  astDiff: boolean;
  deepTrace: boolean;
  commitGraph: boolean;
  graphql: boolean;
}
```

### 5.3 `TraceNode`

```typescript
type TraceNodeType =
  | 'original_commit'
  | 'cosmetic_commit'
  | 'merge_commit'
  | 'rebased_commit'
  | 'pull_request'
  | 'issue';

interface TraceNode {
  type: TraceNodeType;
  sha?: string;
  trackingMethod: string;
  confidence: 'exact' | 'structural' | 'heuristic';
  prNumber?: number;
  prUrl?: string;
  prTitle?: string;
  mergedAt?: string;
  issueNumber?: number;
  issueUrl?: string;
  issueTitle?: string;
  issueState?: 'open' | 'closed';
  issueLabels?: string[];
  note?: string;
}
```

### 5.4 `operatingLevel`

| 레벨 | 의미 | 확장에서 기대할 수 있는 동작 |
|------|------|-----------------------------|
| `0` | Git만 사용 가능 | commit 중심 결과, 원격 메타데이터 제한 |
| `1` | 플랫폼 CLI 감지, 미인증 또는 제한 상태 | 일부 PR 식별 가능, 세부 정보 제한 가능 |
| `2` | 플랫폼 인증 완료 | PR/Issue 메타데이터까지 포함한 전체 결과 |

### 5.5 `warnings`

- 기능 축소 상태를 사용자에게 설명하는 메시지
- 확장은 `warnings.length > 0`일 때 상태 배지 또는 보조 문구를 표시한다
- 치명적 오류가 아니면 결과와 함께 반환된다

---

## 6. 확장 연동 규칙

### 6.1 경로 규칙

- `file`은 workspace root 기준 상대 경로 또는 현재 저장소 기준 경로를 허용한다.
- multi-root workspace에서는 현재 파일이 속한 workspace folder를 기준으로 처리한다.
- `health({ cwd })`와 `trace({ file })`는 같은 저장소 문맥을 사용해야 한다.

### 6.2 UX 관점 권장 흐름

1. 사용자가 현재 에디터의 라인을 선택한다.
2. 확장이 `trace()`를 호출한다.
3. `pull_request` 또는 `issue` 노드를 추출해 hover, inline decoration, panel에 표시한다.
4. `warnings`와 `operatingLevel`을 함께 표시해 기능 축소 상태를 설명한다.

### 6.3 에러 처리

```typescript
import { trace, LineLoreError } from '@lumy-pack/line-lore';

try {
  await trace({ file: 'src/auth.ts', line: 42 });
} catch (error) {
  if (error instanceof LineLoreError) {
    console.error(error.code);    // e.g., 'FILE_NOT_FOUND'
    console.error(error.message);
    console.error(error.context); // additional metadata
  }
}
```

확장은 `LineLoreError.code`를 기준으로 사용자 메시지를 분기한다.

주요 에러 코드:

| 코드 | 의미 |
|------|------|
| `NOT_GIT_REPO` | git 저장소가 아님 |
| `FILE_NOT_FOUND` | 파일이 존재하지 않음 |
| `INVALID_LINE` | 라인 번호가 범위를 벗어남 |
| `GIT_BLAME_FAILED` | git blame 실행 실패 |
| `CLI_NOT_AUTHENTICATED` | 플랫폼 CLI 인증되지 않음 |
| `API_RATE_LIMITED` | 플랫폼 API 속도 제한 도달 |
| `API_REQUEST_FAILED` | 플랫폼 API 요청 실패 |

---

## 7. 사용 예시

```typescript
import { trace, graph, health, clearCache } from '@lumy-pack/line-lore';

// 1. 라인 → PR 역추적
const traceResult = await trace({
  file: 'src/auth.ts',
  line: 42,
  deep: true,
});

// 2. PR → Issue 그래프 탐색
const prNode = traceResult.nodes.find(n => n.type === 'pull_request');
if (prNode?.prNumber) {
  const graphResult = await graph({
    type: 'pr',
    number: prNode.prNumber,
    depth: 1,
  });
}

// 3. 시스템 상태 확인
const healthResult = await health({ cwd: '/workspace/repo' });

// 4. 캐시 삭제
await clearCache();
```

VSCode 확장은 CLI 포맷터나 내부 플랫폼 어댑터 구현에 의존하지 않고, 위 공개 API만으로 핵심 기능을 구성할 수 있다.
