'use client';

import { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuoteForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', service: '', details: '' });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!form.name || !form.service) return;
    const msg = encodeURIComponent(
      `Hola FOL DIGITAL! Quiero una cotización 📋\n\nNombre: ${form.name}\nContacto: ${form.contact}\nServicio: ${form.service}\nDetalles: ${form.details}`
    );
    window.open(`https://wa.me/50585853867?text=${msg}`, '_blank');
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setForm({ name: '', contact: '', service: '', details: '' }); }, 2000);
  };

  return (
    <>
      {/* Botón flotante más discreto */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[400] bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-900 transition-all group"
        title="Cotización Rápida"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden md:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2 font-black text-[10px] uppercase tracking-widest">
          Cotización
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Sin compromiso</p>
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900">Cotización Rápida</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-slate-900"><X /></button>
              </div>

              {sent ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="font-black text-slate-900 text-xl">¡Consulta enviada!</p>
                  <p className="text-slate-500 text-sm mt-1">Te responderemos pronto por WhatsApp.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <input required placeholder="Tu nombre *" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-bold text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input placeholder="WhatsApp o correo" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-bold text-sm" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                  <select required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-bold text-sm bg-white" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}>
                    <option value="">¿Qué necesitas? *</option>
                    <option>Investigación / Académico</option>
                    <option>Diapositivas / Presentación</option>
                    <option>Tablas / Cuadros</option>
                    <option>Diseño / Logo</option>
                    <option>Asesoría / Tutoría</option>
                    <option>Otro servicio</option>
                  </select>
                  <textarea rows={3} placeholder="Cuéntanos brevemente qué necesitas..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-600 text-slate-900 font-bold text-sm resize-none" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
                  <button onClick={handleSend} disabled={!form.name || !form.service} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-40">
                    <Send className="w-4 h-4" /> Enviar por WhatsApp
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
