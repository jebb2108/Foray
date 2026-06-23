export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeIsoDate(value: unknown, fallback = nowIso()): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatDate(value: string, showRecentDay = false): string {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return formatTime(value);
  }

  if (showRecentDay) {
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startOfDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const daysAgo = Math.round(
      (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
    );

    if (daysAgo === 1) {
      return 'вчера';
    }

    if (daysAgo >= 2 && daysAgo <= 6) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' })
        .replace('.', '')
        .toLocaleLowerCase('ru-RU');
    }
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });
}
