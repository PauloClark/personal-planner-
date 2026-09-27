'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export function Modal({title, children, onClose, busy = false}: {title: string; children: React.ReactNode; onClose: () => void; busy?: boolean}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; const previous = document.activeElement as HTMLElement | null; dialog.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => {e.preventDefault(); if (!busy) onClose();}} onClick={e => {if (e.target === e.currentTarget && !busy) onClose();}}>
    <div className="modal-inner"><header className="modal-heading"><div><span className="eyebrow">MY PLANNER</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20}/></button></header>{children}</div>
  </dialog>;
}
export function ConfirmationDialog({title, description, busy, onConfirm, onClose}: {title: string; description: string; busy: boolean; onConfirm: () => void; onClose: () => void}) { return <Modal title={title} onClose={onClose} busy={busy}><p className="muted">{description}</p><div className="modal-actions"><button className="button" disabled={busy} onClick={onClose}>Keep it</button><button className="button danger" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete permanently'}</button></div></Modal>; }
