import foundRoom from '../assets/found-room.svg';
import { formatRoomCountdown } from '../model/temporaryRoom';

interface RoomAvailableViewProps {
  candidateName: string;
  roomSeconds: number;
  onEnterRoom: () => void;
}

export default function RoomAvailableView({ candidateName, roomSeconds, onEnterRoom }: RoomAvailableViewProps) {
  return (
    <>
      <button
        className="waiting-illustration is-found"
        type="button"
        onClick={onEnterRoom}
        aria-label="Войти в комнату"
      >
        <img src={foundRoom} alt="" aria-hidden="true" />
      </button>

      <div className="waiting-copy">
        <h2>Комната открыта</h2>
        <p>
          Временная комната с {candidateName} доступна ещё
          {' '}
          {formatRoomCountdown(roomSeconds)}. Если время истечёт,
          вернуться уже не получится.
        </p>
      </div>

      <button
        className="waiting-action"
        type="button"
        onClick={onEnterRoom}
      >
        Войти в комнату
      </button>
    </>
  );
}
