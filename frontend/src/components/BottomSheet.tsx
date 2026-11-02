import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * The mobile bottom sheet — the replacement for the old side panel.
 *
 * Two resting positions (peek / expanded). The user can tap the handle or drag
 * it; dragging is measured in pixels and snaps to the nearest position, which
 * behaves predictably on both touch and mouse.
 */
export default function BottomSheet({
  children,
  peekHeight = 46,
  expandedHeight = 86,
  className,
}: {
  children: React.ReactNode;
  /** Collapsed height in vh. */
  peekHeight?: number;
  /** Expanded height in vh. */
  expandedHeight?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dragStart = useRef<number | null>(null);

  // Reset to peek whenever the sheet is reused for a new screen size.
  useEffect(() => {
    const onResize = () => setOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragStart.current == null) return;
    const delta = e.clientY - dragStart.current;
    dragStart.current = null;
    // Up (negative) expands, down (positive) collapses. 24px is the threshold
    // so a sloppy tap does not fight the user.
    if (delta < -24) setOpen(true);
    else if (delta > 24) setOpen(false);
  }

  return (
    <div
      className={clsx('sheet', className)}
      style={{ height: open ? `${expandedHeight}dvh` : `${peekHeight}dvh` }}
    >
      <button
        type="button"
        className="sheet__handle"
        aria-expanded={open}
        aria-label={open ? 'Collapse' : 'Expand'}
        onClick={() => setOpen((o) => !o)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <span />
      </button>
      <div className="sheet__body scroll-thin">{children}</div>
    </div>
  );
}
