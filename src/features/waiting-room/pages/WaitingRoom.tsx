import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { copyText } from '../../../shared/lib/clipboard';
import { UserProfile } from '../../profile/model/userProfile';
import {
  createTextMessage,
  ForayMessage,
  getMessageText,
  toggleMessageReaction,
} from '../../messaging/model/message';
import MatchCard from '../components/MatchCard';
import RoomAvailableView from '../components/RoomAvailableView';
import RoomMenuSheet from '../components/RoomMenuSheet';
import SearchView from '../components/SearchView';
import ContinuationDialog from '../components/ContinuationDialog';
import TemporaryMessageActions from '../components/TemporaryMessageActions';
import TemporaryRoomChat from '../components/TemporaryRoomChat';
import { useMessageGestures } from '../hooks/useMessageGestures';
import { usePartnerMatching } from '../hooks/usePartnerMatching';
import { MatchCandidate } from '../model/matching';
import {
  createTemporaryReplyReference,
  TemporaryTranscriptEntry,
  temporaryMessagesToTranscript,
} from '../model/temporaryRoom';
import {
  readTemporaryRoomMessages,
  removeTemporaryRoomMessages,
  writeTemporaryRoomMessages,
} from '../repository/temporaryRoomRepository';
import '../../../styles/messenger.scss';
import './WaitingRoom.scss';

interface WaitingRoomProps {
  user: UserProfile;
  onCreateMatchedChat: (
    name: string,
    color: string,
    transcript: TemporaryTranscriptEntry[],
  ) => { id: string };
  onSaveMessage: (message: ForayMessage) => void;
}

export default function WaitingRoom({
  user,
  onCreateMatchedChat,
  onSaveMessage,
}: WaitingRoomProps) {
  const history = useHistory();
  const [roomText, setRoomText] = useState('');
  const [roomMessages, setRoomMessages] = useState<ForayMessage[]>([]);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ForayMessage | null>(null);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [replyTo, setReplyTo] = useState<ForayMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ForayMessage | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const roomMessagesRef = useRef(roomMessages);
  const activeTranscriptRoomIdRef = useRef<string | null>(null);
  // обновляем на каждом рендере чтобы finishMatching читал актуальные сообщения без добавления в зависимости
  roomMessagesRef.current = roomMessages;

  const { startPress, trackPress, finishPress, cancelPress } = useMessageGestures({
    onLongPress: (message) => {
      setShowAllReactions(false);
      setSelectedMessage(message);
    },
    onDoubleTap: (message) => {
      setRoomMessages((current) =>
        current.map((item) =>
          item.id === message.id ? toggleMessageReaction(item, '❤️') : item));
    },
  });

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

  // синхронизирует класс body для глобального CSS таргетинга оверлея чата комнаты
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

  // загружает сохранённые сообщения при входе в новую комнату без повторной загрузки при смене статуса
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

  // сохраняет сообщения в localStorage при каждом изменении пока комната активна
  useEffect(() => {
    const roomId = activeTranscriptRoomIdRef.current;
    if (!roomId || !isTemporaryRoom) {
      return;
    }
    writeTemporaryRoomMessages(roomId, roomMessages);
  }, [isTemporaryRoom, roomMessages]);

  // прокручивает чат вниз после каждого нового сообщения с задержкой на один кадр для обновления DOM
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

  const resetRoomState = () => {
    removeTemporaryRoomMessages(activeTranscriptRoomIdRef.current);
    setRoomMessages([]);
    setRoomText('');
    setReplyTo(null);
    setEditingMessage(null);
    setSelectedMessage(null);
    setShowRoomMenu(false);
  };

  const leaveTemporaryRoom = () => {
    resetRoomState();
    activeTranscriptRoomIdRef.current = null;
    matching.leaveRoom();
  };

  const deleteTemporaryTranscript = () => resetRoomState();

  const declineContinuation = () => {
    resetRoomState();
    activeTranscriptRoomIdRef.current = null;
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
              <MatchCard
                candidate={matching.candidate}
                status={matching.status as 'candidate' | 'waiting' | 'ready'}
                decisionSeconds={matching.decisionSeconds}
                readySeconds={matching.readySeconds}
                commonInterestIds={commonInterestIds}
                onDecline={matching.declineInitialMatch}
                onAccept={matching.acceptInitialMatch}
                onCancelAcceptance={matching.cancelInitialAcceptance}
              />
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
                onStartMessagePress={startPress}
                onFinishMessagePress={finishPress}
                onTrackMessagePress={trackPress}
                onCancelLongPress={cancelPress}
                onSelectMessage={setSelectedMessage}
                onMessagesChange={(updater) => setRoomMessages(updater)}
              />
            ) : isRoomAvailable && matching.candidate ? (
              <RoomAvailableView
                candidateName={matching.candidate.name}
                roomSeconds={matching.roomSeconds}
                onEnterRoom={matching.enterRoom}
              />
            ) : (
              <SearchView
                userName={user.name}
                isSearching={isSearching}
                isMatchFound={isMatchFound}
                onStartSearch={matching.startSearch}
                onCancelSearch={matching.cancelSearch}
                onOpenCandidate={matching.openCandidate}
              />
            )}
          </section>
        </main>

        {matching.candidate && matching.status === 'decision' && (
          <ContinuationDialog
            candidateName={matching.candidate.name}
            onDecline={declineContinuation}
            onAccept={matching.acceptContinuation}
          />
        )}

        {showRoomMenu && (
          <RoomMenuSheet
            candidateName={matching.candidate?.name}
            onClose={() => setShowRoomMenu(false)}
            onDeleteTranscript={deleteTemporaryTranscript}
            onLeaveRoom={leaveTemporaryRoom}
          />
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
