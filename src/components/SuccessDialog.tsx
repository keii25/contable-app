
export default function SuccessDialog({ open, onClose, message }:{ open:boolean; onClose:()=>void; message:string }){
  if(!open) return null;
  return (
    <div className='modal-backdrop'>
      <div className='modal'>
        <h3 className='hdr'>Éxito</h3>
        <p className='sub'>{message}</p>
        <div className='flex flex-end'>
          <button className='btn btn-success' onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
