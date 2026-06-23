import { IonIcon } from '@ionic/react';
import './ContinuationDialog.scss';
import { checkmarkOutline, logOutOutline } from '../../../shared/icons';

interface ContinuationDialogProps {
  candidateName: string;
  onDecline: () => void;
  onAccept: () => void;
}

export default function ContinuationDialog({ candidateName, onDecline, onAccept }: ContinuationDialogProps) {
  return (
    <div className="messenger-overlay messenger-overlay--center">
      <section className="match-consent-dialog" role="dialog" aria-modal="true">
        <h3>Продолжить общение?</h3>
        <p>
          Если вы оба подтвердили продолжение, переписка с {candidateName}
          появится в разделе «Чаты». После закрытия окна вернуться в эту комнату нельзя.
        </p>
        <div>
          <button
            type="button"
            className="is-danger"
            onClick={onDecline}
          >
            <IonIcon icon={logOutOutline} />
            Закрыть
          </button>
          <button type="button" onClick={onAccept}>
            <IonIcon icon={checkmarkOutline} />
            Продолжить
          </button>
        </div>
      </section>
    </div>
  );
}
