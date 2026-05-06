'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Send, ShieldCheck, Zap, ArrowLeft, Wallet, Info, Download, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrder();

    // ESCUCHA REALTIME DINÁMICA MEJORADA
    const channel = supabase
      .channel(`order-track-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        () => {
          fetchOrder();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
        () => {
          setOrder(null);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function fetchOrder() {
    const { data } = await supabase.from('pedidos').select('*').eq('id', id).single();
    if (data) setOrder(data);
    setLoading(false);
  }

  const steps = [
    { key: 'pendiente', label: 'Recibido', icon: ShieldCheck, desc: 'Tu requerimiento está en cola de procesamiento.' },
    { key: 'en_proceso', label: 'En Proceso', icon: Zap, desc: 'Estamos trabajando en tu pedido con dedicación.' },
    { key: 'revision', label: 'Calidad', icon: Clock, desc: 'Auditando detalles finales para una entrega perfecta.' },
    { key: 'entregado', label: 'Finalizado', icon: CheckCircle2, desc: '¡Éxito! Tu trabajo está listo para ser descargado.' }
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === (order?.estado || 'pendiente'));

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
       <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full shadow-2xl"></motion.div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-12 text-center text-white">
      <h1 className="text-6xl font-black mb-6 tracking-tighter uppercase">Sin Señal</h1>
      <p className="text-slate-400 mb-12 max-w-md font-bold uppercase tracking-widest text-xs">El pedido no existe o ha sido removido del sistema central.</p>
      <Link href="/" className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black flex items-center gap-3 hover:bg-white hover:text-slate-900 transition-all shadow-2xl uppercase text-xs tracking-widest">
        <ArrowLeft className="w-6 h-6" /> Volver al Inicio
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans pb-20 text-slate-900">
      <nav className="p-10 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-3xl font-black text-slate-900 tracking-tighter">FOL<span className="text-blue-600 italic">PS</span></Link>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Realtime HUD Activo</div>
      </nav>

      <main className="max-w-5xl mx-auto px-10 pt-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-xs mb-4">Monitor de Producción v2.0</p>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-none uppercase">
            {order.cliente_nombre.split(' ')[0]} <span className="text-blue-600">»</span> {order.estado.replace('_', ' ')}
          </h1>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-white px-8 py-4 rounded-[2rem] border-2 border-slate-100 font-mono text-xs text-slate-900 shadow-xl flex items-center gap-3 font-black">ID: {order.id}</div>
            {order.monto_total > 0 && (
              <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 font-black uppercase text-xs tracking-widest">
                <Wallet className="w-5 h-5 text-blue-400" /> Precio: C${order.monto_total}
              </div>
            )}
          </div>
        </motion.div>

        <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-slate-50 relative overflow-hidden mb-16">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-50"></div>
          <motion.div animate={{ width: `${(getCurrentStepIndex() / (steps.length - 1)) * 100}%` }} className="absolute top-0 left-0 h-2 bg-blue-600 shadow-[0_0_20px_#2563eb]"></motion.div>
          <div className="relative flex flex-col md:flex-row justify-between gap-12 md:gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= getCurrentStepIndex();
              const isCurrent = index === getCurrentStepIndex();
              return (
                <div key={index} className="flex flex-col items-center relative z-10">
                  <motion.div animate={{ scale: isCurrent ? 1.3 : 1, backgroundColor: isActive ? '#1e293b' : '#f8fafc' }} className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl border-4 ${isCurrent ? 'border-blue-600' : 'border-white'} transition-all duration-500`}>
                    <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  </motion.div>
                  <p className={`mt-8 text-xs font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <Info className="w-12 h-12 text-blue-500 mb-8" />
              <h4 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">Nota del Equipo</h4>
              <p className="text-slate-400 font-bold text-lg leading-loose mb-10">{steps[getCurrentStepIndex()]?.desc}</p>
              <button onClick={() => window.open('https://wa.me/50585853867', '_blank')} className="bg-white text-slate-900 py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-xl">Contactar Staff <Send className="ml-2 w-4 h-4 inline" /></button>
           </div>
           <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center justify-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${order.estado === 'entregado' ? 'bg-green-100 text-green-600 animate-bounce' : 'bg-slate-50 text-slate-200'}`}><CheckCircle2 className="w-12 h-12" /></div>
              <p className="font-black text-slate-900 uppercase tracking-tighter text-xl">{order.estado === 'entregado' ? 'Listo para entrega' : 'En producción'}</p>
              <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest">FOL PS Central Sync</p>
           </div>
        </div>

        {/* Datos de depósito: solo si eligió depósito Y ya hay precio Y aún no hay archivo */}
        {order.metodo_pago === 'deposito_lafise' && order.monto_total > 0 && !order.archivo_entrega && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-blue-600 p-10 rounded-[3rem] shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <Banknote className="w-10 h-10 text-white shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200 mb-1">Paso siguiente</p>
                <p className="text-2xl font-black text-white tracking-tighter">Realiza tu depósito para recibir tu entrega</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-white space-y-2">
              <p className="text-sm font-bold">Banco: <span className="font-black">LAFISE</span></p>
              <p className="text-sm font-bold">Cuenta Córdobas: <span className="font-black text-xl">137038005</span></p>
              <p className="text-sm font-bold">A nombre de: <span className="font-black">Leandro Calero</span></p>
              <p className="text-sm font-bold">Monto: <span className="font-black text-xl">C${order.monto_total}</span></p>
            </div>
            <p className="text-blue-200 text-xs font-bold mt-4 uppercase tracking-widest">Una vez confirmado el pago, tu archivo aparecerá aquí automáticamente.</p>
          </motion.div>
        )}

        {/* Botón de descarga: solo cuando el admin sube el archivo */}
        {order.archivo_entrega && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-green-600 p-10 rounded-[3rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-70">Archivo Disponible</p>
              <p className="text-2xl font-black tracking-tighter">Tu entrega está lista para descargar</p>
            </div>
            <a
              href={order.archivo_entrega}
              target="_blank"
              rel="noreferrer"
              download
              className="shrink-0 bg-white text-green-700 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all shadow-xl"
            >
              <Download className="w-5 h-5" /> Descargar
            </a>
          </motion.div>
        )}
      </main>
    </div>
  );
}
