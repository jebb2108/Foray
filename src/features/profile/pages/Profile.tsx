import { FormEvent, useEffect, useState } from 'react';
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
import { INTEREST_TOPIC_BY_ID } from '../data/interests';
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
  const [settings, setSettings] = useState<ProfileSettings>(() => loadProfileSettings());
  const [draft, setDraft] = useState({
    name: user.name,
    username: user.username,
    city: user.city,
    bio: user.bio,
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
    });
    setIsEditing(true);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.username.trim()) {
      return;
    }

    onUpdateProfile({
      name: draft.name.trim(),
      username: draft.username.trim().replace(/^@/, ''),
      city: draft.city.trim(),
      bio: draft.bio.trim(),
    });
    setIsEditing(false);
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
              <label>
                <span>О себе</span>
                <textarea
                  value={draft.bio}
                  onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                  maxLength={180}
                  rows={5}
                />
              </label>
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
