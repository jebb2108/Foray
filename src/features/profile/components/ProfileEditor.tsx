import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from '../../../shared/icons';
import { INTEREST_GROUPS, INTEREST_TOPIC_BY_ID } from '../data/interests';
import { UserProfile, UserProfileChanges } from '../model/userProfile';
import './ProfileEditor.scss';

function topicName(topicId: string): string {
  const topicParts = topicId.split(':');
  const rawName =
    INTEREST_TOPIC_BY_ID.get(topicId)?.name ?? topicParts[topicParts.length - 1] ?? topicId;
  return rawName
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/gu, '')
    .trim();
}

interface ProfileEditorProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (changes: UserProfileChanges) => void;
}

export default function ProfileEditor({ user, onClose, onSave }: ProfileEditorProps) {
  const [draft, setDraft] = useState({
    name: user.name,
    username: user.username,
    city: user.city,
    bio: user.bio,
    interestIds: user.interestIds,
  });
  const [profileError, setProfileError] = useState('');
  const [interestCategoryIndex, setInterestCategoryIndex] = useState(() => {
    const idx = INTEREST_GROUPS.findIndex((group) =>
      group.subgroups.some((subgroup) =>
        subgroup.topics.some((topic) => user.interestIds.includes(topic.id))));
    return Math.max(0, idx);
  });
  const interestSwipeStart = useRef<{ x: number; y: number } | null>(null);

  const startInterestSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    interestSwipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const finishInterestSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = interestSwipeStart.current;
    interestSwipeStart.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    // свайп считается только если горизонтальное смещение больше 45px и преобладает над вертикальным
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    setInterestCategoryIndex((current) =>
      deltaX < 0
        ? Math.min(INTEREST_GROUPS.length - 1, current + 1)
        : Math.max(0, current - 1));
  };

  const toggleProfileInterest = (interestId: string) => {
    setDraft((current) => {
      const selected = current.interestIds.includes(interestId);
      if (!selected && current.interestIds.length >= 6) return current;
      return {
        ...current,
        interestIds: selected
          ? current.interestIds.filter((id) => id !== interestId)
          : [...current.interestIds, interestId],
      };
    });
    setProfileError('');
  };

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.username.trim()) {
      setProfileError('Заполните имя и никнейм.');
      return;
    }
    if (draft.interestIds.length < 3 || draft.interestIds.length > 6) {
      setProfileError('Выберите от 3 до 6 интересов.');
      return;
    }
    onSave({
      name: draft.name.trim(),
      username: draft.username.trim().replace(/^@/, ''),
      city: draft.city.trim(),
      bio: draft.bio.trim(),
      interestIds: draft.interestIds,
    });
  };

  return (
    <div className="messenger-overlay">
      <form className="profile-editor" onSubmit={handleSave}>
        <header>
          <button type="button" onClick={onClose} aria-label="Отменить">
            <IonIcon icon={closeOutline} />
          </button>
          <strong>Редактирование</strong>
          <button type="submit">Готово</button>
        </header>
        <label>
          <span>Имя</span>
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            maxLength={40}
          />
        </label>
        <label>
          <span>Никнейм</span>
          <input
            value={draft.username}
            onChange={(event) =>
              setDraft((current) => ({ ...current, username: event.target.value }))}
            maxLength={24}
            autoCapitalize="none"
          />
        </label>
        <label>
          <span>Город</span>
          <input
            value={draft.city}
            onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
            maxLength={60}
          />
        </label>
        <details className="profile-interest-editor">
          <summary>
            <span>
              <strong>Интересы</strong>
              <small>Выберите от 3 до 6</small>
            </span>
            <span>{draft.interestIds.length} из 6</span>
          </summary>
          <div className="profile-interest-editor__content">
            <div
              className="profile-interest-pagination"
              aria-label={`Категория ${interestCategoryIndex + 1} из ${INTEREST_GROUPS.length}`}
            >
              {INTEREST_GROUPS.map((group, index) => (
                <button
                  type="button"
                  key={group.id}
                  className={index === interestCategoryIndex ? 'is-active' : ''}
                  onClick={() => setInterestCategoryIndex(index)}
                  aria-label={`Открыть категорию ${topicName(group.name)}`}
                  aria-current={index === interestCategoryIndex ? 'step' : undefined}
                />
              ))}
            </div>
            <div
              className="profile-interest-category-page"
              onPointerDown={startInterestSwipe}
              onPointerUp={finishInterestSwipe}
              onPointerCancel={() => {
                interestSwipeStart.current = null;
              }}
            >
              {(() => {
                const group = INTEREST_GROUPS[interestCategoryIndex];
                return (
                  <section className="profile-interest-category" key={group.id}>
                    <h3>{topicName(group.name)}</h3>
                    {group.subgroups.map((subgroup) => (
                      <div className="profile-interest-subgroup" key={subgroup.id}>
                        <span>{topicName(subgroup.name)}</span>
                        <div>
                          {subgroup.topics.map((interest) => {
                            const selected = draft.interestIds.includes(interest.id);
                            const disabled = !selected && draft.interestIds.length >= 6;
                            return (
                              <button
                                type="button"
                                key={interest.id}
                                className={selected ? 'is-selected' : ''}
                                disabled={disabled}
                                aria-pressed={selected}
                                onClick={() => toggleProfileInterest(interest.id)}
                              >
                                {topicName(interest.id)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </section>
                );
              })()}
            </div>
          </div>
        </details>
        <label>
          <span>О себе</span>
          <textarea
            value={draft.bio}
            onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
            maxLength={180}
            rows={5}
          />
        </label>
        {profileError && (
          <p className="profile-editor__error" role="alert">{profileError}</p>
        )}
      </form>
    </div>
  );
}
