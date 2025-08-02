import React, { useEffect, useState } from 'react';

interface ScrollableElement {
  element: HTMLElement;
  id: string;
  className: string;
  tagName: string;
  hasVerticalScroll: boolean;
  hasHorizontalScroll: boolean;
  clientHeight: number;
  scrollHeight: number;
  clientWidth: number;
  scrollWidth: number;
}

const ScrollbarDebugger: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [scrollableElements, setScrollableElements] = useState<ScrollableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<ScrollableElement | null>(null);

  const findScrollableElements = () => {
    const elements = document.querySelectorAll('*');
    const scrollable: ScrollableElement[] = [];

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);
      
      // Check if element has scrollable overflow
      const hasVerticalScroll = htmlEl.scrollHeight > htmlEl.clientHeight;
      const hasHorizontalScroll = htmlEl.scrollWidth > htmlEl.clientWidth;
      
      // Check if overflow is set to auto or scroll
      const overflowY = computedStyle.overflowY;
      const overflowX = computedStyle.overflowX;
      const overflow = computedStyle.overflow;
      
      const isScrollable = (
        (hasVerticalScroll && (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll')) ||
        (hasHorizontalScroll && (overflowX === 'auto' || overflowX === 'scroll' || overflow === 'auto' || overflow === 'scroll'))
      );

      if (isScrollable) {
        scrollable.push({
          element: htmlEl,
          id: htmlEl.id || `element-${scrollable.length}`,
          className: htmlEl.className || 'no-class',
          tagName: htmlEl.tagName,
          hasVerticalScroll,
          hasHorizontalScroll,
          clientHeight: htmlEl.clientHeight,
          scrollHeight: htmlEl.scrollHeight,
          clientWidth: htmlEl.clientWidth,
          scrollWidth: htmlEl.scrollWidth,
        });
      }
    });

    setScrollableElements(scrollable);
  };

  const highlightElement = (scrollableEl: ScrollableElement) => {
    // Remove previous highlights
    document.querySelectorAll('.debug-highlight').forEach(el => {
      el.remove();
    });

    // Create highlight overlay
    const rect = scrollableEl.element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'debug-highlight';
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border: 3px solid #ff0000;
      background: rgba(255, 0, 0, 0.1);
      pointer-events: none;
      z-index: 9999;
      box-sizing: border-box;
    `;
    document.body.appendChild(highlight);

    setSelectedElement(scrollableEl);
    
    // Log element info
    console.log('🔍 Scrollable Element:', {
      element: scrollableEl.element,
      tagName: scrollableEl.tagName,
      id: scrollableEl.id,
      className: scrollableEl.className,
      dimensions: {
        clientHeight: scrollableEl.clientHeight,
        scrollHeight: scrollableEl.scrollHeight,
        clientWidth: scrollableEl.clientWidth,
        scrollWidth: scrollableEl.scrollWidth,
      },
      hasVerticalScroll: scrollableEl.hasVerticalScroll,
      hasHorizontalScroll: scrollableEl.hasHorizontalScroll,
      computedStyle: window.getComputedStyle(scrollableEl.element),
    });
  };

  const removeHighlights = () => {
    document.querySelectorAll('.debug-highlight').forEach(el => {
      el.remove();
    });
    setSelectedElement(null);
  };

  useEffect(() => {
    if (isActive) {
      findScrollableElements();
    } else {
      removeHighlights();
    }
  }, [isActive]);

  // Keyboard shortcut to toggle debugger
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setIsActive(!isActive);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] bg-black/90 text-white p-4 rounded-lg max-w-sm max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Scrollbar Debugger</h3>
        <button 
          onClick={() => setIsActive(false)}
          className="text-white/70 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <p className="text-xs text-white/70 mb-3">
        Press Ctrl+Shift+S to toggle. Click elements below to highlight them.
      </p>

      <div className="space-y-2">
        {scrollableElements.map((el, index) => (
          <div 
            key={index}
            onClick={() => highlightElement(el)}
            className="cursor-pointer p-2 bg-white/10 rounded text-xs hover:bg-white/20 transition-colors"
          >
            <div className="font-semibold">
              {el.tagName.toLowerCase()}
              {el.id && <span className="text-blue-300">#{el.id}</span>}
            </div>
            <div className="text-white/70 truncate">
              {el.className.slice(0, 50)}
            </div>
            <div className="text-xs text-white/50">
              {el.hasVerticalScroll && '📏 V-Scroll'}
              {el.hasHorizontalScroll && ' 📐 H-Scroll'}
            </div>
            <div className="text-xs text-white/50">
              {el.clientHeight}x{el.clientWidth} → {el.scrollHeight}x{el.scrollWidth}
            </div>
          </div>
        ))}
      </div>

      {selectedElement && (
        <div className="mt-3 p-2 bg-red-500/20 rounded text-xs">
          <div className="font-bold">Selected Element Info:</div>
          <div>Tag: {selectedElement.tagName}</div>
          <div>ID: {selectedElement.id}</div>
          <div>Classes: {selectedElement.className}</div>
          <div>Scroll: {selectedElement.scrollHeight}h × {selectedElement.scrollWidth}w</div>
          <div>Client: {selectedElement.clientHeight}h × {selectedElement.clientWidth}w</div>
        </div>
      )}

      <button 
        onClick={removeHighlights}
        className="mt-3 w-full bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700"
      >
        Clear Highlights
      </button>
    </div>
  );
};

export default ScrollbarDebugger;