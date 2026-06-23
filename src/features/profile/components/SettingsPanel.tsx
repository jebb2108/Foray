import { IonIcon } from '@ionic/react';
import { arrowBackOutline } from '../../../shared/icons';
import { ProfileSettings } from '../model/settings';
import './SettingsPanel.scss';

interface SettingsPanelProps {
  panel: 'notifications' | 'privacy';
  settings: ProfileSettings;
  onClose: () => void;
  onToggle: (key: keyof ProfileSettings) => void;
}

export default function SettingsPanel({
  panel,
  settings,
  onClose,
  onToggle,
}: SettingsPanelProps) {
  return (
    <div className="messenger-overlay">
      <section className="settings-panel">
        <header>
          <button type="button" onClick={onClose} aria-label="Назад">
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
              onChange={() => onToggle('messageNotifications')}
            />
            <SettingSwitch
              label="Новый собеседник"
              description="Сообщать, когда найдена пара"
              checked={settings.matchNotifications}
              onChange={() => onToggle('matchNotifications')}
            />
          </>
        ) : (
          <>
            <SettingSwitch
              label="Показывать город"
              description="Другие пользователи увидят ваш город"
              checked={settings.showCity}
              onChange={() => onToggle('showCity')}
            />
            <SettingSwitch
              label="Статус в сети"
              description="Показывать время последней активности"
              checked={settings.showOnlineStatus}
              onChange={() => onToggle('showOnlineStatus')}
            />
          </>
        )}
      </section>
    </div>
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
