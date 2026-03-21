import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatusBarController } from '../statusBar.js';

const mockStatusBarItem = {
  text: '',
  tooltip: '',
  command: '',
  show: vi.fn(),
  hide: vi.fn(),
  dispose: vi.fn(),
};

vi.mock('vscode', () => ({
  window: {
    createStatusBarItem: vi.fn(() => mockStatusBarItem),
  },
  StatusBarAlignment: { Left: 1, Right: 2 },
}));

describe('StatusBarController — Phase 2 persistent level', () => {
  let controller: StatusBarController;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockStatusBarItem.text = '';
    mockStatusBarItem.tooltip = '';
    controller = new StatusBarController();
    controller.create();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('showPersistentLevel shows level permanently', () => {
    controller.showPersistentLevel(2);
    expect(mockStatusBarItem.text).toBe('$(git-pull-request) Line Lore: L2');
    expect(mockStatusBarItem.show).toHaveBeenCalled();

    vi.advanceTimersByTime(10000);
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
  });

  it('showResult returns to persistent level after 5s', () => {
    controller.showPersistentLevel(2);
    vi.clearAllMocks();

    controller.showResult(0);
    expect(mockStatusBarItem.text).toBe('$(circle-slash) Line Lore: L0');

    vi.advanceTimersByTime(5000);
    expect(mockStatusBarItem.text).toBe('$(git-pull-request) Line Lore: L2');
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
  });

  it('showError returns to persistent level after 5s', () => {
    controller.showPersistentLevel(1);
    vi.clearAllMocks();

    controller.showError('Something failed');
    expect(mockStatusBarItem.text).toBe('$(error) Line Lore: Error');

    vi.advanceTimersByTime(5000);
    expect(mockStatusBarItem.text).toBe('$(warning) Line Lore: L1');
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
  });

  it('without persistent level, showResult hides after 5s', () => {
    controller.showResult(2);
    vi.advanceTimersByTime(5000);
    expect(mockStatusBarItem.hide).toHaveBeenCalled();
  });

  it('showLoading overrides persistent display', () => {
    controller.showPersistentLevel(2);
    controller.showLoading();
    expect(mockStatusBarItem.text).toBe('$(sync~spin) Line Lore: Tracing...');
  });
});
