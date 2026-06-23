import { PointerEvent as ReactPointerEvent, useEffect, useRef } from 'react';
import { ForayMessage } from '../../messaging/model/message';

interface UseMessageGesturesOptions {
  onLongPress: (message: ForayMessage) => void;
  onDoubleTap: (message: ForayMessage) => void;
}

export function useMessageGestures({ onLongPress, onDoubleTap }: UseMessageGesturesOptions) {
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ messageId: string; time: number } | null>(null);
  // обновляем рефы на каждом рендере чтобы коллбэки внутри setTimeout не устаревали
  const onLongPressRef = useRef(onLongPress);
  const onDoubleTapRef = useRef(onDoubleTap);
  onLongPressRef.current = onLongPress;
  onDoubleTapRef.current = onDoubleTap;

  const cancelPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelPress(), []);

  const startPress = (message: ForayMessage, event: ReactPointerEvent<HTMLDivElement>) => {
    cancelPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPressRef.current(message);
      pressTimerRef.current = null;
    }, 480);
  };

  const trackPress = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      pointerMovedRef.current = true;
      cancelPress();
    }
  };

  const finishPress = (message: ForayMessage) => {
    cancelPress();
    pointerStartRef.current = null;

    if (longPressTriggeredRef.current || pointerMovedRef.current) {
      longPressTriggeredRef.current = false;
      pointerMovedRef.current = false;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (lastTap?.messageId === message.id && now - lastTap.time <= 320) {
      onDoubleTapRef.current(message);
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { messageId: message.id, time: now };
  };

  return { startPress, trackPress, finishPress, cancelPress };
}
