import React, { useRef, useEffect } from 'react';

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
  className?: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, className = '' }) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (handleRef.current?.contains(e.target as Node)) {
        isResizing.current = true;
        startX.current = e.clientX;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const deltaX = e.clientX - startX.current;
        onResize(deltaX);
        startX.current = e.clientX;
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
      className={`resize-handle ${className}`}
      style={{
        width: '4px',
        backgroundColor: '#dee2e6',
        cursor: 'col-resize',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-2px',
          right: '-2px',
          bottom: 0,
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};

export default ResizeHandle;
