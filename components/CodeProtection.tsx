import { useEffect } from 'react';

/**
 * CodeProtection Component
 * Prevents code inspection, right-click, and common developer tools access
 * Note: This provides basic deterrence but is not foolproof
 */
export const CodeProtection = () => {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
        (e.ctrlKey && e.shiftKey && e.keyCode === 67) // Ctrl+Shift+C
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection on sensitive elements
    const disableSelection = () => {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    };

    // Detect DevTools opening
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.clear();
        // You could also redirect or show a warning
      }
    };

    // Apply protections
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    disableSelection();
    
    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null;
};
