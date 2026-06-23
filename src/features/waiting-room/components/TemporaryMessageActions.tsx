import { IonIcon } from '@ionic/react';
import {
  bookmarkOutline,
  chevronDownOutline,
  chevronUpOutline,
  copyOutline,
  createOutline,
  returnUpBackOutline,
  trashOutline,
} from '../../../shared/icons';
import { ForayMessage, getMessageText } from '../../messaging/model/message';

interface TemporaryMessageActionsProps {
  message: ForayMessage;
  showAllReactions: boolean;
  canEdit: boolean;
  onClose: () => void;
  onToggleAllReactions: () => void;
  onChooseReaction: (reaction: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemporaryMessageActions({
  message,
  showAllReactions,
  canEdit,
  onClose,
  onToggleAllReactions,
  onChooseReaction,
  onReply,
  onCopy,
  onSave,
  onEdit,
  onDelete,
}: TemporaryMessageActionsProps) {
  return (
    <div
      className="messenger-overlay"
      role="presentation"
      onClick={onClose}
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
              onClick={() => onChooseReaction(reaction)}
              aria-label={`Реакция ${reaction}`}
            >
              {reaction}
            </button>
          ))}
          <button
            type="button"
            className="reaction-picker__more"
            onClick={onToggleAllReactions}
            aria-label={showAllReactions ? 'Свернуть реакции' : 'Больше реакций'}
          >
            <IonIcon icon={showAllReactions ? chevronUpOutline : chevronDownOutline} />
          </button>
        </div>
        <p>{getMessageText(message)}</p>
        <button type="button" onClick={onReply}>
          <IonIcon icon={returnUpBackOutline} />
          Ответить
        </button>
        <button type="button" onClick={onCopy}>
          <IonIcon icon={copyOutline} />
          Копировать
        </button>
        <button type="button" onClick={onSave}>
          <IonIcon icon={bookmarkOutline} />
          Сохранить в Избранное
        </button>
        {message.permissions.canBeEdited && canEdit && (
          <button type="button" onClick={onEdit}>
            <IonIcon icon={createOutline} />
            Изменить
          </button>
        )}
        {message.permissions.canBeDeleted && (
          <button
            type="button"
            className="is-danger"
            onClick={onDelete}
          >
            <IonIcon icon={trashOutline} />
            Удалить
          </button>
        )}
      </section>
    </div>
  );
}
