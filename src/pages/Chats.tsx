import { useMemo, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  checkmarkDoneOutline,
  closeOutline,
  createOutline,
  searchOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { LocalChat } from '../data/localChats';
import { LocalUserProfile } from '../data/localUser';
import './Messenger.scss';

interface ChatsProps {
  user: LocalUserProfile;
  chats: LocalChat[];
  onCreateChat: (name: string, color: string) => LocalChat;
}

const NEW_CHAT_CANDIDATES = [
  { name: 'Алексей', color: '#6f8264', common: 'Музыка · Путешествия' },
  { name: 'Мария', color: '#9a7654', common: 'Кино · Искусство' },
  { name: 'Даниил', color: '#697b88', common: 'Технологии · Игры' },
] as const;

function latestMessage(chat: LocalChat): string {
  return chat.messages[chat.messages.length - 1]?.text ?? 'Диалог пока пуст';
}

function formatChatTime(chat: LocalChat): string {
  const createdAt = chat.messages[chat.messages.length - 1]?.createdAt;
  if (!createdAt) {
    return '';
  }

  const date = new Date(createdAt);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function Chats({ user, chats, onCreateChat }: ChatsProps) {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const visibleChats = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) {
      return chats;
    }

    return chats.filter((chat) =>
      `${chat.name} ${latestMessage(chat)}`
        .toLocaleLowerCase('ru-RU')
        .includes(normalizedQuery),
    );
  }, [chats, query]);

  const hasRegularChats = chats.some((chat) => !chat.isSaved);

  const handleCreateChat = (name: string, color: string) => {
    const existingChat = chats.find((chat) => chat.name === name);
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
                const lastMessage = chat.messages[chat.messages.length - 1];
                return (
                  <button
                    className="chat-row"
                    type="button"
                    key={chat.id}
                    onClick={() => history.push(`/chats/${chat.id}`)}
                  >
                    <span className="chat-avatar" style={{ background: chat.color }}>
                      {chat.initials}
                    </span>
                    <span className="chat-row__body">
                      <span className="chat-row__top">
                        <strong>{chat.name}</strong>
                        <span className="chat-row__time">{formatChatTime(chat)}</span>
                      </span>
                      <span className="chat-row__bottom">
                        <span className="chat-row__message">
                          {lastMessage?.sender === 'me' && <IonIcon icon={checkmarkDoneOutline} />}
                          {latestMessage(chat)}
                        </span>
                        {chat.unread > 0 && <span className="chat-unread">{chat.unread}</span>}
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
