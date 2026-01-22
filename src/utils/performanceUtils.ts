/**
 * Performance utilities to help reduce main thread blocking
 */

/**
 * Debounce function calls to prevent excessive execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Use requestIdleCallback for non-critical operations
 */
export function scheduleIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): void {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 0);
  }
}

/**
 * Batch multiple operations together to reduce reflows/repaints
 */
export function batchOperations(operations: (() => void)[]): void {
  requestAnimationFrame(() => {
    operations.forEach(op => op());
  });
}

/**
 * Optimize heavy operations by breaking them into chunks
 */
export function processInChunks<T>(
  items: T[],
  processor: (item: T) => void,
  chunkSize: number = 10,
  delay: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    function processChunk() {
      const endIndex = Math.min(index + chunkSize, items.length);
      
      for (let i = index; i < endIndex; i++) {
        processor(items[i]);
      }
      
      index = endIndex;
      
      if (index < items.length) {
        if (delay > 0) {
          setTimeout(processChunk, delay);
        } else {
          scheduleIdleCallback(processChunk);
        }
      } else {
        resolve();
      }
    }
    
    processChunk();
  });
}

/**
 * Memory-efficient event listener management
 */
export class EventListenerManager {
  private listeners: Map<string, { element: EventTarget; type: string; listener: EventListener; options?: boolean | AddEventListenerOptions }> = new Map();
  
  add(
    id: string,
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    // Remove existing listener if it exists
    this.remove(id);
    
    element.addEventListener(type, listener, options);
    this.listeners.set(id, { element, type, listener, options });
  }
  
  remove(id: string): void {
    const listener = this.listeners.get(id);
    if (listener) {
      listener.element.removeEventListener(listener.type, listener.listener, listener.options);
      this.listeners.delete(id);
    }
  }
  
  removeAll(): void {
    this.listeners.forEach((listener, id) => {
      this.remove(id);
    });
  }
}

/**
 * Optimize canvas operations
 */
export class CanvasOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDirty: boolean = false;
  private animationId: number | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }
  
  markDirty(): void {
    if (!this.isDirty) {
      this.isDirty = true;
      this.scheduleRender();
    }
  }
  
  private scheduleRender(): void {
    if (this.animationId) return;
    
    this.animationId = requestAnimationFrame(() => {
      if (this.isDirty) {
        this.render();
        this.isDirty = false;
      }
      this.animationId = null;
    });
  }
  
  private render(): void {
    // Override this method in subclasses
  }
  
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

/**
 * DOM measurement utilities to prevent forced reflows
 */
export class DOMBatcher {
  private readOperations: (() => void)[] = [];
  private writeOperations: (() => void)[] = [];
  private scheduled: boolean = false;
  
  /**
   * Schedule a DOM read operation (measurements)
   */
  read(operation: () => void): void {
    this.readOperations.push(operation);
    this.schedule();
  }
  
  /**
   * Schedule a DOM write operation (modifications)
   */
  write(operation: () => void): void {
    this.writeOperations.push(operation);
    this.schedule();
  }
  
  private schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestAnimationFrame(() => {
      // Batch all reads first to avoid forced reflows
      this.readOperations.forEach(op => op());
      this.readOperations = [];
      
      // Then batch all writes
      this.writeOperations.forEach(op => op());
      this.writeOperations = [];
      
      this.scheduled = false;
    });
  }
  
  /**
   * Force immediate execution of batched operations
   */
  flush(): void {
    if (!this.scheduled) return;
    
    this.readOperations.forEach(op => op());
    this.writeOperations.forEach(op => op());
    
    this.readOperations = [];
    this.writeOperations = [];
    this.scheduled = false;
  }
}

/**
 * Global DOM batcher instance
 */
export const domBatcher = new DOMBatcher();

/**
 * Utility to safely measure DOM elements without causing forced reflows
 */
export function measureElement(
  element: HTMLElement,
  callback: (measurements: { width: number; height: number; rect: DOMRect }) => void
): void {
  domBatcher.read(() => {
    const rect = element.getBoundingClientRect();
    const measurements = {
      width: rect.width,
      height: rect.height,
      rect
    };
    callback(measurements);
  });
}

/**
 * Utility to safely modify DOM elements without causing layout thrashing
 */
export function modifyElement(
  element: HTMLElement,
  modifications: (el: HTMLElement) => void
): void {
  domBatcher.write(() => {
    modifications(element);
  });
}