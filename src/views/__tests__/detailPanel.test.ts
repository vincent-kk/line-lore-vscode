import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DetailPanelManager } from '../detailPanel.js';
import type { TraceFullResult } from '../../types/index.js';

const mockWebview = { html: '' };
const mockPanel = {
  webview: mockWebview,
  reveal: vi.fn(),
  onDidDispose: vi.fn(),
  dispose: vi.fn(),
};

const mockCreateWebviewPanel = vi.fn(() => mockPanel);

vi.mock('vscode', () => ({
  window: {
    createWebviewPanel: (...args: unknown[]) => mockCreateWebviewPanel(...args),
  },
  ViewColumn: { Beside: 2 },
  Uri: { joinPath: vi.fn() },
}));

describe('DetailPanelManager', () => {
  let manager: DetailPanelManager;

  const mockResult: TraceFullResult = {
    nodes: [
      { type: 'original_commit', sha: 'abc1234', trackingMethod: 'blame', confidence: 'exact' },
      { type: 'pull_request', trackingMethod: 'api', confidence: 'exact', prNumber: 42, prTitle: 'feat: auth', prUrl: 'https://github.com/test/pull/42', mergedAt: '2025-03-15T10:00:00Z' },
    ],
    operatingLevel: 2,
    featureFlags: { astDiff: true, deepTrace: false, commitGraph: true, graphql: true },
    warnings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebview.html = '';
    manager = new DetailPanelManager({} as never);
  });

  it('creates webview panel on first show', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
      'lineLoreDetail',
      'Line Lore — Trace Result',
      2,
      { enableScripts: false },
    );
  });

  it('renders file info with line number', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('auth.ts');
    expect(mockWebview.html).toContain('L42');
  });

  it('renders range label when endLine provided', () => {
    manager.show('/workspace/src/config.ts', 10, mockResult, 50);

    expect(mockWebview.html).toContain('L10-L50');
  });

  it('renders PR node with number and title', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('#42');
    expect(mockWebview.html).toContain('feat: auth');
    expect(mockWebview.html).toContain('https://github.com/test/pull/42');
  });

  it('renders commit node with SHA', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('abc1234');
  });

  it('renders operating level', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('Level 2');
    expect(mockWebview.html).toContain('Full API Access');
  });

  it('renders node type icons', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('●');
    expect(mockWebview.html).toContain('▸');
  });

  it('uses VSCode CSS variables', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);

    expect(mockWebview.html).toContain('--vscode-editor-background');
    expect(mockWebview.html).toContain('--vscode-editor-foreground');
  });

  it('reveals existing panel on second show', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);
    manager.show('/workspace/src/auth.ts', 43, mockResult);

    expect(mockPanel.reveal).toHaveBeenCalled();
  });

  it('disposes panel', () => {
    manager.show('/workspace/src/auth.ts', 42, mockResult);
    manager.dispose();

    expect(mockPanel.dispose).toHaveBeenCalled();
  });
});
