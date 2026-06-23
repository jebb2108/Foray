import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  flagOutline,
  logOutOutline,
  shareSocialOutline,
  trashOutline,
} from '../../../shared/icons';
import { copyText } from '../../../shared/lib/clipboard';
import { Chat } from '../model/chat';

interface ConversationMenuProps {
  chat: Chat;
  onClose: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onLeave: () => void;
}

export default function ConversationMenu({
  chat,
  onClose,
  onClearChat,
  onDeleteChat,
  onLeave,
}: ConversationMenuProps) {
  const isCommunity = chat.type === 'group' || chat.type === 'channel';

  const shareCommunity = async () => {
    const communityType = chat.type === 'channel' ? 'канал' : 'группу';
    const textToShare = `Присоединяйтесь в ${communityType} «${chat.title}» в Foray`;
    try {
      if (navigator.share) {
        await navigator.share({ title: chat.title, text: textToShare, url: window.location.href });
      } else {
        await copyText(`${textToShare}\n${window.location.href}`);
      }
      onClose();
    } catch {
      // Закрытие системного меню отправки не меняет состояние чата
    }
  };

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
            <span>{chat.title}</span>
            <small>
              {chat.type === 'group'
                ? 'Управление группой'
                : chat.type === 'channel'
                  ? 'Управление каналом'
                  : 'Управление диалогом'}
            </small>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <IonIcon icon={closeOutline} />
          </button>
        </header>
        {isCommunity && (
          <button type="button" onClick={shareCommunity}>
            <IonIcon icon={shareSocialOutline} />
            Поделиться
          </button>
        )}
        {isCommunity ? (
          <button type="button" onClick={onClose}>
            <IonIcon icon={flagOutline} />
            Пожаловаться
          </button>
        ) : (
          <button type="button" onClick={() => { onClearChat(); onClose(); }}>
            Очистить историю
          </button>
        )}
        {isCommunity ? (
          <button type="button" className="is-danger" onClick={onLeave}>
            <IonIcon icon={logOutOutline} />
            {chat.type === 'channel' ? 'Покинуть канал' : 'Покинуть группу'}
          </button>
        ) : (
          chat.type !== 'saved' && (
            <button type="button" className="is-danger" onClick={() => { onDeleteChat(); onClose(); }}>
              <IonIcon icon={trashOutline} />
              Удалить чат
            </button>
          )
        )}
      </section>
    </div>
  );
}
