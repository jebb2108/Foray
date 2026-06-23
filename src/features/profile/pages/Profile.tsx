import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  arrowBackOutline,
  chevronForwardOutline,
  closeOutline,
  locationOutline,
  logOutOutline,
  notificationsOutline,
  personOutline,
  shieldCheckmarkOutline,
} from '../../../shared/icons';
import { INTEREST_GROUPS, INTEREST_TOPIC_BY_ID } from '../data/interests';
import { ProfileSettings } from '../model/settings';
import { UserProfile, UserProfileChanges } from '../model/userProfile';
import {
  loadProfileSettings,
  saveProfileSettings,
} from '../repository/settingsRepository';
import '../../../styles/messenger.scss';

interface ProfileProps {
  user: UserProfile;
  onResetProfile: () => void;
  onUpdateProfile: (changes: UserProfileChanges) => void;
}

type ProfilePanel = 'notifications' | 'privacy' | null;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function topicName(topicId: string): string {
  const topicParts = topicId.split(':');
  const rawName = INTEREST_TOPIC_BY_ID.get(topicId)?.name
    ?? topicParts[topicParts.length - 1]
    ?? topicId;
  return rawName
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+/gu, '')
    .trim();
}

export default function Profile({
  user,
  onResetProfile,
  onUpdateProfile,
}: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [panel, setPanel] = useState<ProfilePanel>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [interestCategoryIndex, setInterestCategoryIndex] = useState(0);
  const [settings, setSettings] = useState<ProfileSettings>(() => loadProfileSettings());
  const interestSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState({
    name: user.name,
    username: user.username,
    city: user.city,
    bio: user.bio,
    interestIds: user.interestIds,
  });

  useEffect(() => {
    saveProfileSettings(settings);
  }, [settings]);

  const openEditor = () => {
    setDraft({
      name: user.name,
      username: user.username,
      city: user.city,
      bio: user.bio,
      interestIds: user.interestIds,
    });
    setProfileError('');
    const selectedGroupIndex = INTEREST_GROUPS.findIndex((group) =>
      group.subgroups.some((subgroup) =>
        subgroup.topics.some((topic) => user.interestIds.includes(topic.id))));
    setInterestCategoryIndex(Math.max(0, selectedGroupIndex));
    setIsEditing(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.username.trim()) {
      setProfileError('Заполните имя и никнейм.');
      return;
    }

    if (draft.interestIds.length < 3 || draft.interestIds.length > 6) {
      setProfileError('Выберите от 3 до 6 интересов.');
      return;
    }

    onUpdateProfile({
      name: draft.name.trim(),
      username: draft.username.trim().replace(/^@/, ''),
      city: draft.city.trim(),
      bio: draft.bio.trim(),
      interestIds: draft.interestIds,
    });
    setProfileError('');
    setIsEditing(false);
  };

  const toggleProfileInterest = (interestId: string) => {
    setDraft((current) => {
      const selected = current.interestIds.includes(interestId);
      if (!selected && current.interestIds.length >= 6) {
        return current;
      }

      return {
        ...current,
        interestIds: selected
          ? current.interestIds.filter((id) => id !== interestId)
          : [...current.interestIds, interestId],
      };
    });
    setProfileError('');
  };

  const startInterestSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    interestSwipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const finishInterestSwipe = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = interestSwipeStart.current;
    interestSwipeStart.current = null;
    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    setInterestCategoryIndex((current) =>
      deltaX < 0
        ? Math.min(INTEREST_GROUPS.length - 1, current + 1)
        : Math.max(0, current - 1));
  };

  const toggleSetting = (key: keyof ProfileSettings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className="messenger-screen profile-screen">
          <header className="messenger-header">
            <div>
              <span className="messenger-header__eyebrow">Аккаунт</span>
              <h1>Профиль</h1>
            </div>
            <button type="button" className="profile-edit-button" onClick={openEditor}>Изм.</button>
          </header>

          <section className="profile-hero">
            <div className="profile-avatar">{initials(user.name)}</div>
            <h2>{user.name}</h2>
            <p>@{user.username}</p>
          </section>

          <section className="profile-section">
            <div className="profile-info-row">
              <span className="profile-info-row__icon"><IonIcon icon={locationOutline} /></span>
              <span>
                <small>Город</small>
                <strong>{user.city || 'Не указан'}</strong>
              </span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-row__icon"><IonIcon icon={personOutline} /></span>
              <span>
                <small>О себе</small>
                <strong>{user.bio || 'Расскажите немного о себе'}</strong>
              </span>
            </div>
          </section>

          <section className="profile-section profile-interests">
            <h3>Интересы</h3>
            <div>
              {user.interestIds.map((interest) => (
                <span key={interest}>{topicName(interest)}</span>
              ))}
            </div>
          </section>

          <section className="profile-section profile-menu">
            <button type="button" onClick={() => setPanel('notifications')}>
              <span className="profile-menu__icon"><IonIcon icon={notificationsOutline} /></span>
              <span>Уведомления</span>
              <IonIcon icon={chevronForwardOutline} />
            </button>
            <button type="button" onClick={() => setPanel('privacy')}>
              <span className="profile-menu__icon"><IonIcon icon={shieldCheckmarkOutline} /></span>
              <span>Конфиденциальность</span>
              <IonIcon icon={chevronForwardOutline} />
            </button>
          </section>

          <button type="button" className="profile-logout" onClick={() => setConfirmDelete(true)}>
            <IonIcon icon={logOutOutline} />
            Удалить локальный профиль
          </button>
        </main>

        {isEditing && (
          <div className="messenger-overlay">
            <form className="profile-editor" onSubmit={saveProfile}>
              <header>
                <button type="button" onClick={() => setIsEditing(false)} aria-label="Отменить">
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
                  onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
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
        )}

        {panel && (
          <div className="messenger-overlay">
            <section className="settings-panel">
              <header>
                <button type="button" onClick={() => setPanel(null)} aria-label="Назад">
                  <IonIcon icon={arrowBackOutline} />
                </button>
                <strong>{panel === 'notifications' ? 'Уведомления' : 'Конфиденциальность'}</strong>
                <span />
              </header>
              {panel === 'notifications' ? (
                <>
                  <SettingSwitch
                    label="Новые сообщения"
                    description="Показывать уведомления о сообщениях"
                    checked={settings.messageNotifications}
                    onChange={() => toggleSetting('messageNotifications')}
                  />
                  <SettingSwitch
                    label="Новый собеседник"
                    description="Сообщать, когда найдена пара"
                    checked={settings.matchNotifications}
                    onChange={() => toggleSetting('matchNotifications')}
                  />
                </>
              ) : (
                <>
                  <SettingSwitch
                    label="Показывать город"
                    description="Другие пользователи увидят ваш город"
                    checked={settings.showCity}
                    onChange={() => toggleSetting('showCity')}
                  />
                  <SettingSwitch
                    label="Статус в сети"
                    description="Показывать время последней активности"
                    checked={settings.showOnlineStatus}
                    onChange={() => toggleSetting('showOnlineStatus')}
                  />
                </>
              )}
            </section>
          </div>
        )}

        {confirmDelete && (
          <div className="messenger-overlay messenger-overlay--center">
            <section className="confirm-dialog" role="alertdialog" aria-modal="true">
              <h3>Удалить профиль?</h3>
              <p>Локальные данные регистрации будут удалены с этого устройства.</p>
              <div>
                <button type="button" onClick={() => setConfirmDelete(false)}>Отмена</button>
                <button type="button" className="is-danger" onClick={onResetProfile}>Удалить</button>
              </div>
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

interface SettingSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SettingSwitch({ label, description, checked, onChange }: SettingSwitchProps) {
  return (
    <button type="button" className="setting-switch-row" onClick={onChange}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={`setting-switch${checked ? ' is-on' : ''}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
