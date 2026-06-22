import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  checkmarkDoneOutline,
  createOutline,
  searchOutline,
} from 'ionicons/icons';
import { LocalUserProfile } from '../data/localUser';
import './Messenger.scss';

interface ChatsProps {
  user: LocalUserProfile;
}

interface ChatPreview {
  id: string;
  name: string;
  initials: string;
  color: string;
  message: string;
  time: string;
  unread?: number;
  read?: boolean;
}

const CHAT_PREVIEWS: ChatPreview[] = [
  {
    id: 'saved',
    name: 'Избранное',
    initials: '★',
    color: '#607a52',
    message: 'Сохраняйте здесь важные сообщения',
    time: 'сейчас',
    read: true,
  },
  {
    id: 'anna',
    name: 'Анна',
    initials: 'А',
    color: '#9a7654',
    message: 'Да, давай обсудим путешествия',
    time: '18:24',
    unread: 2,
  },
  {
    id: 'max',
    name: 'Максим',
    initials: 'М',
    color: '#697b88',
    message: 'Тоже люблю авторское кино',
    time: 'вчера',
    read: true,
  },
  {
    id: 'sofia',
    name: 'София',
    initials: 'С',
    color: '#8a6f7e',
    message: 'Отправила фотографию',
    time: 'пн',
    read: true,
  },
];

export default function Chats({ user }: ChatsProps) {
  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className="messenger-screen">
          <header className="messenger-header">
            <div>
              <span className="messenger-header__eyebrow">Foray</span>
              <h1>Чаты</h1>
            </div>
            <button type="button" className="messenger-icon-button" aria-label="Создать чат">
              <IonIcon icon={createOutline} />
            </button>
          </header>

          <label className="messenger-search">
            <IonIcon icon={searchOutline} />
            <input type="search" placeholder="Поиск" aria-label="Поиск по чатам" />
          </label>

          <section className="chat-list" aria-label="Список чатов">
            {CHAT_PREVIEWS.map((chat) => (
              <button className="chat-row" type="button" key={chat.id}>
                <span className="chat-avatar" style={{ background: chat.color }}>
                  {chat.initials}
                </span>
                <span className="chat-row__body">
                  <span className="chat-row__top">
                    <strong>{chat.name}</strong>
                    <span className="chat-row__time">{chat.time}</span>
                  </span>
                  <span className="chat-row__bottom">
                    <span className="chat-row__message">
                      {chat.read && <IonIcon icon={checkmarkDoneOutline} />}
                      {chat.message}
                    </span>
                    {chat.unread && <span className="chat-unread">{chat.unread}</span>}
                  </span>
                </span>
              </button>
            ))}
          </section>

          <p className="chat-list__hint">
            Привет, {user.name}. Новые собеседники появятся здесь после совпадения.
          </p>
        </main>
      </IonContent>
    </IonPage>
  );
}
