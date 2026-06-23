import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, searchOutline } from '../../../shared/icons';
import emptyRoom from '../assets/empty-room.jpeg';
import foundRoom from '../assets/found-room.svg';
import waitingRoom from '../assets/waiting-room.jpeg';

const SEARCH_MESSAGES = [
  'Ищем людей с общими интересами',
  'Собираем темы для хорошего разговора',
  'Проверяем, кто сейчас свободен',
  'Подбираем подходящего собеседника',
] as const;

interface SearchViewProps {
  userName: string;
  isSearching: boolean;
  isMatchFound: boolean;
  onStartSearch: () => void;
  onCancelSearch: () => void;
  onOpenCandidate: () => void;
}

export default function SearchView({
  userName,
  isSearching,
  isMatchFound,
  onStartSearch,
  onCancelSearch,
  onOpenCandidate,
}: SearchViewProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setMessageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % SEARCH_MESSAGES.length);
    }, 2_800);

    return () => window.clearInterval(interval);
  }, [isSearching]);

  return (
    <>
      <button
        className={[
          'waiting-illustration',
          isSearching ? ' is-searching' : '',
          isMatchFound ? ' is-found' : '',
        ].filter(Boolean).join(' ')}
        type="button"
        onClick={isMatchFound
          ? onOpenCandidate
          : isSearching
            ? onCancelSearch
            : onStartSearch}
        aria-label={isMatchFound
          ? 'Открыть найденного собеседника'
          : isSearching
            ? 'Остановить поиск'
            : 'Начать поиск собеседника'}
      >
        <img
          src={isMatchFound ? foundRoom : isSearching ? waitingRoom : emptyRoom}
          alt=""
          aria-hidden="true"
        />
      </button>

      <div className="waiting-copy">
        <h2>
          {isMatchFound
            ? 'Собеседник найден'
            : isSearching
              ? 'Ищем собеседника'
              : `${userName}, комната готова`}
        </h2>
        <p>
          {isMatchFound
            ? 'Откройте профиль и подтвердите готовность войти во временную комнату.'
            : isSearching
              ? SEARCH_MESSAGES[messageIndex]
              : 'Войдите в очередь, чтобы найти человека с похожими интересами.'}
        </p>
      </div>

      {!isMatchFound && (
        <button
          className={`waiting-action${isSearching ? ' is-cancel' : ''}`}
          type="button"
          onClick={isSearching ? onCancelSearch : onStartSearch}
        >
          <IonIcon icon={isSearching ? closeOutline : searchOutline} />
          {isSearching ? 'Выйти из очереди' : 'Найти собеседника'}
        </button>
      )}
      {isMatchFound && (
        <button
          className="waiting-action"
          type="button"
          onClick={onOpenCandidate}
        >
          Войти в комнату
        </button>
      )}
    </>
  );
}
