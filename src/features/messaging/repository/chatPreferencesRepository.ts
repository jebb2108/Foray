import { ApiChatPreferences } from '../../../shared/api/contracts';
import {
  createEnvelope,
  readJsonStorage,
  writeJsonStorage,
} from '../../../shared/storage/jsonStorage';
import { asArray, asBoolean, asString, asTrimmedString, isRecord } from '../../../shared/lib/guards';

const STORAGE_KEY = 'foray.device-chat-preferences.v1';
const SCHEMA_VERSION = 1;

export type ChatPreferences = ApiChatPreferences;

function normalizePreference(value: unknown): ChatPreferences | null {
  if (!isRecord(value)) {
    return null;
  }

  const chatId = asTrimmedString(value.chatId);
  if (!chatId) {
    return null;
  }

  const rawMutedUntil = asString(value.mutedUntil).trim();
  const mutedUntilTimestamp = rawMutedUntil ? Date.parse(rawMutedUntil) : Number.NaN;
  const mutedUntil = Number.isFinite(mutedUntilTimestamp) && mutedUntilTimestamp > Date.now()
    ? new Date(mutedUntilTimestamp).toISOString()
    : null;

  return {
    chatId,
    isPinned: asBoolean(value.isPinned),
    isMuted: asBoolean(value.isMuted) || Boolean(mutedUntil),
    mutedUntil,
  };
}

export function loadChatPreferences(): Record<string, ChatPreferences> {
  const stored = readJsonStorage(STORAGE_KEY);
  const data = isRecord(stored) && stored.schemaVersion === SCHEMA_VERSION
    ? stored.data
    : {};
  const preferences: Record<string, ChatPreferences> = {};

  asArray(isRecord(data) ? Object.values(data) : data)
    .map(normalizePreference)
    .filter((preference): preference is ChatPreferences => preference !== null)
    .forEach((preference) => {
      preferences[preference.chatId] = preference;
    });

  return preferences;
}

export function saveChatPreferences(preferences: Record<string, ChatPreferences>): void {
  writeJsonStorage(STORAGE_KEY, createEnvelope(SCHEMA_VERSION, preferences));
}

export function updateChatPreference(
  chatId: string,
  changes: Partial<Omit<ChatPreferences, 'chatId'>>,
): Record<string, ChatPreferences> {
  const current = loadChatPreferences();
  const nextPreference: ChatPreferences = {
    chatId,
    isPinned: changes.isPinned ?? current[chatId]?.isPinned ?? false,
    isMuted: changes.isMuted ?? current[chatId]?.isMuted ?? false,
    mutedUntil: changes.mutedUntil === undefined
      ? current[chatId]?.mutedUntil ?? null
      : changes.mutedUntil,
  };
  const next = { ...current };

  if (!nextPreference.isPinned && !nextPreference.isMuted && !nextPreference.mutedUntil) {
    delete next[chatId];
  } else {
    next[chatId] = nextPreference;
  }

  saveChatPreferences(next);
  return next;
}

export function applyChatPreferences<T extends {
  id: string;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
}>(chats: T[]): T[] {
  const preferences = loadChatPreferences();

  return chats.map((chat) => {
    const preference = preferences[chat.id];
    if (!preference) {
      return { ...chat, isPinned: false, isMuted: false, mutedUntil: null };
    }
    return {
      ...chat,
      isPinned: preference.isPinned,
      isMuted: preference.isMuted,
      mutedUntil: preference.mutedUntil,
    };
  });
}
