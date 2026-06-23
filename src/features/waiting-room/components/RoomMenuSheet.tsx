import { IonIcon } from '@ionic/react';
import { closeOutline, flagOutline, logOutOutline, trashOutline } from '../../../shared/icons';

interface RoomMenuSheetProps {
  candidateName: string | undefined;
  onClose: () => void;
  onDeleteTranscript: () => void;
  onLeaveRoom: () => void;
}

export default function RoomMenuSheet({ candidateName, onClose, onDeleteTranscript, onLeaveRoom }: RoomMenuSheetProps) {
  return (
    <div className="messenger-overlay" role="presentation" onClick={onClose}>
      <section
        className="messenger-sheet conversation-menu"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>{candidateName ?? 'Комната'}</span>
            <small>Действия комнаты</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <IonIcon icon={closeOutline} />
          </button>
        </header>
        <button type="button" onClick={onClose}>
          <IonIcon icon={flagOutline} />
          Пожаловаться
        </button>
        <button type="button" onClick={onDeleteTranscript}>
          <IonIcon icon={trashOutline} />
          Удалить переписку
        </button>
        <button type="button" className="is-danger" onClick={onLeaveRoom}>
          <IonIcon icon={logOutOutline} />
          Выйти из комнаты
        </button>
      </section>
    </div>
  );
}
