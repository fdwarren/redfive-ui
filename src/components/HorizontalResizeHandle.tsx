import React, { useRef, useEffect } from 'react';

interface HorizontalResizeHandleProps {
  onResize: (deltaY: number) => void;
  className?: string;
}

const HorizontalResizeHandle: React.FC<HorizontalResizeHandleProps> = ({ onResize, className = '' }) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (handleRef.current?.contains(e.target as Node)) {
        isResizing.current = true;
        startY.current = e.clientY;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const deltaY = e.clientY - startY.current;
        onResize(deltaY);
        startY.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  return (
    <div
      ref={handleRef}
      className={`horizontal-resize-handle ${className}`}
      style={{
        height: '4px',
        backgroundColor: '#dee2e6',
        cursor: 'row-resize',
        position: 'relative',
        flexShrink: 0,
        width: '100%'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-2px',
          left: 0,
          right: 0,
          bottom: '-2px',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};

export default HorizontalResizeHandle;
