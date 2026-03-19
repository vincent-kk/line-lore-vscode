# Line Lore VSCode Extension — line-lore API Spec

## 1. 문서 목적

이 문서는 `line-lore-vscode`가 의존하기 원하는 `@lumy-pack/line-lore`의 목표 프로그래매틱 인터페이스를 정리한다.

중요한 전제:

- 이 문서는 `line-lore` 개선 요청이 수용되었다고 가정한 사용 문서이다.
- CLI 예시보다 TypeScript 라이브러리 사용성을 우선한다.
- 출력 포맷 제어보다 구조화된 데이터 반환을 우선한다.

---

## 2. 목표 공개 API

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
- `json`, `output`, `quiet` 같은 출력 포맷 옵션은 CLI 전용으로 분리한다.
- graph 탐색은 `PlatformAdapter` 직접 주입이 아니라 고수준 함수 `graph()`로 노출한다.
- `trace()`와 `graph()`는 VSCode 확장에서 바로 호출할 수 있어야 한다.

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

`deep: true`는 squash merge, rebase, cosmetic commit 우회 등 계보가 단순하지 않은 경우에도 가능한 한 원본 PR까지 추적하는 의미를 가진다.

### 3.4 Issue 연계 추적

```typescript
const result = await trace({
  file: 'src/auth.ts',
  line: 42,
  graphDepth: 1,
});
```

`graphDepth`가 `1` 이상이면 `trace()` 결과에 PR과 연결된 Issue 노드가 포함될 수 있다. 확장은 이 값을 기반으로 "라인 -> PR -> Issue" 흐름을 한 번의 호출로 표시할 수 있다.

### 3.5 권장 옵션 정의

```typescript
interface TraceOptions {
  file: string;
  line: number;
  endLine?: number;
  remote?: string;
  deep?: boolean;
  graphDepth?: number;
  noAst?: boolean;
  noCache?: boolean;
}
```

라이브러리 문서에서는 위 필드만 핵심 옵션으로 취급한다. CLI 출력 관련 옵션은 별도 CLI 문서에서 다룬다.

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

### 4.3 권장 옵션 정의

```typescript
interface GraphOptions {
  type: 'pr' | 'issue';
  number: number;
  depth?: number;
  remote?: string;
}
```

`graph()`는 내부에서 플랫폼 감지와 인증 상태 확인을 수행하며, 호출자는 `PlatformAdapter`를 직접 생성하지 않는다.

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

### 5.2 `TraceNode`

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

### 5.3 `operatingLevel`

| 레벨 | 의미 | 확장에서 기대할 수 있는 동작 |
|------|------|-----------------------------|
| `0` | Git만 사용 가능 | commit 중심 결과, 원격 메타데이터 제한 |
| `1` | 플랫폼 CLI 감지, 미인증 또는 제한 상태 | 일부 PR 식별 가능, 세부 정보 제한 가능 |
| `2` | 플랫폼 인증 완료 | PR/Issue 메타데이터까지 포함한 전체 결과 |

### 5.4 `warnings`

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
    console.error(error.code);
    console.error(error.message);
  }
}
```

확장은 `LineLoreError.code`를 기준으로 사용자 메시지를 분기한다.

---

## 7. 이 프로젝트에서 기대하는 사용 예시

```typescript
import { trace, graph, health, clearCache } from '@lumy-pack/line-lore';

const traceResult = await trace({
  file: 'src/auth.ts',
  line: 42,
  graphDepth: 1,
});

const graphResult = await graph({
  type: 'pr',
  number: 42,
  depth: 2,
});

const healthResult = await health({ cwd: '/workspace/repo' });

await clearCache();
```

위 인터페이스를 기준으로 하면 VSCode 확장은 CLI 포맷터나 내부 플랫폼 어댑터 구현에 의존하지 않고, 공개 API만으로 핵심 기능을 구성할 수 있다.
