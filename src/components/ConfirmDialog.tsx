
export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message = '¿Seguro que deseas realizar esta acción?',
  onCancel,
  onConfirm,
  confirmLabel = 'Eliminar',
  confirmClass = 'btn btn-danger'
}:{
  open: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmClass?: string;
}){
  if (!open) return null;
  return (
    <div className='modal-backdrop'>
      <div className='modal'>
        <h3 className='hdr'>{title}</h3>
        <p className='sub'>{message}</p>
        <div className='flex flex-end'>
          <button className='btn' onClick={onCancel}>Cancelar</button>
          <button className={confirmClass} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
