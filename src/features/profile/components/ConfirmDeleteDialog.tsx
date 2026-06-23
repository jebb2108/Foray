interface ConfirmDeleteDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteDialog({
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <div className="messenger-overlay messenger-overlay--center">
      <section className="confirm-dialog" role="alertdialog" aria-modal="true">
        <h3>Удалить профиль?</h3>
        <p>Локальные данные регистрации будут удалены с этого устройства.</p>
        <div>
          <button type="button" onClick={onCancel}>Отмена</button>
          <button type="button" className="is-danger" onClick={onConfirm}>Удалить</button>
        </div>
      </section>
    </div>
  );
}
