import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  checkmarkOutline,
  closeOutline,
  flagOutline,
  logOutOutline,
  searchOutline,
  trashOutline,
} from '../../../shared/icons';
import { useHistory } from 'react-router-dom';
import { copyText } from '../../../shared/lib/clipboard';
import emptyRoom from '../assets/empty-room.jpeg';
import foundRoom from '../assets/found-room.svg';
import waitingRoom from '../assets/waiting-room.jpeg';
import { INTEREST_TOPIC_BY_ID } from '../../profile/data/interests';
import { UserProfile } from '../../profile/model/userProfile';
import {
  createTextMessage,
  ForayMessage,
  getMessageText,
  toggleMessageReaction,
} from '../../messaging/model/message';
import TemporaryMessageActions from '../components/TemporaryMessageActions';
import TemporaryRoomChat from '../components/TemporaryRoomChat';
import { usePartnerMatching } from '../hooks/usePartnerMatching';
import { MatchCandidate } from '../model/matching';
import {
  createTemporaryReplyReference,
  formatRoomCountdown,
  TemporaryTranscriptEntry,
  temporaryMessagesToTranscript,
} from '../model/temporaryRoom';
import {
  readTemporaryRoomMessages,
  removeTemporaryRoomMessages,
  writeTemporaryRoomMessages,
} from '../repository/temporaryRoomRepository';
import '../../../styles/messenger.scss';

const SEARCH_MESSAGES = [
  'Ищем людей с общими интересами',
  'Собираем темы для хорошего разговора',
  'Проверяем, кто сейчас свободен',
  'Подбираем подходящего собеседника',
] as const;

interface WaitingRoomProps {
  user: UserProfile;
  onCreateMatchedChat: (
    name: string,
    color: string,
    transcript: TemporaryTranscriptEntry[],
  ) => { id: string };
  onSaveMessage: (message: ForayMessage) => void;
}

function interestName(interestId: string): string {
  const topic = INTEREST_TOPIC_BY_ID.get(interestId);
  const rawName = topic?.name ?? interestId.split(':').pop() ?? interestId;
  return rawName
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/gu, '')
    .trim();
}

