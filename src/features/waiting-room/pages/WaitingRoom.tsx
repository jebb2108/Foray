import { useEffect, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  closeOutline,
  searchOutline,
} from '../../../shared/icons';
import emptyRoom from '../assets/empty-room.jpeg';
import waitingRoom from '../assets/waiting-room.jpeg';
import { UserProfile } from '../../profile/model/userProfile';
import '../../../styles/messenger.scss';

const SEARCH_MESSAGES = [
  'Ищем людей с общими интересами',
  'Собираем темы для хорошего разговора',
  'Проверяем, кто сейчас свободен',
  'Подбираем подходящего собеседника',
] as const;

interface WaitingRoomProps {
  user: UserProfile;
}

export default function WaitingRoom({ user }: WaitingRoomProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setMessageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % SEARCH_MESSAGES.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isSearching]);

  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className="messenger-screen waiting-screen">
          <header className="messenger-header">
            <div>
              <span className="messenger-header__eyebrow">Комната</span>
              <h1>Ожидание</h1>
            </div>
          </header>

          <section className="waiting-content">
            <button
              className={`waiting-illustration${isSearching ? ' is-searching' : ''}`}
              type="button"
              onClick={() => setIsSearching((current) => !current)}
              aria-label={isSearching ? 'Остановить поиск' : 'Начать поиск собеседника'}
            >
              <img
                src={isSearching ? waitingRoom : emptyRoom}
                alt=""
                aria-hidden="true"
              />
            </button>

            <div className="waiting-copy">
              <h2>{isSearching ? 'Ищем собеседника' : `${user.name}, комната готова`}</h2>
              <p>
                {isSearching
                  ? SEARCH_MESSAGES[messageIndex]
                  : 'Нажмите кнопку ниже, чтобы войти в очередь и найти человека с похожими интересами.'}
              </p>
            </div>

            <button
              className={`waiting-action${isSearching ? ' is-cancel' : ''}`}
              type="button"
              onClick={() => setIsSearching((current) => !current)}
            >
              <IonIcon icon={isSearching ? closeOutline : searchOutline} />
              {isSearching ? 'Выйти из очереди' : 'Найти собеседника'}
            </button>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
