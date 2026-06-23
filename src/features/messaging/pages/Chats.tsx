import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  createOutline,
  searchOutline,
  checkmarkDoneOutline,
  chatPin,
  closeOutline,
  notificationsOffOutline,
} from '../../../shared/icons';
import { useHistory } from 'react-router-dom';
import { formatChatDate } from '../../../shared/lib/date';
import { UserProfile } from '../../profile/model/userProfile';
import { Chat } from '../model/chat';
import { ForayMessage, getMessageText } from '../model/message';
import ChatActionsSheet from '../components/ChatActionsSheet';
import NewChatSheet from '../components/NewChatSheet';
import '../../../styles/messenger.scss';
import './Chats.scss';

interface ChatsProps {
  user: UserProfile;
  chats: Chat[];
  messages: ForayMessage[];
  onCreateChat: (
    name: string,
    color: string,
    type?: Exclude<Chat['type'], 'saved'>,
    participantIds?: string[],
  ) => Chat;
  onDeleteChat: (chatId: string) => void;
  onToggleChatPinned: (chatId: string) => void;
  onMuteChat: (chatId: string, durationMs?: number) => void;
  onUnmuteChat: (chatId: string) => void;
}

function latestMessageText(message: ForayMessage | undefined): string {
  return message ? getMessageText(message) : 'Диалог пока пуст';
}

export default function Chats({
  user,
  chats,
  messages,
  onCreateChat,
  onDeleteChat,
  onToggleChatPinned,
  onMuteChat,
  onUnmuteChat,
}: ChatsProps) {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Индекс исключает повторный поиск последнего сообщения при отрисовке
  const latestMessages = useMemo(() => {
    const byChatId = new Map<string, ForayMessage>();
    messages.forEach((message) => {
      const current = byChatId.get(message.chatId);
      if (!current || message.sentAt > current.sentAt) {
        byChatId.set(message.chatId, message);
      }
    });
    return byChatId;
  }, [messages]);

  const visibleChats = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) {
      return [...chats].sort((left, right) => Number(right.isPinned) - Number(left.isPinned));
    }
    return chats
      .filter((chat) =>
        `${chat.title} ${latestMessageText(latestMessages.get(chat.id))}`
          .toLocaleLowerCase('ru-RU')
          .includes(normalizedQuery))
      .sort((left, right) => Number(right.isPinned) - Number(left.isPinned));
  }, [chats, latestMessages, query]);

  const hasRegularChats = chats.some((chat) => chat.type !== 'saved');

  const cancelLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelLongPress(), []);

  const startChatPress = (chat: Chat, event: ReactPointerEvent<HTMLButtonElement>) => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSelectedChat(chat);
      pressTimerRef.current = null;
    }, 480);
  };

  const trackChatPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = pointerStartRef.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      pointerMovedRef.current = true;
      cancelLongPress();
    }
  };

  const finishChatPress = () => {
    cancelLongPress();
    pointerStartRef.current = null;
  };

  // onClick срабатывает после pointerUp поэтому проверяем реф чтобы не открывать чат после долгого нажатия
  const openChat = (chatId: string) => {
    if (longPressTriggeredRef.current || pointerMovedRef.current) {
      longPressTriggeredRef.current = false;
      pointerMovedRef.current = false;
      return;
    }
    history.push(`/chats/${chatId}`);
  };

  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className="messenger-screen">
          <header className="messenger-header">
            <div>
              <span className="messenger-header__eyebrow">Foray</span>
              <h1>Чаты</h1>
            </div>
            <button
              type="button"
              className="messenger-icon-button"
              aria-label="Создать чат"
              onClick={() => setShowNewChat(true)}
            >
              <IonIcon icon={createOutline} />
            </button>
          </header>

          <label className="messenger-search">
            <IonIcon icon={searchOutline} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск"
              aria-label="Поиск по чатам"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск">
                <IonIcon icon={closeOutline} />
              </button>
            )}
          </label>

          {visibleChats.length > 0 ? (
            <section className="chat-list" aria-label="Список чатов">
              {visibleChats.map((chat) => {
                const lastMessage = latestMessages.get(chat.id);
                return (
                  <button
                    className={`chat-row${chat.isPinned ? ' is-pinned' : ''}`}
                    type="button"
                    key={chat.id}
                    onPointerDown={(event) => startChatPress(chat, event)}
                    onPointerMove={trackChatPress}
                    onPointerUp={finishChatPress}
                    onPointerCancel={finishChatPress}
                    onClick={() => openChat(chat.id)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      cancelLongPress();
                      setSelectedChat(chat);
                    }}
                  >
                    <span className="chat-avatar" style={{ background: chat.avatar.color }}>
                      {chat.avatar.initials}
                    </span>
                    <span className="chat-row__body">
                      <span className="chat-row__top">
                        <span className="chat-row__name">
                          <strong>{chat.title}</strong>
                          {chat.isMuted && (
                            <IonIcon
                              icon={notificationsOffOutline}
                              aria-label="Уведомления отключены"
                            />
                          )}
                        </span>
                        <span className="chat-row__time">
                          {lastMessage
                            ? formatChatDate(
                              lastMessage.sentAt,
                              chat.type === 'direct'
                                && chat.unreadCount > 0
                                && !lastMessage.isOutgoing,
                            )
                            : ''}
                        </span>
                      </span>
                      <span className="chat-row__bottom">
                        <span className="chat-row__message">
                          {lastMessage?.isOutgoing && <IonIcon icon={checkmarkDoneOutline} />}
                          {latestMessageText(lastMessage)}
                        </span>
                        <span className="chat-row__status">
                          {chat.isPinned && (
                            <IonIcon
                              className="chat-row__pin"
                              icon={chatPin}
                              aria-label="Закреплено"
                            />
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="chat-unread">{chat.unreadCount}</span>
                          )}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </section>
          ) : (
            <div className="chat-empty">
              <IonIcon icon={searchOutline} />
              <strong>Ничего не найдено</strong>
              <span>Попробуйте изменить поисковый запрос.</span>
            </div>
          )}

          {!hasRegularChats && (
            <p className="chat-list__hint">
              Привет, {user.name}. Новые собеседники появятся здесь после совпадения.
            </p>
          )}
        </main>

        {showNewChat && (
          <NewChatSheet
            chats={chats}
            onClose={() => setShowNewChat(false)}
            onCreateChat={onCreateChat}
            onNavigate={(chatId) => history.push(`/chats/${chatId}`)}
          />
        )}

        {selectedChat && (
          <ChatActionsSheet
            chat={selectedChat}
            onClose={() => {
              setSelectedChat(null);
              longPressTriggeredRef.current = false;
            }}
            onTogglePinned={() => onToggleChatPinned(selectedChat.id)}
            onMute={(durationMs) => onMuteChat(selectedChat.id, durationMs)}
            onUnmute={() => onUnmuteChat(selectedChat.id)}
            onDelete={() => onDeleteChat(selectedChat.id)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
