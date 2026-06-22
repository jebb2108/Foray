import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { LocalChat } from '../data/localChats';
import './Messenger.scss';

interface ChatConversationProps {
  chats: LocalChat[];
  onOpenChat: (chatId: string) => void;
  onSendMessage: (
    chatId: string,
    text: string,
    replyTo?: LocalChat['messages'][number]['replyTo'],
    messageId?: string,
  ) => void;
  onEditMessage: (chatId: string, messageId: string, text: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
  onReactToMessage: (chatId: string, messageId: string, reaction: string) => void;
  onSaveMessage: (text: string) => void;
  onClearChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

interface ChatParams {
  chatId: string;
}

function messageTime(value: string): string {
  return new Date(value).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatConversation({
  chats,
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
  const [pendingMessages, setPendingMessages] = useState<LocalChat['messages']>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<LocalChat['messages'][number] | null>(null);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [replyTo, setReplyTo] = useState<LocalChat['messages'][number] | null>(null);
  const [editingMessage, setEditingMessage] = useState<LocalChat['messages'][number] | null>(null);
  const messagesRef = useRef<HTMLElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const lastTapRef = useRef<{ messageId: string; time: number } | null>(null);
  const chat = useMemo(() => chats.find((item) => item.id === chatId), [chatId, chats]);
  const visibleMessages = useMemo(() => {
    if (!chat) {
      return [];
    }

    const storedIds = new Set(chat.messages.map((message) => message.id));
    return [
      ...chat.messages,
      ...pendingMessages.filter((message) => !storedIds.has(message.id)),
    ];
  }, [chat, pendingMessages]);

  useEffect(() => {
    if (chat) {
      onOpenChat(chat.id);
    }
  }, [chat?.id]);

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
    if (!chat || pendingMessages.length === 0) {
      return;
    }

    const storedIds = new Set(chat.messages.map((message) => message.id));
    setPendingMessages((current) =>
      current.filter((message) => !storedIds.has(message.id)),
    );
  }, [chat?.messages]);

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
      const optimisticMessage: LocalChat['messages'][number] = {
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: text.trim(),
        sender: 'me',
        createdAt: new Date().toISOString(),
        status: chat.isSaved ? 'read' : 'sent',
        replyTo: replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              sender: replyTo.sender,
            }
          : undefined,
      };
      setPendingMessages((current) => [...current, optimisticMessage]);
      onSendMessage(
        chat.id,
        text,
        replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              sender: replyTo.sender,
            }
          : undefined,
        optimisticMessage.id,
      );
      setReplyTo(null);
    }
    setText('');
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const startLongPress = (message: LocalChat['messages'][number]) => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowAllReactions(false);
      setSelectedMessage(message);
      pressTimerRef.current = null;
    }, 480);
  };

  const finishMessagePress = (message: LocalChat['messages'][number]) => {
    cancelLongPress();

    if (longPressTriggeredRef.current || pointerMovedRef.current) {
      longPressTriggeredRef.current = false;
      pointerMovedRef.current = false;
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;
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

    await navigator.clipboard?.writeText(selectedMessage.text);
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
    setText(selectedMessage.text);
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
            <span className="chat-avatar" style={{ background: chat.color }}>
              {chat.initials}
            </span>
            <span className="conversation-header__title">
              <strong>{chat.name}</strong>
              <small>{chat.isSaved ? 'Личные заметки' : 'был(а) недавно'}</small>
            </span>
            <button type="button" aria-label="Меню чата" onClick={() => setShowMenu(true)}>
              <IonIcon icon={ellipsisHorizontalOutline} />
            </button>
          </header>

          <section
            className="conversation-messages"
            aria-label={`Переписка с ${chat.name}`}
            ref={messagesRef}
          >
            <span className="conversation-date">Сегодня</span>
            {visibleMessages.map((message) => (
              <div
                className={`message-bubble ${message.sender === 'me' ? 'is-mine' : 'is-other'}`}
                key={message.id}
                onPointerDown={() => startLongPress(message)}
                onPointerUp={() => finishMessagePress(message)}
                onPointerCancel={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerMove={() => {
                  pointerMovedRef.current = true;
                  cancelLongPress();
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  cancelLongPress();
                  setSelectedMessage(message);
                }}
              >
                {message.replyTo && (
                  <span className="message-reply-quote">
                    <strong>{message.replyTo.sender === 'me' ? 'Вы' : chat.name}</strong>
                    <span>{message.replyTo.text}</span>
                  </span>
                )}
                <span>{message.text}</span>
                <small className="message-meta">
                  <span>{messageTime(message.createdAt)}</span>
                  {message.sender === 'me' && (
                    <IonIcon
                      className={`message-status is-${message.status ?? 'read'}`}
                      icon={message.status === 'sent' ? checkmarkOutline : checkmarkDoneOutline}
                      aria-label={message.status === 'sent' ? 'Отправлено' : 'Прочитано'}
                    />
                  )}
                </small>
                {message.reaction && (
                  <button
                    type="button"
                    className="message-reaction"
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onReactToMessage(chat.id, message.id, message.reaction as string);
                    }}
                    aria-label={`Убрать реакцию ${message.reaction}`}
                  >
                    {message.reaction}
                  </button>
                )}
              </div>
            ))}
          </section>

          <form className="message-composer" onSubmit={submitMessage}>
            {(replyTo || editingMessage) && (
              <div className="message-composer__context">
                <span>
                  <strong>{editingMessage ? 'Редактирование' : 'Ответ'}</strong>
                  <small>{(editingMessage ?? replyTo)?.text}</small>
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
              placeholder={chat.isSaved ? 'Новая заметка' : 'Сообщение'}
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
                  <span>{chat.name}</span>
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
              {!chat.isSaved && (
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
              <p>{selectedMessage.text}</p>
              <button type="button" onClick={beginReply}>
                <IonIcon icon={returnUpBackOutline} />
                Ответить
              </button>
              <button type="button" onClick={copySelectedMessage}>
                <IonIcon icon={copyOutline} />
                Копировать
              </button>
              {!chat.isSaved && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveMessage(selectedMessage.text);
                    setSelectedMessage(null);
                  }}
                >
                  <IonIcon icon={bookmarkOutline} />
                  Сохранить в Избранное
                </button>
              )}
              {selectedMessage.sender === 'me' && (
                <>
                  <button type="button" onClick={beginEdit}>
                    <IonIcon icon={createOutline} />
                    Изменить
                  </button>
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
                </>
              )}
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
