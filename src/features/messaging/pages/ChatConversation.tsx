import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { copyText } from '../../../shared/lib/clipboard';
import { Chat } from '../model/chat';
import {
  ForayMessage,
  getMessageText,
  MessageReplyReference,
} from '../model/message';
import ConversationHeader from '../components/ConversationHeader';
import ConversationMenu from '../components/ConversationMenu';
import MessageActionsSheet from '../components/MessageActionsSheet';
import MessageBubble from '../components/MessageBubble';
import '../../../styles/messenger.scss';
import './ChatConversation.scss';

interface ChatConversationProps {
  chats: Chat[];
  messages: ForayMessage[];
  onOpenChat: (chatId: string) => void;
  onSendMessage: (
    chatId: string,
    text: string,
    replyTo?: MessageReplyReference,
    messageId?: string,
  ) => ForayMessage | null;
  onEditMessage: (chatId: string, messageId: string, text: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
  onReactToMessage: (chatId: string, messageId: string, reaction: string) => void;
  onSaveMessage: (message: ForayMessage) => void;
  onClearChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onReportSpam: (chatId: string) => void;
}

interface ChatParams {
  chatId: string;
}

function createReplyReference(message: ForayMessage): MessageReplyReference {
  // В ответе хранится снимок текста на момент создания
  return {
    chatId: message.chatId,
    messageId: message.id,
    senderId: message.sender.id,
    previewText: getMessageText(message),
  };
}

export default function ChatConversation({
  chats,
  messages,
  onOpenChat,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onSaveMessage,
  onClearChat,
  onDeleteChat,
  onReportSpam,
}: ChatConversationProps) {
  const history = useHistory();
  const { chatId } = useParams<ChatParams>();
  const [text, setText] = useState('');
  const [pendingMessages, setPendingMessages] = useState<ForayMessage[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ForayMessage | null>(null);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [replyTo, setReplyTo] = useState<ForayMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ForayMessage | null>(null);
  const messagesRef = useRef<HTMLElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ messageId: string; time: number } | null>(null);
  const chat = useMemo(() => chats.find((item) => item.id === chatId), [chatId, chats]);
  const storedMessages = useMemo(
    () => messages
      .filter((message) => message.chatId === chatId)
      .sort((left, right) => left.sentAt.localeCompare(right.sentAt)),
    [chatId, messages],
  );

  // Локальная очередь показывает сообщение до обновления общего состояния
  const visibleMessages = useMemo(() => {
    const storedIds = new Set(storedMessages.map((message) => message.id));
    return [
      ...storedMessages,
      ...pendingMessages.filter((message) => !storedIds.has(message.id)),
    ];
  }, [pendingMessages, storedMessages]);

  const firstRealMessage = useMemo(
    () => visibleMessages.find((message) => message.sender.type !== 'system'),
    [visibleMessages],
  );
  const showSpamReportBanner = Boolean(
    chat
    && chat.type === 'direct'
    && !chat.isContact
    && chat.isIncomingRequest
    && !chat.isSpamReported
    && !chat.isBlocked
    && firstRealMessage
    && !firstRealMessage.isOutgoing,
  );

  useEffect(() => {
    if (chat) onOpenChat(chat.id);
  }, [chat?.id, onOpenChat]);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;
    const frame = window.requestAnimationFrame(() => {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visibleMessages.length]);

  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const storedIds = new Set(storedMessages.map((message) => message.id));
    // Подтверждённые сообщения удаляются из локальной очереди
    setPendingMessages((current) =>
      current.filter((message) => !storedIds.has(message.id)));
  }, [storedMessages]);

  const cancelLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelLongPress(), []);

  if (!chat) {
    return (
      <IonPage className="messenger-page">
        <IonContent fullscreen>
          <main className="conversation-missing">
            <strong>Чат не найден</strong>
            <button type="button" onClick={() => history.replace('/chats')}>Вернуться</button>
          </main>
        </IonContent>
      </IonPage>
    );
  }

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || chat.isBlocked) return;

    if (editingMessage) {
      onEditMessage(chat.id, editingMessage.id, text);
      setEditingMessage(null);
    } else {
      const sentMessage = onSendMessage(
        chat.id,
        text,
        replyTo ? createReplyReference(replyTo) : undefined,
      );
      if (sentMessage) {
        setPendingMessages((current) => [...current, sentMessage]);
      }
      setReplyTo(null);
    }
    setText('');
  };

  const startLongPress = (message: ForayMessage, event: ReactPointerEvent<HTMLDivElement>) => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    // Удержание открывает действия над сообщением
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowAllReactions(false);
      setSelectedMessage(message);
      pressTimerRef.current = null;
    }, 480);
  };

  const trackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    // Небольшое движение пальца не отменяет удержание
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

    // Двойное нажатие переключает реакцию с сердцем
    if (lastTap?.messageId === message.id && now - lastTap.time <= 320) {
      onReactToMessage(chat.id, message.id, '❤️');
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { messageId: message.id, time: now };
  };

  const chooseReaction = (reaction: string) => {
    if (!selectedMessage) return;
    onReactToMessage(chat.id, selectedMessage.id, reaction);
    setSelectedMessage(null);
    setShowAllReactions(false);
  };

  const copySelectedMessage = async () => {
    if (!selectedMessage) return;
    await copyText(getMessageText(selectedMessage));
    setSelectedMessage(null);
  };

  const beginReply = () => {
    if (!selectedMessage) return;
    setReplyTo(selectedMessage);
    setEditingMessage(null);
    setSelectedMessage(null);
  };

  const beginEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setReplyTo(null);
    setText(getMessageText(selectedMessage));
    setSelectedMessage(null);
  };

  return (
    <IonPage className="messenger-page conversation-page">
      <IonContent fullscreen>
        <main className="conversation-screen">
          <ConversationHeader
            chat={chat}
            onBack={() => history.push('/chats')}
            onOpenMenu={() => setShowMenu(true)}
          />

          <section
            className="conversation-messages"
            aria-label={`Переписка с ${chat.title}`}
            ref={messagesRef}
          >
            <span className="conversation-date">Сегодня</span>
            {showSpamReportBanner && (
              <div className="spam-report-banner">
                <span>Пользователь не из ваших контактов написал первым.</span>
                <button type="button" onClick={() => onReportSpam(chat.id)}>
                  Пожаловаться на спам
                </button>
              </div>
            )}
            {visibleMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                peerId={chat.peerId}
                peerTitle={chat.title}
                onPointerDown={(event) => startLongPress(message, event)}
                onPointerUp={() => finishMessagePress(message)}
                onPointerCancel={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerMove={trackPointerMove}
                onContextMenu={() => {
                  cancelLongPress();
                  setSelectedMessage(message);
                }}
                onReactToMessage={(reaction) => onReactToMessage(chat.id, message.id, reaction)}
              />
            ))}
          </section>

          <form className="message-composer" onSubmit={submitMessage}>
            {(replyTo || editingMessage) && (
              <div className="message-composer__context">
                <span>
                  <strong>{editingMessage ? 'Редактирование' : 'Ответ'}</strong>
                  <small>{getMessageText(editingMessage ?? replyTo!)}</small>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setEditingMessage(null);
                    setText('');
                  }}
                  aria-label="Отменить"
                />
              </div>
            )}
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                chat.isBlocked
                  ? 'Пользователь заблокирован'
                  : chat.type === 'saved'
                    ? 'Новая заметка'
                    : 'Сообщение'
              }
              disabled={chat.isBlocked}
              aria-label="Текст сообщения"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={chat.isBlocked || !text.trim()}
              aria-label="Отправить"
            />
          </form>
        </main>

        {showMenu && (
          <ConversationMenu
            chat={chat}
            onClose={() => setShowMenu(false)}
            onClearChat={() => onClearChat(chat.id)}
            onDeleteChat={() => {
              onDeleteChat(chat.id);
              history.replace('/chats');
            }}
            onLeave={() => {
              onDeleteChat(chat.id);
              setShowMenu(false);
              history.replace('/chats');
            }}
          />
        )}

        {selectedMessage && (
          <MessageActionsSheet
            message={selectedMessage}
            chatType={chat.type}
            showAllReactions={showAllReactions}
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
            onDelete={() => {
              onDeleteMessage(chat.id, selectedMessage.id);
              setSelectedMessage(null);
            }}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
