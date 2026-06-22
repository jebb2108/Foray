import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  bookmarkOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  copyOutline,
  createOutline,
  ellipsisHorizontalOutline,
  paperPlane,
  returnUpBackOutline,
  trashOutline,
} from '../../../shared/icons';
import { useHistory, useParams } from 'react-router-dom';
import { copyText } from '../../../shared/lib/clipboard';
import { formatTime } from '../../../shared/lib/date';
import { Chat } from '../model/chat';
import {
  ForayMessage,
  getMessageText,
  getSelectedReaction,
  MessageReplyReference,
} from '../model/message';
import '../../../styles/messenger.scss';

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

  useEffect(() => {
    if (chat) {
      onOpenChat(chat.id);
    }
  }, [chat?.id, onOpenChat]);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [visibleMessages.length]);

  useEffect(() => {
    if (pendingMessages.length === 0) {
      return;
    }

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
    if (!text.trim()) {
      return;
    }

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

  const startLongPress = (
    message: ForayMessage,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
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
    if (!start) {
      return;
    }

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
    if (!selectedMessage) {
      return;
    }
    onReactToMessage(chat.id, selectedMessage.id, reaction);
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
    setText(getMessageText(selectedMessage));
    setSelectedMessage(null);
  };

  return (
    <IonPage className="messenger-page conversation-page">
      <IonContent fullscreen>
        <main className="conversation-screen">
          <header className="conversation-header">
            <button type="button" onClick={() => history.push('/chats')} aria-label="Назад к чатам">
              <IonIcon icon={arrowBackOutline} />
            </button>
            <span className="chat-avatar" style={{ background: chat.avatar.color }}>
              {chat.avatar.initials}
            </span>
            <span className="conversation-header__title">
              <strong>{chat.title}</strong>
              <small>{chat.type === 'saved' ? 'Личные заметки' : 'был(а) недавно'}</small>
            </span>
            <button type="button" aria-label="Меню чата" onClick={() => setShowMenu(true)}>
              <IonIcon icon={ellipsisHorizontalOutline} />
            </button>
          </header>

          <section
            className="conversation-messages"
            aria-label={`Переписка с ${chat.title}`}
            ref={messagesRef}
          >
            <span className="conversation-date">Сегодня</span>
            {visibleMessages.map((message) => {
              const messageText = getMessageText(message);
              const selectedReaction = getSelectedReaction(message);
              return (
                <div
                  className={[
                    'message-bubble',
                    message.isOutgoing ? 'is-mine' : 'is-other',
                    selectedReaction ? 'has-reaction' : '',
                  ].filter(Boolean).join(' ')}
                  key={message.id}
                  onPointerDown={(event) => startLongPress(message, event)}
                  onPointerUp={() => finishMessagePress(message)}
                  onPointerCancel={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerMove={trackPointerMove}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    cancelLongPress();
                    setSelectedMessage(message);
                  }}
                >
                  {message.replyTo && (
                    <span className="message-reply-quote">
                      <strong>
                        {message.replyTo.senderId === chat.peerId ? chat.title : 'Вы'}
                      </strong>
                      <span>{message.replyTo.previewText}</span>
                    </span>
                  )}
                  <span>{messageText}</span>
                  <small className="message-meta">
                    <span>{formatTime(message.sentAt)}</span>
                    {message.isOutgoing && (
                      <IonIcon
                        className={`message-status is-${message.delivery.state}`}
                        icon={message.delivery.state === 'sent'
                          ? checkmarkOutline
                          : checkmarkDoneOutline}
                        aria-label={message.delivery.state === 'read'
                          ? 'Прочитано'
                          : 'Отправлено'}
                      />
                    )}
                  </small>
                  {selectedReaction && (
                    <button
                      type="button"
                      className="message-reaction"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onReactToMessage(chat.id, message.id, selectedReaction);
                      }}
                      aria-label={`Убрать реакцию ${selectedReaction}`}
                    >
                      {selectedReaction}
                    </button>
                  )}
                </div>
              );
            })}
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
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
            )}
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={chat.type === 'saved' ? 'Новая заметка' : 'Сообщение'}
              aria-label="Текст сообщения"
              autoComplete="off"
            />
            <button type="submit" disabled={!text.trim()} aria-label="Отправить">
              <IonIcon icon={paperPlane} />
            </button>
          </form>
        </main>

        {showMenu && (
          <div className="messenger-overlay" role="presentation" onClick={() => setShowMenu(false)}>
            <section
              className="messenger-sheet conversation-menu"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>{chat.title}</span>
                  <small>Управление диалогом</small>
                </div>
                <button type="button" onClick={() => setShowMenu(false)} aria-label="Закрыть">
                  <IonIcon icon={closeOutline} />
                </button>
              </header>
              <button
                type="button"
                onClick={() => {
                  onClearChat(chat.id);
                  setShowMenu(false);
                }}
              >
                Очистить историю
              </button>
              {chat.type !== 'saved' && (
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    onDeleteChat(chat.id);
                    history.replace('/chats');
                  }}
                >
                  <IonIcon icon={trashOutline} />
                  Удалить чат
                </button>
              )}
            </section>
          </div>
        )}

        {selectedMessage && (
          <div
            className="messenger-overlay"
            role="presentation"
            onClick={() => {
              setSelectedMessage(null);
              setShowAllReactions(false);
            }}
          >
            <section
              className="messenger-sheet message-actions"
              role="dialog"
              aria-modal="true"
              aria-label="Действия с сообщением"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`reaction-picker${showAllReactions ? ' is-expanded' : ''}`}>
                {(showAllReactions
                  ? ['❤️', '👍', '🔥', '😂', '🎉', '😮', '😢', '👏', '🤔', '👎']
                  : ['❤️', '👍', '🔥', '😂', '🎉']
                ).map((reaction) => (
                  <button
                    type="button"
                    key={reaction}
                    onClick={() => chooseReaction(reaction)}
                    aria-label={`Реакция ${reaction}`}
                  >
                    {reaction}
                  </button>
                ))}
                <button
                  type="button"
                  className="reaction-picker__more"
                  onClick={() => setShowAllReactions((current) => !current)}
                  aria-label={showAllReactions ? 'Свернуть реакции' : 'Больше реакций'}
                >
                  <IonIcon icon={showAllReactions ? chevronUpOutline : chevronDownOutline} />
                </button>
              </div>
              <p>{getMessageText(selectedMessage)}</p>
              <button type="button" onClick={beginReply}>
                <IonIcon icon={returnUpBackOutline} />
                Ответить
              </button>
              <button type="button" onClick={copySelectedMessage}>
                <IonIcon icon={copyOutline} />
                Копировать
              </button>
              {chat.type !== 'saved' && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveMessage(selectedMessage);
                    setSelectedMessage(null);
                  }}
                >
                  <IonIcon icon={bookmarkOutline} />
                  Сохранить в Избранное
                </button>
              )}
              {selectedMessage.permissions.canBeEdited && (
                <button type="button" onClick={beginEdit}>
                  <IonIcon icon={createOutline} />
                  Изменить
                </button>
              )}
              {selectedMessage.permissions.canBeDeleted && (
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => {
                    onDeleteMessage(chat.id, selectedMessage.id);
                    setSelectedMessage(null);
                  }}
                >
                  <IonIcon icon={trashOutline} />
                  Удалить
                </button>
              )}
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
