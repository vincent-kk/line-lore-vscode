import * as vscode from 'vscode';
import type { OperatingLevel } from '../types/index.js';

const AUTO_HIDE_MS = 5000;

export class StatusBarController {
  private item: vscode.StatusBarItem | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  create(): void {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.item.command = 'lineLore.healthCheck';
  }

  showLoading(): void {
    if (!this.item) { return; }
    this.clearTimer();
    this.item.text = '$(sync~spin) Line Lore: Tracing...';
    this.item.tooltip = 'Tracing line to PR...';
    this.item.show();
  }

  showResult(level: OperatingLevel): void {
    if (!this.item) { return; }
    this.clearTimer();

    let icon: string;
    if (level === 2) {
      icon = '$(git-pull-request)';
    } else if (level === 1) {
      icon = '$(warning)';
    } else {
      icon = '$(circle-slash)';
    }

    this.item.text = `${icon} Line Lore: L${level}`;
    this.item.tooltip = `Operating Level ${level}`;
    this.item.show();
    this.hideTimer = setTimeout(() => this.hide(), AUTO_HIDE_MS);
  }

  showError(message: string): void {
    if (!this.item) { return; }
    this.clearTimer();
    this.item.text = '$(error) Line Lore: Error';
    this.item.tooltip = message;
    this.item.show();
    this.hideTimer = setTimeout(() => this.hide(), AUTO_HIDE_MS);
  }

  hide(): void {
    this.clearTimer();
    this.item?.hide();
  }

  dispose(): void {
    this.clearTimer();
    this.item?.dispose();
    this.item = undefined;
  }

  private clearTimer(): void {
    if (this.hideTimer !== undefined) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }
}
