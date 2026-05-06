'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, CheckCircle2, Clock, Send, Package, RefreshCw, Download, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STEPS = [
  {
    key: 'pendiente',
    label: 'Pedido Recibido',
    desc: 'Tu solicitud fue registrada y está en cola.',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    key: 'en_proceso',
    label: 'En Producción',
    desc: 'El equipo FOL está trabajando en tu pedido.',
    icon: Clock,
    color: 'bg-orange-500',
  },
  {
    key: 'revision',
    label: 'Control de Calidad',
    desc: 'Tu trabajo está siendo revisado antes de la entrega.',
    icon: RefreshCw,
    color: 'bg-purple-500',
  },
  {
    key: 'entregado',
    label: 'Entregado',
    desc: '¡Tu trabajo ha sido completado y enviado!',
    icon: Send,
    color: 'bg-green-500',
  },
];

const STATUS_ORDER = ['pendiente', 'en_proceso', 'revision', 'entregado'];

function getStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function getStatusLabel(status: string) {
  const step = STATUS_STEPS.find((s) => s.key === status);
  return step?.label || status;
}

function getStatusColor(status: string) {
  const step = STATUS_STEPS.find((s) => s.key === status);
  return step?.color || 'bg-slate-400';
}

function getPaymentLabel(payStatus: string) {
  switch (payStatus) {
    case 'liquidado': return { label: 'Liquidado ✓', color: 'text-green-400' };
    case 'pagado_adelanto': return { label: 'Abono recibido', color: 'text-yellow-400' };
    default: return { label: 'Pendiente de pago', color: 'text-red-400' };
  }
}

