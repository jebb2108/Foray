import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  chevronForwardOutline,
  locationOutline,
  logOutOutline,
  notificationsOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { INTEREST_TOPIC_BY_ID } from '../data/interests';
import { LocalUserProfile } from '../data/localUser';
import './Messenger.scss';

interface ProfileProps {
  user: LocalUserProfile;
  onResetProfile: () => void;
}

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

export default function Profile({ user, onResetProfile }: ProfileProps) {
  return (
    <IonPage className="messenger-page">
      <IonContent fullscreen>
        <main className="messenger-screen profile-screen">
          <header className="messenger-header">
            <div>
              <span className="messenger-header__eyebrow">Аккаунт</span>
              <h1>Профиль</h1>
            </div>
            <button type="button" className="profile-edit-button">Изм.</button>
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
              {user.interests.map((interest) => (
                <span key={interest}>{topicName(interest)}</span>
              ))}
            </div>
          </section>

          <section className="profile-section profile-menu">
            <button type="button">
              <span className="profile-menu__icon"><IonIcon icon={notificationsOutline} /></span>
              <span>Уведомления</span>
              <IonIcon icon={chevronForwardOutline} />
            </button>
            <button type="button">
              <span className="profile-menu__icon"><IonIcon icon={shieldCheckmarkOutline} /></span>
              <span>Конфиденциальность</span>
              <IonIcon icon={chevronForwardOutline} />
            </button>
          </section>

          <button type="button" className="profile-logout" onClick={onResetProfile}>
            <IonIcon icon={logOutOutline} />
            Удалить локальный профиль
          </button>
        </main>
      </IonContent>
    </IonPage>
  );
}
