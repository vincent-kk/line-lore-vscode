import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderManager } from '../register.js';

let configChangeCallback: ((e: unknown) => void) | undefined;
const mockHoverDisposable = { dispose: vi.fn() };
let hoverEnabled = true;

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultValue: unknown) => {
        if (_key === 'hoverProvider.enabled') {
          return hoverEnabled;
        }
        return defaultValue;
      }),
    })),
    onDidChangeConfiguration: vi.fn((cb: (e: unknown) => void) => {
      configChangeCallback = cb;
      return { dispose: vi.fn() };
    }),
  },
  languages: {
    registerHoverProvider: vi.fn(() => mockHoverDisposable),
  },
}));

import * as vscode from 'vscode';

const mockAdapter = { traceCached: vi.fn() } as never;

describe('ProviderManager', () => {
  const mockContext = {
    subscriptions: { push: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    configChangeCallback = undefined;
    hoverEnabled = true;
    mockHoverDisposable.dispose = vi.fn();
  });

  it('registers hover provider when enabled', () => {
    const manager = new ProviderManager(mockAdapter);
    manager.register(mockContext as never);

    expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
      { scheme: 'file' },
      expect.anything(),
    );
  });

  it('does not register hover provider when disabled', () => {
    hoverEnabled = false;
    const manager = new ProviderManager(mockAdapter);
    manager.register(mockContext as never);

    expect(vscode.languages.registerHoverProvider).not.toHaveBeenCalled();
  });

  it('disposes hover provider on config change to disabled', () => {
    const manager = new ProviderManager(mockAdapter);
    manager.register(mockContext as never);

    hoverEnabled = false;
    configChangeCallback?.({
      affectsConfiguration: (s: string) =>
        s === 'lineLore.hoverProvider.enabled',
    });

    expect(mockHoverDisposable.dispose).toHaveBeenCalled();
  });

  it('registers hover provider on config change to enabled', () => {
    hoverEnabled = false;
    const manager = new ProviderManager(mockAdapter);
    manager.register(mockContext as never);
    vi.clearAllMocks();

    hoverEnabled = true;
    configChangeCallback?.({
      affectsConfiguration: (s: string) =>
        s === 'lineLore.hoverProvider.enabled',
    });

    expect(vscode.languages.registerHoverProvider).toHaveBeenCalled();
  });
});