export default function OrderStatus() {
  const [orderId, setOrderId] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFreshData = async (id: string) => {
    const { data, error: err } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (!err && data) {
      setOrder((prev: any) => {
        if (prev && (prev.estado !== data.estado || prev.monto_total !== data.monto_total || prev.pago_estado !== data.pago_estado)) {
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 3000);
        }
        return data;
      });
      return true;
    }
    return false;
  };

  const checkStatus = async () => {
    const val = inputVal.trim();
    if (!val) return;
    setLoading(true);
    setError('');
    
    const success = await fetchFreshData(val);

    if (!success) {
      setError('No encontramos ningún pedido con ese código.');
      setOrder(null);
      setOrderId('');
    } else {
      setOrderId(val);
    }
    setLoading(false);
  };

  // Sincronización robusta: Realtime + Polling de respaldo
  useEffect(() => {
    if (!orderId) return;

    // 1. Realtime (Intento principal)
    const channel = supabase
      .channel(`order-live-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `id=eq.${orderId}` },
        (payload) => {
          console.log('[CLIENT] Update recibido por Realtime:', payload.new);
          setOrder(payload.new);
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 3000);
        }
      )
      .subscribe();

    // 2. Polling (Respaldo garantizado cada 5 segundos)
    pollIntervalRef.current = setInterval(() => {
      fetchFreshData(orderId);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [orderId]);

  const currentStepIndex = order ? getStepIndex(order.estado) : -1;
  const payInfo = order ? getPaymentLabel(order.pago_estado) : null;

  return (
    <section id="status" className="py-24 bg-gradient-to-br from-slate-50 to-white border-t border-slate-100">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Sincronización en Vivo Activa
          </span>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Rastrea tu Pedido</h2>
          <p className="text-slate-500 font-medium">Ingresa tu código único para ver el estado real.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Pega tu código aquí..."
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-slate-900 transition-all text-slate-900 font-bold bg-white shadow-sm"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkStatus()}
          />
          <button
            onClick={checkStatus}
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Buscar</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl text-center font-bold text-sm"
            >
              {error}
            </motion.div>
          )}

          {order && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative"
            >
              {/* Notificación de actualización */}
              <AnimatePresence>
                {justUpdated && (
                  <motion.div
                    key="pulse"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white text-[10px] font-black px-6 py-2 rounded-full shadow-lg whitespace-nowrap"
                  >
                    ✦ ACTUALIZADO EN TIEMPO REAL
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/5">
                {/* Glow effects */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600 rounded-full filter blur-[100px] opacity-20 pointer-events-none" />
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600 rounded-full filter blur-[100px] opacity-10 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Estado del Producto</p>
                      <motion.h3
                        key={order.estado}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-black tracking-tight uppercase"
                      >
                        {getStatusLabel(order.estado)}
                      </motion.h3>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-5 h-5 rounded-full ${getStatusColor(order.estado)} shadow-[0_0_20px_rgba(255,255,255,0.2)]`}
                    />
                  </div>

                  {/* Pasos Visuales */}
                  <div className="space-y-4 mb-8">
                    {STATUS_STEPS.map((step, idx) => {
                      const isDone = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const Icon = step.icon;
                      return (
                        <div
                          key={step.key}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-white/5 border-white/10' : 'border-transparent'}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isDone ? step.color : 'bg-slate-800'}`}>
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5 opacity-20" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-black text-sm uppercase ${isDone ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                            {isCurrent && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{step.desc}</p>
                            )}
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">ACTIVO</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Información de Pago y Monto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Monto a Pagar</p>
                      <motion.p 
                        key={order.monto_total}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-black tracking-tighter"
                      >
                        {order.monto_total ? `C$${Number(order.monto_total).toLocaleString()}` : 'POR DEFINIR'}
                      </motion.p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Estado de Pago</p>
                      <p className={`text-xl font-black tracking-tight ${payInfo?.color}`}>
                        {payInfo?.label.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Servicio Contratado</p>
                       <p className="text-[10px] font-bold text-slate-600">ID: {order.id}</p>
                    </div>
                    <p className="text-white font-black text-lg uppercase">{order.servicio_id}</p>
                    {order.detalles && (
                      <p className="text-slate-400 text-xs mt-1 italic leading-relaxed">&quot;{order.detalles}&quot;</p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/10 text-center">
                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mb-1">Centro de Soporte FOL PS</p>
                    <p className="font-bold text-sm text-slate-300">Si tienes dudas, escríbenos por WhatsApp con tu código.</p>
                  </div>
                </div>
              </div>

              {/* Datos de depósito */}
              {order.metodo_pago === 'deposito_lafise' && order.monto_total > 0 && !order.archivo_entrega && (
                <motion.div
                  key="deposito"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-blue-600 p-8 rounded-[2rem] shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Banknote className="w-8 h-8 text-white shrink-0" />
                    <p className="text-xl font-black text-white tracking-tighter">Realiza tu depósito para recibir tu entrega</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 text-white space-y-1 mb-4">
                    <p className="text-sm font-bold">Banco: <span className="font-black">LAFISE</span></p>
                    <p className="text-sm font-bold">Cuenta Córdobas: <span className="font-black text-lg">137038005</span></p>
                    <p className="text-sm font-bold">A nombre de: <span className="font-black">Leandro Calero</span></p>
                    <p className="text-sm font-bold">Monto: <span className="font-black text-lg">C${order.monto_total}</span></p>
                  </div>
                  <a
                    href={`https://wa.me/50585853867?text=${encodeURIComponent(`Hola FOL PS! Soy ${order.cliente_nombre}, acabo de realizar el depósito de C$${order.monto_total} por mi pedido (ID: ${order.id}). Adjunto el comprobante.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white text-blue-700 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 hover:text-white transition-all"
                  >
                    <Send className="w-4 h-4" /> Enviar comprobante por WhatsApp
                  </a>
                </motion.div>
              )}

              {/* Archivo de entrega */}
              {order.archivo_entrega && (
                <motion.div
                  key={order.archivo_entrega}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-green-600 p-8 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-70">Archivo Disponible</p>
                    <p className="text-xl font-black tracking-tighter">Tu entrega está lista para descargar</p>
                  </div>
                  <a
                    href={order.archivo_entrega}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="shrink-0 bg-white text-green-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-xl"
                  >
                    <Download className="w-5 h-5" /> Descargar
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
