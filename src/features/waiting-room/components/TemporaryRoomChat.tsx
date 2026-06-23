import { FormEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import './TemporaryRoomChat.scss';
import { IonIcon } from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeOutline,
  ellipsisHorizontalOutline,
  paperPlane,
} from '../../../shared/icons';
import {
  ForayMessage,
  getMessageText,
  getSelectedReaction,
  toggleMessageReaction,
} from '../../messaging/model/message';
import { MatchCandidate, MatchRoomToken, MatchingStatus } from '../model/matching';
import { formatRoomCountdown } from '../model/temporaryRoom';

interface TemporaryRoomChatProps {
  candidate: MatchCandidate;
  roomToken: MatchRoomToken | null;
  status: MatchingStatus;
  roomSeconds: number;
  messages: ForayMessage[];
  text: string;
  replyTo: ForayMessage | null;
  editingMessage: ForayMessage | null;
  messagesRef: RefObject<HTMLDivElement>;
  selfUserId: string;
  onBack: () => void;
  onOpenMenu: () => void;
  onSubmit: (event: FormEvent) => void;
  onTextChange: (value: string) => void;
  onCancelContext: () => void;
  onStartMessagePress: (
    message: ForayMessage,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onFinishMessagePress: (message: ForayMessage) => void;
  onTrackMessagePress: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCancelLongPress: () => void;
  onSelectMessage: (message: ForayMessage) => void;
  onMessagesChange: (updater: (current: ForayMessage[]) => ForayMessage[]) => void;
}

export default function TemporaryRoomChat({
  candidate,
  roomToken,
  status,
  roomSeconds,
  messages,
  text,
  replyTo,
  editingMessage,
  messagesRef,
  selfUserId,
  onBack,
  onOpenMenu,
  onSubmit,
  onTextChange,
  onCancelContext,
  onStartMessagePress,
  onFinishMessagePress,
  onTrackMessagePress,
  onCancelLongPress,
  onSelectMessage,
  onMessagesChange,
}: TemporaryRoomChatProps) {
  const shouldShowRoomTimer = status === 'room' && roomSeconds <= 5 * 60;

  return (
    <section className="waiting-room-chat">
      <header className="waiting-room-chat__header">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
        >
          <IonIcon icon={arrowBackOutline} />
        </button>
        <span
          className="chat-avatar"
          style={{ background: candidate.color }}
        >
          {candidate.name[0]}
        </span>
        <span>
          <strong>{candidate.name}</strong>
          {roomToken?.partnerOnline === false && <small>Оффлайн</small>}
        </span>
        <time className={shouldShowRoomTimer ? 'is-visible' : ''}>
          {shouldShowRoomTimer ? formatRoomCountdown(roomSeconds) : ''}
        </time>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Меню комнаты"
        >
          <IonIcon icon={ellipsisHorizontalOutline} />
        </button>
      </header>

      <div className="waiting-room-chat__messages" ref={messagesRef}>
        {status === 'room-ended' && (
          <div className="temporary-room__rules">
            <strong>Комната больше недоступна</strong>
            <span>
              Собеседник покинул комнату или сессия была деактивирована.
              Вернуться к этой переписке уже нельзя.
            </span>
          </div>
        )}
        {status !== 'room-ended' && messages.length === 0 && (
          <div className="temporary-room__rules">
            <strong>Комната для знакомства</strong>
            <span>
              Будьте вежливы, не публикуйте личные данные и уважайте границы
              собеседника. У вас есть 15 минут, чтобы понять, хотите ли вы
              продолжить общение.
            </span>
          </div>
        )}
        {messages.map((message) => {
          const messageText = getMessageText(message);
          const selectedReaction = getSelectedReaction(message);
          return (
            <div
              className={[
                'message-bubble',
                'temporary-message',
                message.isOutgoing ? 'is-mine' : 'is-other',
                selectedReaction ? 'has-reaction' : '',
              ].filter(Boolean).join(' ')}
              key={message.id}
              onPointerDown={(event) => onStartMessagePress(message, event)}
              onPointerUp={() => onFinishMessagePress(message)}
              onPointerCancel={onCancelLongPress}
              onPointerLeave={onCancelLongPress}
              onPointerMove={onTrackMessagePress}
              onContextMenu={(event) => {
                event.preventDefault();
                onCancelLongPress();
                onSelectMessage(message);
              }}
            >
              {message.replyTo && (
                <span className="message-reply-quote">
                  <strong>
                    {message.replyTo.senderId === selfUserId
                      || message.replyTo.senderId === 'self'
                      ? 'Вы'
                      : candidate.name}
                  </strong>
                  <span>{message.replyTo.previewText}</span>
                </span>
              )}
              <span className="message-text">{messageText}</span>
              <small className="message-meta">
                <span>
                  {new Date(message.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.isOutgoing && (
                  <IonIcon
                    className={`message-status is-${message.delivery.state}`}
                    icon={message.delivery.state === 'read'
                      ? checkmarkDoneOutline
                      : checkmarkOutline}
                    aria-label={message.delivery.state === 'read'
                      ? 'Прочитано'
                      : 'Отправлено'}
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
                    onMessagesChange((current) =>
                      current.map((item) =>
                        item.id === message.id
                          ? toggleMessageReaction(item, selectedReaction)
                          : item));
                  }}
                  aria-label={`Убрать реакцию ${selectedReaction}`}
                >
                  {selectedReaction}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form className="waiting-room-chat__composer message-composer" onSubmit={onSubmit}>
        {(replyTo || editingMessage) && (
          <div className="message-composer__context">
            <span>
              <strong>{editingMessage ? 'Редактирование' : 'Ответ'}</strong>
              <small>{getMessageText(editingMessage ?? replyTo!)}</small>
            </span>
            <button
              type="button"
              onClick={onCancelContext}
              aria-label="Отменить"
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>
        )}
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={status === 'room' ? 'Сообщение' : 'Комната завершена'}
          disabled={status !== 'room'}
          aria-label="Сообщение во временной комнате"
        />
        <button
          type="submit"
          disabled={status !== 'room' || !text.trim()}
          aria-label="Отправить сообщение"
        >
          <IonIcon icon={paperPlane} />
        </button>
      </form>
    </section>
  );
}
