import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DecorationController } from '../decorationProvider.js';

const mockDecorationType = { dispose: vi.fn() };
let selectionCallback: ((e: unknown) => void) | undefined;

vi.mock('vscode', () => ({
  window: {
    createTextEditorDecorationType: vi.fn(() => mockDecorationType),
    onDidChangeTextEditorSelection: vi.fn((cb: (e: unknown) => void) => {
      selectionCallback = cb;
      return { dispose: vi.fn() };
    }),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
    })),
  },
  ThemeColor: vi.fn((id: string) => ({ id })),
  Range: vi.fn((sl: number, sc: number, el: number, ec: number) => ({
    sl,
    sc,
    el,
    ec,
  })),
}));

import * as vscode from 'vscode';

describe('DecorationController', () => {
  let controller: DecorationController;
  const mockEditor = {
    setDecorations: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn((_key: string, defaultValue: unknown) => defaultValue),
    } as never);
    selectionCallback = undefined;
    controller = new DecorationController();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows decoration with PR number', () => {
    controller.showDecoration(mockEditor as never, 10, 42);

    expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, [
      expect.objectContaining({
        renderOptions: { after: { contentText: '← PR #42' } },
      }),
    ]);
  });

  it('auto-removes after 30 seconds', () => {
    controller.showDecoration(mockEditor as never, 10, 42);
    vi.clearAllMocks();

    vi.advanceTimersByTime(30000);

    expect(mockEditor.setDecorations).toHaveBeenCalledWith(
      mockDecorationType,
      [],
    );
  });

  it('removes on cursor move', () => {
    controller.showDecoration(mockEditor as never, 10, 42);
    vi.clearAllMocks();

    selectionCallback?.({ textEditor: mockEditor });

    expect(mockEditor.setDecorations).toHaveBeenCalledWith(
      mockDecorationType,
      [],
    );
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

    controller.showDecoration(mockEditor as never, 10, 42);

    expect(mockEditor.setDecorations).not.toHaveBeenCalled();
  });

  it('clear() cancels pending timer', () => {
    controller.showDecoration(mockEditor as never, 10, 42);
    controller.clear();

    vi.advanceTimersByTime(30000);
  });

  it('dispose cleans up decoration type', () => {
    controller.dispose();
    expect(mockDecorationType.dispose).toHaveBeenCalled();
  });

  it('includes hoverMessage in decoration options when provided', () => {
    const hoverMd = {
      value: 'PR info',
      isTrusted: true,
      supportThemeIcons: true,
    };
    controller.showDecoration(mockEditor as never, 10, 42, hoverMd as never);

    expect(mockEditor.setDecorations).toHaveBeenCalledWith(mockDecorationType, [
      expect.objectContaining({
        hoverMessage: hoverMd,
        renderOptions: { after: { contentText: '← PR #42' } },
      }),
    ]);
  });

  it('omits hoverMessage when not provided', () => {
    controller.showDecoration(mockEditor as never, 10, 42);

    const callArgs = mockEditor.setDecorations.mock
      .calls[0]?.[1]?.[0] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty('hoverMessage');
  });
});
