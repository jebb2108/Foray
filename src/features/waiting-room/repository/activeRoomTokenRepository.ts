import {
  MATCH_CANDIDATES,
  MatchCandidate,
  MatchRoomToken,
} from '../model/matching';

const STORAGE_KEY = 'foray.waiting-room.active-token.v2';
const LEGACY_STORAGE_KEY = 'foray.waiting-room.active-token.v1';

interface StoredMatchRoomToken {
  id: string;
  candidateId: string;
  startedAt: string;
  expiresAt: string;
  active: boolean;
  partnerOnline: boolean;
  endedReason?: MatchRoomToken['endedReason'];
}

function findCandidate(candidateId: string): MatchCandidate | null {
  return MATCH_CANDIDATES.find((candidate) => candidate.id === candidateId) ?? null;
}

function toStoredToken(token: MatchRoomToken): StoredMatchRoomToken {
  return {
    id: token.id,
    candidateId: token.candidate.id,
    startedAt: token.startedAt,
    expiresAt: token.expiresAt,
    active: token.active,
    partnerOnline: token.partnerOnline,
    endedReason: token.endedReason,
  };
}

function fromStoredToken(token: StoredMatchRoomToken): MatchRoomToken | null {
  const candidate = findCandidate(token.candidateId);
  const expiresAt = Date.parse(token.expiresAt);
  if (
    !candidate
    || !token.id
    || token.active !== true
    || !Number.isFinite(expiresAt)
    || expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    id: token.id,
    candidate,
    startedAt: token.startedAt,
    expiresAt: token.expiresAt,
    active: token.active,
    partnerOnline: token.partnerOnline,
    endedReason: token.endedReason,
  };
}

export function readActiveRoomToken(): MatchRoomToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const token = fromStoredToken(JSON.parse(raw) as StoredMatchRoomToken);
      if (token) {
        return token;
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyToken = JSON.parse(legacyRaw) as Partial<MatchRoomToken>;
      if (legacyToken.candidate?.id) {
        const token = fromStoredToken({
          id: String(legacyToken.id),
          candidateId: legacyToken.candidate.id,
          startedAt: String(legacyToken.startedAt),
          expiresAt: String(legacyToken.expiresAt),
          active: legacyToken.active === true,
          partnerOnline: legacyToken.partnerOnline !== false,
          endedReason: legacyToken.endedReason,
        });
        if (token) {
          writeActiveRoomToken(token);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return token;
        }
      }
    }

    clearActiveRoomToken();
    return null;
  } catch {
    clearActiveRoomToken();
    return null;
  }
}

export function writeActiveRoomToken(token: MatchRoomToken | null): void {
  try {
    if (!token || !token.active || Date.parse(token.expiresAt) <= Date.now()) {
      clearActiveRoomToken();
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredToken(token)));
  } catch {
    // Временная комната остаётся доступной в памяти hook-а
  }
}

export function clearActiveRoomToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Приватный режим может запретить доступ к хранилищу
  }
}
