import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserProfile } from '../../profile/model/userProfile';
import {
  MATCH_CANDIDATES,
  MATCH_DECISION_SECONDS,
  MATCH_READY_SECONDS,
  MATCH_ROOM_SECONDS,
  MatchCandidate,
  MatchRoomToken,
  MatchingStatus,
} from '../model/matching';
import {
  clearActiveRoomToken,
  readActiveRoomToken,
  writeActiveRoomToken,
} from '../repository/activeRoomTokenRepository';

interface PartnerMatching {
  status: MatchingStatus;
  candidate: MatchCandidate | null;
  roomToken: MatchRoomToken | null;
  decisionSeconds: number;
  roomSeconds: number;
  readySeconds: number;
  startSearch: () => void;
  cancelSearch: () => void;
  openCandidate: () => void;
  acceptInitialMatch: () => void;
  cancelInitialAcceptance: () => void;
  declineInitialMatch: () => void;
  enterRoom: () => void;
  exitRoomView: () => void;
  leaveRoom: () => void;
  acceptContinuation: () => void;
  declineContinuation: () => void;
  abandonRoom: () => void;
}

function secondsUntil(expiresAt: string): number {
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) {
    return 0;
  }
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1_000));
}

function rankCandidates(user: UserProfile): MatchCandidate[] {
  const interests = new Set(user.interestIds);
  return [...MATCH_CANDIDATES].sort((left, right) => {
    const rightScore = right.interestIds.filter((id) => interests.has(id)).length;
    const leftScore = left.interestIds.filter((id) => interests.has(id)).length;
    return rightScore - leftScore;
  });
}

