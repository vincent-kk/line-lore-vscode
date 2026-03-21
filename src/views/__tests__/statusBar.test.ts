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

describe('StatusBarController', () => {
  let controller: StatusBarController;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockStatusBarItem.text = '';
    mockStatusBarItem.tooltip = '';
    mockStatusBarItem.command = '';
    controller = new StatusBarController();
    controller.create();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates StatusBarItem with healthCheck command', () => {
    expect(mockStatusBarItem.command).toBe('lineLore.healthCheck');
  });

  it('showLoading displays spinner text', () => {
    controller.showLoading();
    expect(mockStatusBarItem.text).toBe('$(sync~spin) Line Lore: Tracing...');
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it('showResult displays level 2 with git-pull-request icon', () => {
    controller.showResult(2);
    expect(mockStatusBarItem.text).toBe('$(git-pull-request) Line Lore: L2');
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it('showResult displays level 1 with warning icon', () => {
    controller.showResult(1);
    expect(mockStatusBarItem.text).toBe('$(warning) Line Lore: L1');
  });

  it('showResult displays level 0 with circle-slash icon', () => {
    controller.showResult(0);
    expect(mockStatusBarItem.text).toBe('$(circle-slash) Line Lore: L0');
  });

  it('showResult auto-hides after 5 seconds', () => {
    controller.showResult(2);
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(mockStatusBarItem.hide).toHaveBeenCalledOnce();
  });

  it('showError displays error text and auto-hides', () => {
    controller.showError('Something failed');
    expect(mockStatusBarItem.text).toBe('$(error) Line Lore: Error');
    expect(mockStatusBarItem.tooltip).toBe('Something failed');
    expect(mockStatusBarItem.show).toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    expect(mockStatusBarItem.hide).toHaveBeenCalledOnce();
  });

  it('hide clears timer and hides item', () => {
    controller.showResult(2);
    controller.hide();
    expect(mockStatusBarItem.hide).toHaveBeenCalled();

    vi.advanceTimersByTime(5000);
    // hide should only be called once (from manual hide, not timer)
    expect(mockStatusBarItem.hide).toHaveBeenCalledTimes(1);
  });

  it('dispose cleans up item and timer', () => {
    controller.showResult(2);
    controller.dispose();
    expect(mockStatusBarItem.dispose).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(5000);
    // No additional hide calls after dispose
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
  });

  it('showLoading cancels pending auto-hide timer', () => {
    controller.showResult(2);
    controller.showLoading();

    vi.advanceTimersByTime(5000);
    // The auto-hide from showResult should have been cancelled
    expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
  });
});
