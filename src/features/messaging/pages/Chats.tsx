import { useMemo, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  checkmarkDoneOutline,
  closeOutline,
  createOutline,
  searchOutline,
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
  onCreateChat: (name: string, color: string) => Chat;
}

const NEW_CHAT_CANDIDATES = [
  { name: 'Алексей', color: '#6f8264', common: 'Музыка · Путешествия' },
  { name: 'Мария', color: '#9a7654', common: 'Кино · Искусство' },
  { name: 'Даниил', color: '#697b88', common: 'Технологии · Игры' },
] as const;

function latestMessageText(message: ForayMessage | undefined): string {
  return message ? getMessageText(message) : 'Диалог пока пуст';
}

export default function Chats({ user, chats, messages, onCreateChat }: ChatsProps) {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

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
      return chats;
    }

    return chats.filter((chat) =>
      `${chat.title} ${latestMessageText(latestMessages.get(chat.id))}`
        .toLocaleLowerCase('ru-RU')
        .includes(normalizedQuery),
    );
  }, [chats, latestMessages, query]);

  const hasRegularChats = chats.some((chat) => chat.type !== 'saved');

  const handleCreateChat = (name: string, color: string) => {
    const existingChat = chats.find((chat) => chat.title === name);
    const chat = existingChat ?? onCreateChat(name, color);
    setShowNewChat(false);
    history.push(`/chats/${chat.id}`);
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
                    className="chat-row"
                    type="button"
                    key={chat.id}
                    onClick={() => history.push(`/chats/${chat.id}`)}
                  >
                    <span className="chat-avatar" style={{ background: chat.avatar.color }}>
                      {chat.avatar.initials}
                    </span>
                    <span className="chat-row__body">
                      <span className="chat-row__top">
                        <strong>{chat.title}</strong>
                        <span className="chat-row__time">
                          {lastMessage ? formatChatDate(lastMessage.sentAt) : ''}
                        </span>
                      </span>
                      <span className="chat-row__bottom">
                        <span className="chat-row__message">
                          {lastMessage?.isOutgoing && <IonIcon icon={checkmarkDoneOutline} />}
                          {latestMessageText(lastMessage)}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="chat-unread">{chat.unreadCount}</span>
                        )}
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
          <div className="messenger-overlay" role="presentation" onClick={() => setShowNewChat(false)}>
            <section
              className="messenger-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Новый чат"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <span>Новый чат</span>
                  <small>Люди с похожими интересами</small>
                </div>
                <button type="button" onClick={() => setShowNewChat(false)} aria-label="Закрыть">
                  <IonIcon icon={closeOutline} />
                </button>
              </header>
              <div className="new-chat-list">
                {NEW_CHAT_CANDIDATES.map((candidate) => (
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
                      <small>{candidate.common}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
