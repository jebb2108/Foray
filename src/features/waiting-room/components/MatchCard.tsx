import { IonIcon } from '@ionic/react';
import './MatchCard.scss';
import { checkmarkOutline, logOutOutline } from '../../../shared/icons';
import { INTEREST_TOPIC_BY_ID } from '../../profile/data/interests';
import { MatchCandidate } from '../model/matching';
import { formatRoomCountdown } from '../model/temporaryRoom';

function interestName(interestId: string): string {
  const topic = INTEREST_TOPIC_BY_ID.get(interestId);
  const rawName = topic?.name ?? interestId.split(':').pop() ?? interestId;
  return rawName
    .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/gu, '')
    .trim();
}

interface MatchCardProps {
  candidate: MatchCandidate;
  status: 'candidate' | 'waiting' | 'ready';
  decisionSeconds: number;
  readySeconds: number;
  commonInterestIds: string[];
  onDecline: () => void;
  onAccept: () => void;
  onCancelAcceptance: () => void;
}

export default function MatchCard({
  candidate,
  status,
  decisionSeconds,
  readySeconds,
  commonInterestIds,
  onDecline,
  onAccept,
  onCancelAcceptance,
}: MatchCardProps) {
  return (
    <article className={`match-card is-${status}`}>
      <div
        className="match-card__avatar"
        style={{ background: candidate.color }}
        aria-hidden="true"
      >
        {candidate.name[0]}
      </div>
      <div className="match-card__identity">
        <h2>{candidate.name}, {candidate.age}</h2>
        <span>{candidate.city}</span>
      </div>
      <div className="match-card__interests">
        {commonInterestIds.map((interestId) => (
          <span key={interestId}>{interestName(interestId)}</span>
        ))}
      </div>
      <p>{candidate.bio}</p>

      {status === 'candidate' && (
        <div className="match-card__decision">
          <button
            type="button"
            className="is-decline"
            onClick={onDecline}
            aria-label="Выйти и отказаться от собеседника"
          >
            <IonIcon icon={logOutOutline} />
            <small>Выйти</small>
          </button>
          <span>
            <strong>Готовы войти в комнату?</strong>
            <small>{formatRoomCountdown(decisionSeconds)}</small>
          </span>
          <button
            type="button"
            onClick={onAccept}
            aria-label="Подтвердить готовность войти в комнату"
          >
            <IonIcon icon={checkmarkOutline} />
            <small>Готов</small>
          </button>
        </div>
      )}

      {status === 'waiting' && (
        <div className="match-card__pending">
          <strong>Ждём подтверждения</strong>
          <span>Собеседник тоже должен согласиться войти в комнату.</span>
          <button type="button" onClick={onCancelAcceptance}>
            Отменить готовность
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="match-card__ready">
          <strong>Вы оба готовы</strong>
          <span>Комната откроется через {formatRoomCountdown(readySeconds)}</span>
        </div>
      )}
    </article>
  );
}