export function usePartnerMatching(
  user: UserProfile,
  onContinuationReady: (candidate: MatchCandidate) => void,
): PartnerMatching {
  const initialRoomToken = useMemo(() => readActiveRoomToken(), []);
  const [status, setStatus] = useState<MatchingStatus>(
    initialRoomToken ? 'available-room' : 'idle',
  );
  const [candidate, setCandidate] = useState<MatchCandidate | null>(
    initialRoomToken?.candidate ?? null,
  );
  const [roomToken, setRoomToken] = useState<MatchRoomToken | null>(initialRoomToken);
  const [decisionSeconds, setDecisionSeconds] = useState(MATCH_DECISION_SECONDS);
  const [roomSeconds, setRoomSeconds] = useState(
    initialRoomToken ? secondsUntil(initialRoomToken.expiresAt) : MATCH_ROOM_SECONDS,
  );
  const [readySeconds, setReadySeconds] = useState(MATCH_READY_SECONDS);
  const candidateIndexRef = useRef(0);
  const statusRef = useRef(status);
  const roomTokenRef = useRef(roomToken);
  statusRef.current = status;
  roomTokenRef.current = roomToken;

  const rankedCandidates = useMemo(() => rankCandidates(user), [user]);

  const resetToIdle = useCallback((clearStoredRoom = true) => {
    if (clearStoredRoom) {
      clearActiveRoomToken();
      setRoomToken(null);
    }
    setStatus('idle');
    setCandidate(null);
    setDecisionSeconds(MATCH_DECISION_SECONDS);
    setRoomSeconds(MATCH_ROOM_SECONDS);
    setReadySeconds(MATCH_READY_SECONDS);
  }, []);

  const startSearch = useCallback(() => {
    if (statusRef.current !== 'idle') {
      return;
    }
    setCandidate(null);
    setStatus('searching');
  }, []);

  const cancelSearch = useCallback(() => {
    if (statusRef.current === 'searching') {
      resetToIdle();
    }
  }, [resetToIdle]);

  const openCandidate = useCallback(() => {
    if (statusRef.current === 'found' && candidate) {
      setDecisionSeconds(MATCH_DECISION_SECONDS);
      setStatus('candidate');
    }
  }, [candidate]);

  const declineInitialMatch = useCallback(() => {
    if (statusRef.current === 'candidate' || statusRef.current === 'waiting') {
      candidateIndexRef.current = (candidateIndexRef.current + 1) % rankedCandidates.length;
      resetToIdle();
    }
  }, [rankedCandidates.length, resetToIdle]);

  const acceptInitialMatch = useCallback(() => {
    if (statusRef.current === 'candidate') {
      setStatus('waiting');
    }
  }, []);

  const cancelInitialAcceptance = useCallback(() => {
    if (statusRef.current === 'waiting') {
      setStatus('candidate');
    }
  }, []);

  const acceptContinuation = useCallback(() => {
    if (statusRef.current === 'decision') {
      const currentCandidate = candidate;
      resetToIdle();
      if (currentCandidate) {
        onContinuationReady(currentCandidate);
      }
    }
  }, [candidate, onContinuationReady, resetToIdle]);

  const declineContinuation = useCallback(() => {
    if (
      statusRef.current === 'decision'
      || statusRef.current === 'room-ended'
    ) {
      resetToIdle();
    }
  }, [resetToIdle]);

  const createRoomToken = useCallback((nextCandidate: MatchCandidate) => {
    const now = Date.now();
    const token: MatchRoomToken = {
      id: `room:${nextCandidate.id}:${now}`,
      candidate: nextCandidate,
      startedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + MATCH_ROOM_SECONDS * 1_000).toISOString(),
      active: true,
      partnerOnline: true,
    };
    writeActiveRoomToken(token);
    setCandidate(nextCandidate);
    setRoomToken(token);
    setRoomSeconds(MATCH_ROOM_SECONDS);
    setStatus('room');
  }, []);

  const enterRoom = useCallback(() => {
    const token = roomTokenRef.current ?? readActiveRoomToken();
    if (!token || !token.active || secondsUntil(token.expiresAt) <= 0) {
      resetToIdle();
      return;
    }
    setCandidate(token.candidate);
    setRoomToken(token);
    setRoomSeconds(secondsUntil(token.expiresAt));
    setStatus('room');
  }, [resetToIdle]);

  const exitRoomView = useCallback(() => {
    const token = roomTokenRef.current ?? readActiveRoomToken();
    if (
      statusRef.current === 'room'
      && token
      && token.active
      && secondsUntil(token.expiresAt) > 0
    ) {
      setCandidate(token.candidate);
      setRoomToken(token);
      setStatus('available-room');
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (
      statusRef.current === 'available-room'
      || statusRef.current === 'room'
      || statusRef.current === 'room-ended'
      || statusRef.current === 'decision'
    ) {
      resetToIdle();
    }
  }, [resetToIdle]);

  const abandonRoom = leaveRoom;

  useEffect(() => {
    if (status !== 'searching') {
      return undefined;
    }

    const matchTimer = window.setTimeout(() => {
      const nextCandidate = rankedCandidates[candidateIndexRef.current % rankedCandidates.length];
      setCandidate(nextCandidate);
      setStatus('found');
    }, 3_200);

    return () => window.clearTimeout(matchTimer);
  }, [rankedCandidates, status]);

  useEffect(() => {
    if (status !== 'candidate') {
      return undefined;
    }

    let remaining = MATCH_DECISION_SECONDS;
    setDecisionSeconds(remaining);
    const timer = window.setInterval(() => {
      remaining -= 1;
      setDecisionSeconds(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        declineInitialMatch();
      }
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [declineInitialMatch, status]);

  useEffect(() => {
    if (status !== 'waiting') {
      return undefined;
    }

    const partnerTimer = window.setTimeout(() => {
      setReadySeconds(MATCH_READY_SECONDS);
      setStatus('ready');
    }, 2_200);

    return () => window.clearTimeout(partnerTimer);
  }, [status]);

  useEffect(() => {
    if (status !== 'ready' || !candidate) {
      return undefined;
    }

    let remaining = MATCH_READY_SECONDS;
    const timer = window.setInterval(() => {
      remaining -= 1;
      setReadySeconds(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        createRoomToken(candidate);
      }
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [candidate, createRoomToken, status]);

  useEffect(() => {
    if (status !== 'room' && status !== 'available-room') {
      return undefined;
    }

    const token = roomTokenRef.current ?? readActiveRoomToken();
    if (!token || !token.active) {
      resetToIdle();
      return undefined;
    }

    const updateRoomLifetime = () => {
      const remaining = secondsUntil(token.expiresAt);
      setRoomSeconds(remaining);
      if (remaining <= 0) {
        clearActiveRoomToken();
        if (statusRef.current === 'room') {
          setRoomToken({ ...token, active: false, endedReason: 'expired' });
          setStatus('decision');
        } else {
          setRoomToken(null);
          resetToIdle(false);
        }
        return true;
      }

      const storedToken = readActiveRoomToken();
      if (!storedToken || storedToken.id !== token.id) {
        setRoomSeconds(0);
        if (statusRef.current === 'room') {
          setRoomToken({
            ...token,
            active: false,
            partnerOnline: false,
            endedReason: 'partner-left',
          });
          setStatus('room-ended');
        } else {
          setRoomToken(null);
          resetToIdle(false);
        }
        return true;
      }
      return false;
    };

    if (updateRoomLifetime()) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (updateRoomLifetime()) {
        window.clearInterval(timer);
      }
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [resetToIdle, status]);

  return {
    status,
    candidate,
    roomToken,
    decisionSeconds,
    roomSeconds,
    readySeconds,
    startSearch,
    cancelSearch,
    openCandidate,
    acceptInitialMatch,
    cancelInitialAcceptance,
    declineInitialMatch,
    enterRoom,
    exitRoomView,
    leaveRoom,
    acceptContinuation,
    declineContinuation,
    abandonRoom,
  };
}
