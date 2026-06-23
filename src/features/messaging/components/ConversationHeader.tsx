import { IonIcon } from '@ionic/react';
import { arrowBackOutline, ellipsisHorizontalOutline } from '../../../shared/icons';
import { Chat } from '../model/chat';
import './ConversationHeader.scss';

function chatSubtitle(chat: Chat): string | null {
  if (chat.isBlocked) return 'заблокирован';
  if (chat.type === 'saved') return 'Личные заметки';
  if (chat.type === 'group') {
    return formatMemberCount(chat.participantIds.length + 1, 'участник', 'участника', 'участников');
  }
  if (chat.type === 'channel') {
    return formatMemberCount(
      chat.participantIds.length + 1,
      'подписчик',
      'подписчика',
      'подписчиков',
    );
  }
  return chat.isOnline ? 'в сети' : 'был(а) недавно';
}

function formatMemberCount(count: number, one: string, few: string, many: string): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? many
      : lastDigit === 1
        ? one
        : lastDigit >= 2 && lastDigit <= 4
          ? few
          : many;
  return `${count} ${suffix}`;
}

interface ConversationHeaderProps {
  chat: Chat;
  onBack: () => void;
  onOpenMenu: () => void;
}

export default function ConversationHeader({
  chat,
  onBack,
  onOpenMenu,
}: ConversationHeaderProps) {
  const subtitle = chatSubtitle(chat);
  return (
    <header className="conversation-header">
      <button type="button" onClick={onBack} aria-label="Назад к чатам">
        <IonIcon icon={arrowBackOutline} />
      </button>
      <span className="chat-avatar" style={{ background: chat.avatar.color }}>
        {chat.avatar.initials}
      </span>
      <span className="conversation-header__title">
        <strong>{chat.title}</strong>
        {subtitle && (
          <small
            className={
              chat.type === 'direct'
                ? chat.isOnline
                  ? 'online-status'
                  : 'offline-status'
                : ''
            }
          >
            {subtitle}
          </small>
        )}
      </span>
      <button type="button" aria-label="Меню чата" onClick={onOpenMenu}>
        <IonIcon icon={ellipsisHorizontalOutline} />
      </button>
    </header>
  );
}
