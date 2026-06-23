import { PointerEvent as ReactPointerEvent } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkDoneOutline, checkmarkOutline } from '../../../shared/icons';
import { formatTime } from '../../../shared/lib/date';
import { ForayMessage, getMessageText, getSelectedReaction } from '../model/message';

interface MessageBubbleProps {
  message: ForayMessage;
  peerId?: string;
  peerTitle: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onContextMenu: () => void;
  onReactToMessage: (reaction: string) => void;
}

export default function MessageBubble({
  message,
  peerId,
  peerTitle,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onPointerMove,
  onContextMenu,
  onReactToMessage,
}: MessageBubbleProps) {
  const messageText = getMessageText(message);
  const selectedReaction = getSelectedReaction(message);

  return (
    <div
      className={[
        'message-bubble',
        message.sender.type === 'system' ? 'is-system' : '',
        message.isOutgoing ? 'is-mine' : 'is-other',
        selectedReaction ? 'has-reaction' : '',
      ].filter(Boolean).join(' ')}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu();
      }}
    >
      {message.replyTo && (
        <span className="message-reply-quote">
          <strong>{message.replyTo.senderId === peerId ? peerTitle : 'Вы'}</strong>
          <span>{message.replyTo.previewText}</span>
        </span>
      )}
      <span>{messageText}</span>
      <small className="message-meta">
        <span>{formatTime(message.sentAt)}</span>
        {message.isOutgoing && (
          <IonIcon
            className={`message-status is-${message.delivery.state}`}
            icon={message.delivery.state === 'sent' ? checkmarkOutline : checkmarkDoneOutline}
            aria-label={message.delivery.state === 'read' ? 'Прочитано' : 'Отправлено'}
          />
        )}
      </small>
      {selectedReaction && (
        <button
          type="button"
          className="message-reaction"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onReactToMessage(selectedReaction);
          }}
          aria-label={`Убрать реакцию ${selectedReaction}`}
        >
          {selectedReaction}
        </button>
      )}
    </div>
  );
}
