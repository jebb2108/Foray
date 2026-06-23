import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  chatPin,
  checkmarkDoneOutline,
  closeOutline,
  createOutline,
  megaphoneOutline,
  notificationsOffOutline,
  notificationsOutline,
  peopleOutline,
  searchOutline,
  trashOutline,
} from '../../../shared/icons';
import { useHistory } from 'react-router-dom';
import { formatChatDate } from '../../../shared/lib/date';
import { UserProfile } from '../../profile/model/userProfile';
import { Chat } from '../model/chat';
import { ForayMessage, getMessageText } from '../model/message';
import '../../../styles/messenger.scss';

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

const NEW_CHAT_CANDIDATES = [
  { id: 'person:alexey', name: 'Алексей', color: '#6f8264', interests: ['Музыка', 'Путешествия'] },
  { id: 'person:maria', name: 'Мария', color: '#9a7654', interests: ['Кино', 'Искусство'] },
  { id: 'person:daniil', name: 'Даниил', color: '#697b88', interests: ['Технологии', 'Игры'] },
] as const;

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
  const [newChatQuery, setNewChatQuery] = useState('');
  const [creationType, setCreationType] = useState<'group' | 'channel' | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatActionView, setChatActionView] = useState<'actions' | 'mute'>('actions');
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
  const visibleCandidates = useMemo(() => {
    const normalizedQuery = newChatQuery.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) {
      return NEW_CHAT_CANDIDATES;
    }

    return NEW_CHAT_CANDIDATES.filter((candidate) =>
      `${candidate.name} ${candidate.interests.join(' ')}`
        .toLocaleLowerCase('ru-RU')
        .includes(normalizedQuery));
  }, [newChatQuery]);
  const visibleParticipants = useMemo(() => {
    const normalizedQuery = participantQuery.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) {
      return NEW_CHAT_CANDIDATES;
    }

    return NEW_CHAT_CANDIDATES.filter((candidate) =>
      `${candidate.name} ${candidate.interests.join(' ')}`
        .toLocaleLowerCase('ru-RU')
        .includes(normalizedQuery));
  }, [participantQuery]);

  const closeNewChat = () => {
    setShowNewChat(false);
    setNewChatQuery('');
    setCreationType(null);
    setNewChatTitle('');
    setParticipantQuery('');
    setSelectedParticipantIds([]);
  };

  const handleCreateChat = (name: string, color: string) => {
    const existingChat = chats.find(
      (chat) => chat.type === 'direct' && chat.title === name,
    );
    const chat = existingChat ?? onCreateChat(name, color);
    closeNewChat();
    history.push(`/chats/${chat.id}`);
  };

  const handleCreateCommunity = () => {
    const title = newChatTitle.trim();
    if (!creationType || !title) {
      return;
    }

    const chat = onCreateChat(
      title,
      creationType === 'group' ? '#6f8264' : '#697b88',
      creationType,
      selectedParticipantIds,
    );
    closeNewChat();
    history.push(`/chats/${chat.id}`);
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipantIds((current) =>
      current.includes(participantId)
        ? current.filter((id) => id !== participantId)
        : [...current, participantId]);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelLongPress(), []);

  const startChatPress = (
    chat: Chat,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    cancelLongPress();
    longPressTriggeredRef.current = false;
    pointerMovedRef.current = false;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };

    pressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setChatActionView('actions');
      setSelectedChat(chat);
      pressTimerRef.current = null;
    }, 480);
  };

  const trackChatPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }

    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) {
      pointerMovedRef.current = true;
      cancelLongPress();
    }
  };

  const finishChatPress = () => {
    cancelLongPress();
    pointerStartRef.current = null;
  };

  const openChat = (chatId: string) => {
    if (longPressTriggeredRef.current || pointerMovedRef.current) {
      longPressTriggeredRef.current = false;
      pointerMovedRef.current = false;
      return;
    }
    history.push(`/chats/${chatId}`);
  };

  const closeChatActions = () => {
    setSelectedChat(null);
    setChatActionView('actions');
    longPressTriggeredRef.current = false;
  };

  const selectMuteDuration = (durationMs?: number) => {
    if (!selectedChat) {
      return;
    }
    onMuteChat(selectedChat.id, durationMs);
    closeChatActions();
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
                      setChatActionView('actions');
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
          <div className="messenger-overlay" role="presentation" onClick={closeNewChat}>
            <section
              className="messenger-sheet new-chat-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Новый чат"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>
                    {creationType === 'group'
                      ? 'Создать группу'
                      : creationType === 'channel'
                        ? 'Создать канал'
                        : 'Новый чат'}
                  </span>
                  {!creationType && <small>Поиск по имени или интересам</small>}
                </div>
                <button type="button" onClick={closeNewChat} aria-label="Закрыть">
                  <IonIcon icon={closeOutline} />
                </button>
              </header>

              {creationType ? (
                <form
                  className="new-community-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleCreateCommunity();
                  }}
                >
                  <label>
                    <span>
                      {creationType === 'group' ? 'Название группы' : 'Название канала'}
                    </span>
                    <input
                      value={newChatTitle}
                      onChange={(event) => setNewChatTitle(event.target.value)}
                      placeholder={creationType === 'group' ? 'Новая группа' : 'Новый канал'}
                      maxLength={60}
                      enterKeyHint="done"
                    />
                  </label>
                  <section className="new-community-participants">
                    <header>
                      <strong>
                        {creationType === 'group'
                          ? 'Добавить людей'
                          : 'Пригласить участников'}
                      </strong>
                      <span>{selectedParticipantIds.length} выбрано</span>
                    </header>
                    <label className="messenger-search new-community-search">
                      <IonIcon icon={searchOutline} />
                      <input
                        type="search"
                        value={participantQuery}
                        onChange={(event) => setParticipantQuery(event.target.value)}
                        placeholder="Поиск по имени или интересам"
                        aria-label="Поиск участников"
                      />
                      {participantQuery && (
                        <button
                          type="button"
                          onClick={() => setParticipantQuery('')}
                          aria-label="Очистить поиск участников"
                        >
                          <IonIcon icon={closeOutline} />
                        </button>
                      )}
                    </label>
                    <div className="new-community-participant-list">
                      {visibleParticipants.map((candidate) => {
                        const selected = selectedParticipantIds.includes(candidate.id);
                        return (
                          <button
                            type="button"
                            key={candidate.id}
                            className={selected ? 'is-selected' : ''}
                            aria-pressed={selected}
                            onClick={() => toggleParticipant(candidate.id)}
                          >
                            <span
                              className="chat-avatar"
                              style={{ background: candidate.color }}
                            >
                              {candidate.name[0]}
                            </span>
                            <span>
                              <strong>{candidate.name}</strong>
                              <small>{candidate.interests.join(' · ')}</small>
                            </span>
                            <span className="participant-selection" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <div>
                    <button type="button" onClick={() => {
                      setCreationType(null);
                      setNewChatTitle('');
                      setParticipantQuery('');
                      setSelectedParticipantIds([]);
                    }}>
                      Назад
                    </button>
                    <button type="submit" disabled={!newChatTitle.trim()}>
                      Создать
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <label className="messenger-search new-chat-search">
                    <IonIcon icon={searchOutline} />
                    <input
                      type="search"
                      value={newChatQuery}
                      onChange={(event) => setNewChatQuery(event.target.value)}
                      placeholder="Поиск"
                      aria-label="Поиск людей по имени или интересам"
                    />
                    {newChatQuery && (
                      <button
                        type="button"
                        onClick={() => setNewChatQuery('')}
                        aria-label="Очистить поиск"
                      >
                        <IonIcon icon={closeOutline} />
                      </button>
                    )}
                  </label>

                  <div className="new-chat-actions">
                    <button type="button" onClick={() => setCreationType('group')}>
                      <span><IonIcon icon={peopleOutline} /></span>
                      <strong>Создать группу</strong>
                    </button>
                    <button type="button" onClick={() => setCreationType('channel')}>
                      <span><IonIcon icon={megaphoneOutline} /></span>
                      <strong>Создать канал</strong>
                    </button>
                  </div>

                  <span className="new-chat-section-title">Люди</span>
                  <div className="new-chat-list">
                    {visibleCandidates.map((candidate) => (
                      <button
                        type="button"
                        key={candidate.name}
                        onClick={() => handleCreateChat(candidate.name, candidate.color)}
                      >
                        <span className="chat-avatar" style={{ background: candidate.color }}>
                          {candidate.name[0]}
                        </span>
                        <span>
                          <strong>{candidate.name}</strong>
                          <small>{candidate.interests.join(' · ')}</small>
                        </span>
                      </button>
                    ))}
                    {visibleCandidates.length === 0 && (
                      <p className="new-chat-empty">Никого не найдено</p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {selectedChat && (
          <div className="messenger-overlay" role="presentation" onClick={closeChatActions}>
            <section
              className="messenger-sheet chat-actions"
              role="dialog"
              aria-modal="true"
              aria-label={`Действия с чатом ${selectedChat.title}`}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                {chatActionView === 'mute' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setChatActionView('actions')}
                      aria-label="Назад"
                    >
                      <IonIcon icon={arrowBackOutline} />
                    </button>
                    <div>
                      <span>Отключить звук</span>
                      <small>{selectedChat.title}</small>
                    </div>
                    <span className="chat-actions__header-spacer" />
                  </>
                ) : (
                  <>
                    <div>
                      <span>{selectedChat.title}</span>
                      <small>Действия с чатом</small>
                    </div>
                    <button type="button" onClick={closeChatActions} aria-label="Закрыть">
                      <IonIcon icon={closeOutline} />
                    </button>
                  </>
                )}
              </header>
              {chatActionView === 'mute' ? (
                <>
                  <button type="button" onClick={() => selectMuteDuration(60 * 60_000)}>
                    На 1 час
                  </button>
                  <button type="button" onClick={() => selectMuteDuration(8 * 60 * 60_000)}>
                    На 8 часов
                  </button>
                  <button type="button" onClick={() => selectMuteDuration(2 * 24 * 60 * 60_000)}>
                    На 2 дня
                  </button>
                  <button type="button" onClick={() => selectMuteDuration()}>
                    Навсегда
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleChatPinned(selectedChat.id);
                      closeChatActions();
                    }}
                  >
                    <IonIcon icon={chatPin} />
                    {selectedChat.isPinned ? 'Открепить' : 'Закрепить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChat.isMuted) {
                        onUnmuteChat(selectedChat.id);
                        closeChatActions();
                      } else {
                        setChatActionView('mute');
                      }
                    }}
                  >
                    <IonIcon
                      icon={selectedChat.isMuted
                        ? notificationsOutline
                        : notificationsOffOutline}
                    />
                    {selectedChat.isMuted ? 'Включить уведомления' : 'Отключить звук'}
                  </button>
                  {selectedChat.type !== 'saved' && (
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => {
                        onDeleteChat(selectedChat.id);
                        closeChatActions();
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                      Удалить чат
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
