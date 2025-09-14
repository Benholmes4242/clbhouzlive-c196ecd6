export interface EchoMenuOptions {
  onCopy?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
}

class LongPressHandler {
  private pressTimer: number | null = null;
  private menu: HTMLElement | null = null;

  init() {
    // Remove any existing menu
    this.cleanup();
    
    // Add event listeners to all clickable elements
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    document.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: true });
    document.addEventListener('click', this.hideMenu.bind(this));
  }

  private handleTouchStart(e: TouchEvent) {
    // Don't interfere with Echo Dock or other system elements
    const target = e.target as HTMLElement;
    if (target.closest('.echoDoc-btn') || target.closest('.echo-menu') || target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    // Only arm long-press on explicitly whitelisted targets
    const eligible = target.closest('[data-longpress]');
    if (!eligible) {
      return; // let native scroll/tap proceed
    }
    
    this.pressTimer = window.setTimeout(() => {
      const touch = e.touches[0];
      this.showEchoMenu(touch.clientX, touch.clientY, eligible as HTMLElement);
    }, 600); // 600ms = long press
  }

  private handleTouchEnd() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private showEchoMenu(x: number, y: number, target: HTMLElement) {
    this.hideMenu();

    // Create menu element
    this.menu = document.createElement('div');
    this.menu.className = 'echo-menu';
    
    // Get text content for potential actions
    const textContent = target.textContent?.trim() || '';
    const hasText = textContent.length > 0;

    // Add buttons based on context
    if (hasText) {
      this.addMenuButton('Copy', () => {
        navigator.clipboard.writeText(textContent);
        this.hideMenu();
      });
    }

    this.addMenuButton('Share', () => {
      if (navigator.share && hasText) {
        navigator.share({ text: textContent });
      }
      this.hideMenu();
    });

    this.addMenuButton('Save', () => {
      // Could save to local storage or trigger a save action
      console.log('Save action triggered');
      this.hideMenu();
    });

    // Position menu
    this.menu.style.left = `${Math.max(10, Math.min(x - 50, window.innerWidth - 200))}px`;
    this.menu.style.top = `${Math.max(10, y - 50)}px`;

    // Add to DOM
    document.body.appendChild(this.menu);

    // Show with animation
    requestAnimationFrame(() => {
      this.menu?.classList.add('show');
    });

    // Add vibration feedback if available
    try {
      (navigator as any).vibrate?.(10);
    } catch {}
  }

  private addMenuButton(text: string, onClick: () => void) {
    if (!this.menu) return;

    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    
    this.menu.appendChild(button);
  }

  private hideMenu() {
    if (this.menu) {
      this.menu.classList.remove('show');
      setTimeout(() => {
        if (this.menu) {
          this.menu.remove();
          this.menu = null;
        }
      }, 200);
    }
  }

  cleanup() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
    
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
    document.removeEventListener('click', this.hideMenu.bind(this));
  }
}

// Export singleton instance
export const longPressHandler = new LongPressHandler();