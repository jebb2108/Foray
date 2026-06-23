import { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  closeOutline,
  megaphoneOutline,
  peopleOutline,
  searchOutline,
} from '../../../shared/icons';
import { Chat } from '../model/chat';
import './NewChatSheet.scss';

const NEW_CHAT_CANDIDATES = [
  { id: 'person:alexey', name: 'Алексей', color: '#6f8264', interests: ['Музыка', 'Путешествия'] },
  { id: 'person:maria', name: 'Мария', color: '#9a7654', interests: ['Кино', 'Искусство'] },
  { id: 'person:daniil', name: 'Даниил', color: '#697b88', interests: ['Технологии', 'Игры'] },
] as const;

interface NewChatSheetProps {
  chats: Chat[];
  onClose: () => void;
  onCreateChat: (
    name: string,
    color: string,
    type?: Exclude<Chat['type'], 'saved'>,
    participantIds?: string[],
  ) => Chat;
  onNavigate: (chatId: string) => void;
}

export default function NewChatSheet({
  chats,
  onClose,
  onCreateChat,
  onNavigate,
}: NewChatSheetProps) {
  const [newChatQuery, setNewChatQuery] = useState('');
  const [creationType, setCreationType] = useState<'group' | 'channel' | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [participantQuery, setParticipantQuery] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  const visibleCandidates = useMemo(() => {
    const q = newChatQuery.trim().toLocaleLowerCase('ru-RU');
    if (!q) return NEW_CHAT_CANDIDATES;
    return NEW_CHAT_CANDIDATES.filter((c) =>
      `${c.name} ${c.interests.join(' ')}`.toLocaleLowerCase('ru-RU').includes(q));
  }, [newChatQuery]);

  const visibleParticipants = useMemo(() => {
    const q = participantQuery.trim().toLocaleLowerCase('ru-RU');
    if (!q) return NEW_CHAT_CANDIDATES;
    return NEW_CHAT_CANDIDATES.filter((c) =>
      `${c.name} ${c.interests.join(' ')}`.toLocaleLowerCase('ru-RU').includes(q));
  }, [participantQuery]);

  const resetCreation = () => {
    setCreationType(null);
    setNewChatTitle('');
    setParticipantQuery('');
    setSelectedParticipantIds([]);
  };

  const handleCreateDirect = (name: string, color: string) => {
    const existing = chats.find((chat) => chat.type === 'direct' && chat.title === name);
    const chat = existing ?? onCreateChat(name, color);
    onClose();
    onNavigate(chat.id);
  };

  const handleCreateCommunity = () => {
    const title = newChatTitle.trim();
    if (!creationType || !title) return;
    const chat = onCreateChat(
      title,
      creationType === 'group' ? '#6f8264' : '#697b88',
      creationType,
      selectedParticipantIds,
    );
    onClose();
    onNavigate(chat.id);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="messenger-overlay" role="presentation" onClick={onClose}>
      <section
        className="messenger-sheet new-chat-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Новый чат"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>
              {creationType === 'group'
                ? 'Создать группу'
                : creationType === 'channel'
                  ? 'Создать канал'
                  : 'Новый чат'}
            </span>
            {!creationType && <small>Поиск по имени или интересам</small>}
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <IonIcon icon={closeOutline} />
          </button>
        </header>

        {creationType ? (
          <form
            className="new-community-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateCommunity();
            }}
          >
            <label>
              <span>{creationType === 'group' ? 'Название группы' : 'Название канала'}</span>
              <input
                value={newChatTitle}
                onChange={(event) => setNewChatTitle(event.target.value)}
                placeholder={creationType === 'group' ? 'Новая группа' : 'Новый канал'}
                maxLength={60}
                enterKeyHint="done"
              />
            </label>
            <section className="new-community-participants">
              <header>
                <strong>
                  {creationType === 'group' ? 'Добавить людей' : 'Пригласить участников'}
                </strong>
                <span>{selectedParticipantIds.length} выбрано</span>
              </header>
              <label className="messenger-search new-community-search">
                <IonIcon icon={searchOutline} />
                <input
                  type="search"
                  value={participantQuery}
                  onChange={(event) => setParticipantQuery(event.target.value)}
                  placeholder="Поиск по имени или интересам"
                  aria-label="Поиск участников"
                />
                {participantQuery && (
                  <button
                    type="button"
                    onClick={() => setParticipantQuery('')}
                    aria-label="Очистить поиск участников"
                  >
                    <IonIcon icon={closeOutline} />
                  </button>
                )}
              </label>
              <div className="new-community-participant-list">
                {visibleParticipants.map((candidate) => {
                  const selected = selectedParticipantIds.includes(candidate.id);
                  return (
                    <button
                      type="button"
                      key={candidate.id}
                      className={selected ? 'is-selected' : ''}
                      aria-pressed={selected}
                      onClick={() => toggleParticipant(candidate.id)}
                    >
                      <span className="chat-avatar" style={{ background: candidate.color }}>
                        {candidate.name[0]}
                      </span>
                      <span>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.interests.join(' · ')}</small>
                      </span>
                      <span className="participant-selection" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </section>
            <div>
              <button type="button" onClick={resetCreation}>Назад</button>
              <button type="submit" disabled={!newChatTitle.trim()}>Создать</button>
            </div>
          </form>
        ) : (
          <>
            <label className="messenger-search new-chat-search">
              <IonIcon icon={searchOutline} />
              <input
                type="search"
                value={newChatQuery}
                onChange={(event) => setNewChatQuery(event.target.value)}
                placeholder="Поиск"
                aria-label="Поиск людей по имени или интересам"
              />
              {newChatQuery && (
                <button
                  type="button"
                  onClick={() => setNewChatQuery('')}
                  aria-label="Очистить поиск"
                >
                  <IonIcon icon={closeOutline} />
                </button>
              )}
            </label>

            <div className="new-chat-actions">
              <button type="button" onClick={() => setCreationType('group')}>
                <span><IonIcon icon={peopleOutline} /></span>
                <strong>Создать группу</strong>
              </button>
              <button type="button" onClick={() => setCreationType('channel')}>
                <span><IonIcon icon={megaphoneOutline} /></span>
                <strong>Создать канал</strong>
              </button>
            </div>

            <span className="new-chat-section-title">Люди</span>
            <div className="new-chat-list">
              {visibleCandidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.name}
                  onClick={() => handleCreateDirect(candidate.name, candidate.color)}
                >
                  <span className="chat-avatar" style={{ background: candidate.color }}>
                    {candidate.name[0]}
                  </span>
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.interests.join(' · ')}</small>
                  </span>
                </button>
              ))}
              {visibleCandidates.length === 0 && (
                <p className="new-chat-empty">Никого не найдено</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
