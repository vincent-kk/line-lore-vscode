import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecorationController } from '../decorationProvider.js';

const mockRegistration = { dispose: vi.fn() };

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
    })),
  },
  window: {
    tabGroups: {
      onDidChangeTabs: vi.fn(() => ({ dispose: vi.fn() })),
    },
  },
  TabInputText: class {
    constructor(public uri: { toString: () => string }) {}
  },
  languages: {
    registerCodeLensProvider: vi.fn(() => mockRegistration),
  },
  EventEmitter: vi.fn(() => ({
    event: vi.fn(),
    fire: vi.fn(),
    dispose: vi.fn(),
  })),
  Range: vi.fn((sl: number, sc: number, el: number, ec: number) => ({
    sl,
    sc,
    el,
    ec,
  })),
  CodeLens: vi.fn(
    (range: unknown, command: unknown) =>
      ({ range, command }) as Record<string, unknown>,
  ),
  Uri: { parse: (s: string) => ({ toString: () => s }) },
}));

import * as vscode from 'vscode';

describe('DecorationController', () => {
  let controller: DecorationController;
  const mockEditor = {
    document: {
      uri: {
        toString: () => 'file:///workspace/src/auth.ts',
        fsPath: '/workspace/src/auth.ts',
      },
    },
  };
  const mockDocument = {
    uri: { toString: () => 'file:///workspace/src/auth.ts' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
    } as never);
    controller = new DecorationController();
  });

  it('registers CodeLens provider on construction', () => {
    expect(vscode.languages.registerCodeLensProvider).toHaveBeenCalledWith(
      { scheme: 'file' },
      controller,
    );
  });

  it('returns empty CodeLens array when no decoration active', () => {
    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toEqual([]);
  });

  it('returns PR CodeLens and dismiss CodeLens after showDecoration', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
      'feat: auth',
    );

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toHaveLength(3);
    expect(lenses[0]).toEqual(
      expect.objectContaining({
        command: expect.objectContaining({
          title: '$(git-pull-request) PR #42: feat: auth',
          command: 'vscode.open',
        }),
      }),
    );
    expect(lenses[1]).toEqual(
      expect.objectContaining({
        command: expect.objectContaining({
          title: ' $(info) ',
          command: 'lineLore.showDetails',
        }),
      }),
    );
    expect(lenses[2]).toEqual(
      expect.objectContaining({
        command: expect.objectContaining({
          title: ' $(close) ',
          command: 'lineLore.clearDecoration',
        }),
      }),
    );
  });

  it('supports multiple CodeLenses on different lines', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
      'feat: auth',
    );
    controller.showDecoration(
      mockEditor as never,
      20,
      99,
      'https://github.com/org/repo/pull/99',
      'fix: bug',
    );

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toHaveLength(6);
  });

  it('replaces CodeLens on same line', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
      'feat: auth',
    );
    controller.showDecoration(
      mockEditor as never,
      10,
      99,
      'https://github.com/org/repo/pull/99',
      'fix: bug',
    );

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toHaveLength(3);
    expect(lenses[0]).toEqual(
      expect.objectContaining({
        command: expect.objectContaining({
          title: '$(git-pull-request) PR #99: fix: bug',
        }),
      }),
    );
  });

  it('clearOne removes only targeted CodeLens', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
      'feat: auth',
    );
    controller.showDecoration(
      mockEditor as never,
      20,
      99,
      'https://github.com/org/repo/pull/99',
      'fix: bug',
    );

    controller.clearOne('file:///workspace/src/auth.ts:10');

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toHaveLength(3);
    expect(lenses[0]).toEqual(
      expect.objectContaining({
        command: expect.objectContaining({
          title: '$(git-pull-request) PR #99: fix: bug',
        }),
      }),
    );
  });

  it('clear() removes all CodeLenses', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
    );
    controller.showDecoration(
      mockEditor as never,
      20,
      99,
      'https://github.com/org/repo/pull/99',
    );
    controller.clear();

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toEqual([]);
  });

  it('returns empty array for different document', () => {
    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
    );

    const otherDoc = { uri: { toString: () => 'file:///other/file.ts' } };
    const lenses = controller.provideCodeLenses(otherDoc as never);
    expect(lenses).toEqual([]);
  });

  it('respects disabled config', () => {
    const mockGet = vi.fn((key: string) => {
      if (key === 'inlineDecoration.enabled') {
        return false;
      }
      return true;
    });
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: mockGet,
    } as never);

    controller.showDecoration(
      mockEditor as never,
      10,
      42,
      'https://github.com/org/repo/pull/42',
    );

    const lenses = controller.provideCodeLenses(mockDocument as never);
    expect(lenses).toEqual([]);
  });

  it('dispose cleans up registration', () => {
    controller.dispose();
    expect(mockRegistration.dispose).toHaveBeenCalled();
  });
});
