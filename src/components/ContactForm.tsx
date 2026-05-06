'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare } from 'lucide-react';

import { submitOrder } from '@/app/actions';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    service: '',
    details: '',
    metodo_pago: 'efectivo',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await submitOrder(formData);
    
    setIsSubmitting(false);
    if (result.success) {
      setLastOrderId(result.orderId);
      setShowSuccess(true);
      setFormData({ name: '', contact: '', service: '', details: '', metodo_pago: 'efectivo' });
    } else {
      alert('Hubo un error al enviar tu pedido. Por favor intenta por WhatsApp.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(lastOrderId);
    alert('¡Código copiado al portapapeles!');
  };

  const handleWhatsApp = () => {
    const message = `Hola FOL PS! Mi nombre es ${formData.name}. Me gustaría solicitar el servicio de: ${formData.service}. Detalles: ${formData.details}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/50585853867?text=${encodedMessage}`, '_blank');
  };

  return (
    <section id="contact" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-slate-900 p-12 text-white flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6">¿Listo para empezar?</h2>
            <p className="text-slate-400 mb-8">
              Rellena el formulario o contáctanos directamente por WhatsApp para una atención inmediata.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span>Atención 24/7</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="md:w-2/3 p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="Ej. Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp o Correo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                  placeholder="Ej. +505 8888 8888"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Servicio Requerido</label>
              <select
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              >
                <option value="">Selecciona un servicio</option>
                <option value="Investigación">Investigación / Académico</option>
                <option value="Diapositivas">Diapositivas / Presentación</option>
                <option value="Tablas">Tablas / Cuadros</option>
                <option value="Diseño">Diseño / Logo</option>
                <option value="Asesoría">Asesoría / Tutoría</option>
                <option value="Otro">Otro servicio</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Método de Pago</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.metodo_pago === 'efectivo' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                  <input type="radio" name="metodo_pago" value="efectivo" checked={formData.metodo_pago === 'efectivo'} onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })} className="accent-slate-900" />
                  <span className="font-bold text-slate-800">Efectivo</span>
                </label>
                <label className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.metodo_pago === 'deposito_lafise' ? 'border-slate-900 bg-slate-50' : 'border-slate-200'}`}>
                  <input type="radio" name="metodo_pago" value="deposito_lafise" checked={formData.metodo_pago === 'deposito_lafise'} onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })} className="accent-slate-900" />
                  <span className="font-bold text-slate-800">Depósito LAFISE</span>
                </label>
              </div>
              {formData.metodo_pago === 'deposito_lafise' && (
                <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 font-medium">
                  ⚠️ El precio será asignado por el vendedor una vez revisado tu pedido. Te avisaremos por WhatsApp o correo con el monto y los datos de depósito para que puedas realizar el pago.
                </div>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">Detalles del Pedido</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 bg-white"
                placeholder="Cuéntanos más sobre lo que necesitas..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Pedido
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex-1 border-2 border-green-600 text-green-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                WhatsApp Directo
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Éxito Profesional */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[3rem] p-10 text-center shadow-2xl border-4 border-slate-900"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
              <Send className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">¡Pedido Recibido!</h3>
            <p className="text-slate-500 mb-8 font-medium">
              Tu pedido ha sido registrado con éxito. Copia tu código de rastreo para ver el avance en tiempo real.
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-slate-200">
              <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest">Código de Rastreo Único</p>
              <p className="text-lg font-mono font-black text-slate-900 break-all select-all">
                {lastOrderId}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={copyToClipboard}
                className="bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
              >
                Copiar Código
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
