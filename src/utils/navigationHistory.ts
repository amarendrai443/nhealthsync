/**
 * Centralized SPA Routing, State Persistence, Modal Stack & Gradual Exit Navigation
 */

export interface ModalEntry {
  id: string;
  name: string;
  onClose: () => void;
}

class NavigationHistoryManager {
  private modalStack: ModalEntry[] = [];
  private isProgrammaticBack = false;
  private lastBackPressTime = 0;
  private exitPromptListeners: Array<(show: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  // Register an open modal/popup/overlay
  public pushModal(id: string, name: string, onClose: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Prevent duplicates
    this.modalStack = this.modalStack.filter((m) => m.id !== id);
    this.modalStack.push({ id, name, onClose });

    try {
      window.history.pushState(
        { isModal: true, modalId: id, modalName: name },
        '',
        window.location.href
      );
    } catch {}

    // Return cleanup/close function for UI close triggers
    return () => this.popModal(id);
  }

  // Called when closed via UI button ("X" or backdrop)
  public popModal(id: string): void {
    if (typeof window === 'undefined') return;

    const idx = this.modalStack.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.modalStack.splice(idx, 1);
      // If the top state in history was a modal, pop it cleanly
      if (window.history.state?.isModal) {
        this.isProgrammaticBack = true;
        window.history.back();
      }
    }
  }

  // Check if any modal is currently active
  public hasOpenModals(): boolean {
    return this.modalStack.length > 0;
  }

  // Close the topmost modal
  public closeTopModal(): boolean {
    const top = this.modalStack.pop();
    if (top) {
      try {
        top.onClose();
      } catch (err) {
        console.error('Error closing modal on back:', err);
      }
      return true;
    }
    return false;
  }

  // Close all open modals without altering underlying page
  public closeAllModals(): boolean {
    if (this.modalStack.length === 0) return false;
    while (this.modalStack.length > 0) {
      const top = this.modalStack.pop();
      if (top) {
        try {
          top.onClose();
        } catch {}
      }
    }
    return true;
  }

  // Gradual exit check: returns true if user should exit, or false to trigger prompt
  public handleRootBackPress(): boolean {
    const now = Date.now();
    if (now - this.lastBackPressTime < 2500) {
      return true; // Confirmed exit
    }
    this.lastBackPressTime = now;
    this.notifyExitPrompt(true);
    setTimeout(() => this.notifyExitPrompt(false), 2500);
    return false;
  }

  public onExitPrompt(listener: (show: boolean) => void): () => void {
    this.exitPromptListeners.push(listener);
    return () => {
      this.exitPromptListeners = this.exitPromptListeners.filter((l) => l !== listener);
    };
  }

  private notifyExitPrompt(show: boolean) {
    this.exitPromptListeners.forEach((l) => l(show));
  }

  private handlePopState = (e: PopStateEvent) => {
    // If this popstate was triggered by our programmatic history.back(), ignore
    if (this.isProgrammaticBack) {
      this.isProgrammaticBack = false;
      return;
    }

    // 1. POPUP / MODAL BACK-BUTTON BEHAVIOR:
    // If a modal, popup, scan window, or overlay is open, pressing Back closes ONLY that modal
    if (this.hasOpenModals()) {
      this.closeTopModal();
      // Keep user on the exact same underlying page
      return;
    }

    // Otherwise, normal page/tab popstate is handled by the router
  };
}

export const navHistory = new NavigationHistoryManager();