export default function WaitingRoom({
  user,
  onCreateMatchedChat,
  onSaveMessage,
}: WaitingRoomProps) {
  const history = useHistory();
  const [messageIndex, setMessageIndex] = useState(0);
  const [roomText, setRoomText] = useState('');
  const [roomMessages, setRoomMessages] = useState<ForayMessage[]>([]);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ForayMessage | null>(null);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [replyTo, setReplyTo] = useState<ForayMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ForayMessage | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ messageId: string; time: number } | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const roomMessagesRef = useRef(roomMessages);
  const activeTranscriptRoomIdRef = useRef<string | null>(null);
  roomMessagesRef.current = roomMessages;

  const finishMatching = useCallback((candidate: MatchCandidate) => {
    removeTemporaryRoomMessages(activeTranscriptRoomIdRef.current);
    const chat = onCreateMatchedChat(
      candidate.name,
      candidate.color,
      temporaryMessagesToTranscript(roomMessagesRef.current),
    );
    setRoomMessages([]);
    setRoomText('');
    history.push(`/chats/${chat.id}`);
  }, [history, onCreateMatchedChat]);

  const matching = usePartnerMatching(user, finishMatching);
  const isSearching = matching.status === 'searching';
  const isMatchFound = matching.status === 'found';
  const isInitialConfirmation = matching.status === 'candidate'
    || matching.status === 'waiting'
    || matching.status === 'ready';
  const isRoomAvailable = matching.status === 'available-room';
  const isTemporaryRoom = matching.status === 'room'
    || matching.status === 'room-ended'
    || matching.status === 'decision';
  const isRoomChatVisible = matching.status === 'room'
    || matching.status === 'room-ended'
    || matching.status === 'decision';

  useEffect(() => {
    document.body.classList.toggle('temporary-room-open', isRoomChatVisible);
    return () => document.body.classList.remove('temporary-room-open');
  }, [isRoomChatVisible]);

  const commonInterestIds = useMemo(() => {
    if (!matching.candidate) {
      return [];
    }
    const userInterests = new Set(user.interestIds);
    const common = matching.candidate.interestIds.filter((id) => userInterests.has(id));
    return common.length > 0 ? common : matching.candidate.interestIds.slice(0, 3);
  }, [matching.candidate, user.interestIds]);

  useEffect(() => {
    if (!isSearching) {
      setMessageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % SEARCH_MESSAGES.length);
    }, 2_800);

    return () => window.clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    const roomId = matching.roomToken?.id ?? null;
    if (!roomId) {
      if (!isTemporaryRoom) {
        activeTranscriptRoomIdRef.current = null;
      }
      return;
    }
    if (activeTranscriptRoomIdRef.current === roomId) {
      return;
    }
    activeTranscriptRoomIdRef.current = roomId;
    setRoomMessages(readTemporaryRoomMessages(roomId));
    setRoomText('');
  }, [isTemporaryRoom, matching.roomToken?.id]);

  useEffect(() => {
    const roomId = activeTranscriptRoomIdRef.current;
    if (!roomId || !isTemporaryRoom) {
      return;
    }
    writeTemporaryRoomMessages(roomId, roomMessages);
  }, [isTemporaryRoom, roomMessages]);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [roomMessages.length]);

  const cancelLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelLongPress(), []);

  const sendTemporaryMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = roomText.trim();
    if (!text || matching.status !== 'room') {
      return;
    }

    if (editingMessage) {
      setRoomMessages((current) =>
        current.map((message) =>
          message.id === editingMessage.id
            ? {
                ...message,
                content: { type: 'text', text },
                editedAt: new Date().toISOString(),
              }
            : message));
      setEditingMessage(null);
    } else {
      const roomId = matching.roomToken?.id ?? activeTranscriptRoomIdRef.current ?? 'temporary-room';
      const message = createTextMessage({
        id: `temporary:${Date.now()}`,
        chatId: roomId,
        senderId: user.id,
        text,
        isOutgoing: true,
        deliveryState: 'read',
        replyTo: replyTo ? createTemporaryReplyReference(replyTo) : undefined,
        sentAt: new Date().toISOString(),
      });
      setRoomMessages((current) => [...current, message]);
      setReplyTo(null);
    }
    setRoomText('');
  };

  const startMessagePress = (
    message: ForayMessage,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowAllReactions(false);
      setSelectedMessage(message);
      pressTimerRef.current = null;
    }, 480);
  };

  const trackMessagePress = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      pointerMovedRef.current = true;
      cancelLongPress();
    }
  };

  const finishMessagePress = (message: ForayMessage) => {
    cancelLongPress();
    pointerStartRef.current = null;

    if (longPressTriggeredRef.current || pointerMovedRef.current) {
      longPressTriggeredRef.current = false;
      pointerMovedRef.current = false;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;
    if (lastTap?.messageId === message.id && now - lastTap.time <= 320) {
      setRoomMessages((current) =>
        current.map((item) =>
          item.id === message.id ? toggleMessageReaction(item, '❤️') : item));
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { messageId: message.id, time: now };
  };

  const chooseReaction = (reaction: string) => {
    if (!selectedMessage) {
      return;
    }
    setRoomMessages((current) =>
      current.map((message) =>
        message.id === selectedMessage.id ? toggleMessageReaction(message, reaction) : message));
    setSelectedMessage(null);
    setShowAllReactions(false);
  };

  const copySelectedMessage = async () => {
    if (!selectedMessage) {
      return;
    }
    await copyText(getMessageText(selectedMessage));
    setSelectedMessage(null);
  };

  const beginReply = () => {
    if (!selectedMessage) {
      return;
    }
    setReplyTo(selectedMessage);
    setEditingMessage(null);
    setSelectedMessage(null);
  };

  const beginEdit = () => {
    if (!selectedMessage) {
      return;
    }
    setEditingMessage(selectedMessage);
    setReplyTo(null);
    setRoomText(getMessageText(selectedMessage));
    setSelectedMessage(null);
  };

  const deleteSelectedMessage = () => {
    if (!selectedMessage) {
      return;
    }
    setRoomMessages((current) =>
      current.filter((message) => message.id !== selectedMessage.id));
    setSelectedMessage(null);
  };

  const cancelComposerContext = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setRoomText('');
  };

  const leaveTemporaryRoom = () => {
    removeTemporaryRoomMessages(activeTranscriptRoomIdRef.current);
    activeTranscriptRoomIdRef.current = null;
    setRoomMessages([]);
    setRoomText('');
    setReplyTo(null);
    setEditingMessage(null);
    setSelectedMessage(null);
    setShowRoomMenu(false);
    matching.leaveRoom();
  };

  const deleteTemporaryTranscript = () => {
    removeTemporaryRoomMessages(activeTranscriptRoomIdRef.current);
    setRoomMessages([]);
    setRoomText('');
    setReplyTo(null);
    setEditingMessage(null);
    setSelectedMessage(null);
    setShowRoomMenu(false);
  };

  const declineContinuation = () => {
    removeTemporaryRoomMessages(activeTranscriptRoomIdRef.current);
    activeTranscriptRoomIdRef.current = null;
    setRoomMessages([]);
    setRoomText('');
    setReplyTo(null);
    setEditingMessage(null);
    setSelectedMessage(null);
    matching.declineContinuation();
  };

  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className={`messenger-screen waiting-screen${isRoomChatVisible ? ' is-room-chat' : ''}`}>
          {!isRoomChatVisible && (
            <header className="messenger-header">
              <div>
                <span className="messenger-header__eyebrow">Комната</span>
                <h1>Ожидания</h1>
              </div>
            </header>
          )}

          <section className={`waiting-content${isRoomChatVisible ? ' is-room-chat' : ''}`}>
            {isInitialConfirmation && matching.candidate ? (
              <article className={`match-card is-${matching.status}`}>
                <div
                  className="match-card__avatar"
                  style={{ background: matching.candidate.color }}
                  aria-hidden="true"
                >
                  {matching.candidate.name[0]}
                </div>
                <div className="match-card__identity">
                  <h2>{matching.candidate.name}, {matching.candidate.age}</h2>
                  <span>{matching.candidate.city}</span>
                </div>
                <div className="match-card__interests">
                  {commonInterestIds.map((interestId) => (
                    <span key={interestId}>{interestName(interestId)}</span>
                  ))}
                </div>
                <p>{matching.candidate.bio}</p>

                {matching.status === 'candidate' && (
                  <div className="match-card__decision">
                    <button
                      type="button"
                      className="is-decline"
                      onClick={matching.declineInitialMatch}
                      aria-label="Выйти и отказаться от собеседника"
                    >
                      <IonIcon icon={logOutOutline} />
                      <small>Выйти</small>
                    </button>
                    <span>
                      <strong>Готовы войти в комнату?</strong>
                      <small>{formatRoomCountdown(matching.decisionSeconds)}</small>
                    </span>
                    <button
                      type="button"
                      onClick={matching.acceptInitialMatch}
                      aria-label="Подтвердить готовность войти в комнату"
                    >
                      <IonIcon icon={checkmarkOutline} />
                      <small>Готов</small>
                    </button>
                  </div>
                )}

                {matching.status === 'waiting' && (
                  <div className="match-card__pending">
                    <strong>Ждём подтверждения</strong>
                    <span>Собеседник тоже должен согласиться войти в комнату.</span>
                    <button type="button" onClick={matching.cancelInitialAcceptance}>
                      Отменить готовность
                    </button>
                  </div>
                )}

                {matching.status === 'ready' && (
                  <div className="match-card__ready">
                  <strong>Вы оба готовы</strong>
                    <span>Комната откроется через {formatRoomCountdown(matching.readySeconds)}</span>
                  </div>
                )}
              </article>
            ) : isRoomChatVisible && matching.candidate ? (
              <TemporaryRoomChat
                candidate={matching.candidate}
                roomToken={matching.roomToken}
                status={matching.status}
                roomSeconds={matching.roomSeconds}
                messages={roomMessages}
                text={roomText}
                replyTo={replyTo}
                editingMessage={editingMessage}
                messagesRef={messagesRef}
                selfUserId={user.id}
                onBack={matching.status === 'room'
                  ? matching.exitRoomView
                  : declineContinuation}
                onOpenMenu={() => setShowRoomMenu(true)}
                onSubmit={sendTemporaryMessage}
                onTextChange={setRoomText}
                onCancelContext={cancelComposerContext}
                onStartMessagePress={startMessagePress}
                onFinishMessagePress={finishMessagePress}
                onTrackMessagePress={trackMessagePress}
                onCancelLongPress={cancelLongPress}
                onSelectMessage={setSelectedMessage}
                onMessagesChange={(updater) => setRoomMessages(updater)}
              />
            ) : isRoomAvailable && matching.candidate ? (
              <>
                <button
                  className="waiting-illustration is-found"
                  type="button"
                  onClick={matching.enterRoom}
                  aria-label="Войти в комнату"
                >
                  <img src={foundRoom} alt="" aria-hidden="true" />
                </button>

                <div className="waiting-copy">
                  <h2>Комната открыта</h2>
                  <p>
                    Временная комната с {matching.candidate.name} доступна ещё
                    {' '}
                    {formatRoomCountdown(matching.roomSeconds)}. Если время истечёт,
                    вернуться уже не получится.
                  </p>
                </div>

                <button
                  className="waiting-action"
                  type="button"
                  onClick={matching.enterRoom}
                >
                  Войти в комнату
                </button>
              </>
            ) : (
              <>
                <button
                  className={[
                    'waiting-illustration',
                    isSearching ? ' is-searching' : '',
                    isMatchFound ? ' is-found' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={isMatchFound
                    ? matching.openCandidate
                    : isSearching
                      ? matching.cancelSearch
                      : matching.startSearch}
                  aria-label={isMatchFound
                    ? 'Открыть найденного собеседника'
                    : isSearching
                      ? 'Остановить поиск'
                      : 'Начать поиск собеседника'}
                >
                  <img
                    src={isMatchFound ? foundRoom : isSearching ? waitingRoom : emptyRoom}
                    alt=""
                    aria-hidden="true"
                  />
                </button>

                <div className="waiting-copy">
                  <h2>
                    {isMatchFound
                      ? 'Собеседник найден'
                      : isSearching
                        ? 'Ищем собеседника'
                        : `${user.name}, комната готова`}
                  </h2>
                  <p>
                    {isMatchFound
                      ? 'Откройте профиль и подтвердите готовность войти во временную комнату.'
                      : isSearching
                        ? SEARCH_MESSAGES[messageIndex]
                        : 'Войдите в очередь, чтобы найти человека с похожими интересами.'}
                  </p>
                </div>

                {!isMatchFound && (
                  <button
                    className={`waiting-action${isSearching ? ' is-cancel' : ''}`}
                    type="button"
                    onClick={isSearching ? matching.cancelSearch : matching.startSearch}
                  >
                    <IonIcon icon={isSearching ? closeOutline : searchOutline} />
                    {isSearching ? 'Выйти из очереди' : 'Найти собеседника'}
                  </button>
                )}
                {isMatchFound && (
                  <button
                    className="waiting-action"
                    type="button"
                    onClick={matching.openCandidate}
                  >
                    Войти в комнату
                  </button>
                )}
              </>
            )}
          </section>
        </main>

        {matching.candidate
          && matching.status === 'decision' && (
          <div className="messenger-overlay messenger-overlay--center">
            <section className="match-consent-dialog" role="dialog" aria-modal="true">
              <h3>Продолжить общение?</h3>
              <p>
                Если вы оба подтвердили продолжение, переписка с {matching.candidate.name}
                появится в разделе «Чаты». После закрытия окна вернуться в эту комнату нельзя.
              </p>
              <div>
                <button
                  type="button"
                  className="is-danger"
                  onClick={declineContinuation}
                >
                  <IonIcon icon={logOutOutline} />
                  Закрыть
                </button>
                <button type="button" onClick={matching.acceptContinuation}>
                  <IonIcon icon={checkmarkOutline} />
                  Продолжить
                </button>
              </div>
            </section>
          </div>
        )}

        {showRoomMenu && (
          <div className="messenger-overlay" role="presentation" onClick={() => setShowRoomMenu(false)}>
            <section
              className="messenger-sheet conversation-menu"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>{matching.candidate?.name ?? 'Комната'}</span>
                  <small>Действия комнаты</small>
                </div>
                <button type="button" onClick={() => setShowRoomMenu(false)} aria-label="Закрыть">
                  <IonIcon icon={closeOutline} />
                </button>
              </header>
              <button type="button" onClick={() => setShowRoomMenu(false)}>
                <IonIcon icon={flagOutline} />
                Пожаловаться
              </button>
              <button type="button" onClick={deleteTemporaryTranscript}>
                <IonIcon icon={trashOutline} />
                Удалить переписку
              </button>
              <button type="button" className="is-danger" onClick={leaveTemporaryRoom}>
                <IonIcon icon={logOutOutline} />
                Выйти из комнаты
              </button>
            </section>
          </div>
        )}

        {selectedMessage && (
          <TemporaryMessageActions
            message={selectedMessage}
            showAllReactions={showAllReactions}
            canEdit={matching.status === 'room'}
            onClose={() => {
              setSelectedMessage(null);
              setShowAllReactions(false);
            }}
            onToggleAllReactions={() => setShowAllReactions((current) => !current)}
            onChooseReaction={chooseReaction}
            onReply={beginReply}
            onCopy={copySelectedMessage}
            onSave={() => {
              onSaveMessage(selectedMessage);
              setSelectedMessage(null);
            }}
            onEdit={beginEdit}
            onDelete={deleteSelectedMessage}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
