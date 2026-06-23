import { useEffect, useState } from 'react';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  chevronForwardOutline,
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
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import ProfileEditor from '../components/ProfileEditor';
import SettingsPanel from '../components/SettingsPanel';
import '../../../styles/messenger.scss';
import './Profile.scss';

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
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/gu, '')
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

  useEffect(() => {
    saveProfileSettings(settings);
  }, [settings]);

  const toggleSetting = (key: keyof ProfileSettings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleEditorSave = (changes: UserProfileChanges) => {
    onUpdateProfile(changes);
    setIsEditing(false);
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
            <button type="button" className="profile-edit-button" onClick={() => setIsEditing(true)}>Изм.</button>
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
          <ProfileEditor
            user={user}
            onClose={() => setIsEditing(false)}
            onSave={handleEditorSave}
          />
        )}

        {panel && (
          <SettingsPanel
            panel={panel}
            settings={settings}
            onClose={() => setPanel(null)}
            onToggle={toggleSetting}
          />
        )}

        {confirmDelete && (
          <ConfirmDeleteDialog
            onCancel={() => setConfirmDelete(false)}
            onConfirm={onResetProfile}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
