import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  arrowBackOutline,
  chatPin,
  closeOutline,
  notificationsOffOutline,
  notificationsOutline,
  trashOutline,
} from '../../../shared/icons';
import { Chat } from '../model/chat';
import './ChatActionsSheet.scss';

interface ChatActionsSheetProps {
  chat: Chat;
  onClose: () => void;
  onTogglePinned: () => void;
  onMute: (durationMs?: number) => void;
  onUnmute: () => void;
  onDelete: () => void;
}

export default function ChatActionsSheet({
  chat,
  onClose,
  onTogglePinned,
  onMute,
  onUnmute,
  onDelete,
}: ChatActionsSheetProps) {
  const [view, setView] = useState<'actions' | 'mute'>('actions');

  return (
    <div className="messenger-overlay" role="presentation" onClick={onClose}>
      <section
        className="messenger-sheet chat-actions"
        role="dialog"
        aria-modal="true"
        aria-label={`Действия с чатом ${chat.title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          {view === 'mute' ? (
            <>
              <button type="button" onClick={() => setView('actions')} aria-label="Назад">
                <IonIcon icon={arrowBackOutline} />
              </button>
              <div>
                <span>Отключить звук</span>
                <small>{chat.title}</small>
              </div>
              <span className="chat-actions__header-spacer" />
            </>
          ) : (
            <>
              <div>
                <span>{chat.title}</span>
                <small>Действия с чатом</small>
              </div>
              <button type="button" onClick={onClose} aria-label="Закрыть">
                <IonIcon icon={closeOutline} />
              </button>
            </>
          )}
        </header>

        {view === 'mute' ? (
          <>
            <button type="button" onClick={() => { onMute(60 * 60_000); onClose(); }}>
              На 1 час
            </button>
            <button type="button" onClick={() => { onMute(8 * 60 * 60_000); onClose(); }}>
              На 8 часов
            </button>
            <button type="button" onClick={() => { onMute(2 * 24 * 60 * 60_000); onClose(); }}>
              На 2 дня
            </button>
            <button type="button" onClick={() => { onMute(); onClose(); }}>
              Навсегда
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => { onTogglePinned(); onClose(); }}>
              <IonIcon icon={chatPin} />
              {chat.isPinned ? 'Открепить' : 'Закрепить'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (chat.isMuted) { onUnmute(); onClose(); }
                else { setView('mute'); }
              }}
            >
              <IonIcon icon={chat.isMuted ? notificationsOutline : notificationsOffOutline} />
              {chat.isMuted ? 'Включить уведомления' : 'Отключить звук'}
            </button>
            {chat.type !== 'saved' && (
              <button type="button" className="is-danger" onClick={() => { onDelete(); onClose(); }}>
                <IonIcon icon={trashOutline} />
                Удалить чат
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
