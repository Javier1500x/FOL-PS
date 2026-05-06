'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteOrder,
  updateOrder,
  saveToHistory,
  fetchAllOrders,
  fetchAllHistory,
  deleteHistoryItem,
  uploadOrderFile,
} from '@/app/actions';
import {
  ShoppingBag, LogOut, Bell, X, Save,
  FileText, TrendingUp, Trash2, History, Search, Package, RefreshCw, MessageCircle, Mail, Ban, Upload, Paperclip
} from 'lucide-react';

const ESTADOS = [
  { value: 'pendiente', label: 'PENDIENTE' },
  { value: 'en_proceso', label: 'EN PROCESO' },
  { value: 'revision', label: 'REVISIÓN' },
  { value: 'entregado', label: 'ENTREGADO' },
];

const PAGO_ESTADOS = [
  { value: 'pendiente_adelanto', label: 'DEUDA' },
  { value: 'pagado_adelanto', label: 'ABONO' },
  { value: 'liquidado', label: 'LIQUIDADO' },
];

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-slate-200 text-slate-700',
  en_proceso: 'bg-orange-100 text-orange-700 border border-orange-300',
  revision: 'bg-purple-100 text-purple-700 border border-purple-300',
  entregado: 'bg-green-100 text-green-700 border border-green-400',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const [currentUser, setCurrentUser] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);
  const router = useRouter();

  async function loadOrders() {
    const result = await fetchAllOrders();
    if (!result.success) return;

    const newOrders = result.data;
    const newIds = new Set(newOrders.map((o: any) => o.id));
    const prevIds = prevOrderIdsRef.current;

    if (!isFirstLoadRef.current && prevIds.size > 0) {
      for (const order of newOrders) {
        if (!prevIds.has(order.id)) {
          triggerAlert(order);
          break;
        }
      }
    }

    prevOrderIdsRef.current = newIds;
    isFirstLoadRef.current = false;
    setOrders(newOrders);
  }

  async function loadHistory() {
    const result = await fetchAllHistory();
    if (result.success) setHistory(result.data);
  }

  function triggerAlert(order: any) {
    setNewOrderAlert(order);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setNewOrderAlert(null), 15000);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  useEffect(() => {
    const isAuth = localStorage.getItem('fol_ps_auth');
    const user = localStorage.getItem('fol_ps_user');
    if (!isAuth) { router.push('/login'); return; }
    setCurrentUser(user || 'Socio');

    try {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audioRef.current.volume = 0.9;
      audioRef.current.load();
    } catch (e) {}

    loadOrders();
    loadHistory();

    const pollInterval = setInterval(() => { loadOrders(); }, 5000);
    const histInterval = setInterval(() => { loadHistory(); }, 15000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(histInterval);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, []);

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Seguro que quieres cancelar y eliminar este pedido?')) return;
    setDeletingId(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    const result = await deleteOrder(id);
    if (!result.success) {
      alert('Error al cancelar: ' + (result.error || 'Intenta de nuevo'));
      await loadOrders();
    }
    setDeletingId(null);
  };

  const handleDeleteHistory = async (id: string) => {
    if (!confirm('¿Eliminar esta factura del historial? No afectará al pedido original.')) return;
    const result = await deleteHistoryItem(id);
    if (result.success) {
      setHistory(prev => prev.filter(h => h.id !== id));
    } else {
      alert('Error al eliminar historial');
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    setSaving(true);
    const result = await updateOrder(editingOrder.id, {
      estado: editingOrder.estado,
      pago_estado: editingOrder.pago_estado,
      monto_total: Number(editingOrder.monto_total),
      vendedor: editingOrder.vendedor,
      productor: editingOrder.productor,
      deadline: editingOrder.deadline,
      notas_internas: editingOrder.notas_internas,
    });

    if (result.success) {
      if (editingOrder.pago_estado === 'liquidado' || editingOrder.estado === 'entregado') {
        await saveToHistory({
          pedido_id: editingOrder.id,
          cliente_nombre: editingOrder.cliente_nombre,
          monto_total: Number(editingOrder.monto_total),
          servicio_id: editingOrder.servicio_id,
          detalles: editingOrder.detalles,
          vendedor: editingOrder.vendedor,
          productor: editingOrder.productor,
        });
        loadHistory();
      }
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...editingOrder, monto_total: Number(editingOrder.monto_total) } : o));
      setEditingOrder(null);
    } else {
      alert('Error al actualizar');
    }
    setSaving(false);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingOrder || !e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    const result = await uploadOrderFile(editingOrder.id, fd);
    if (result.success) {
      setEditingOrder({ ...editingOrder, archivo_entrega: result.url, estado: 'entregado' });
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, archivo_entrega: result.url, estado: 'entregado' } : o));

      // Notificar al cliente por WhatsApp automáticamente
      const contacto = result.clienteContacto || '';
      const nombre = result.clienteNombre || editingOrder.cliente_nombre;
      const phone = contacto.replace(/\D/g, '');
      const msg = encodeURIComponent(`Hola ${nombre}! 🎉 Tu pedido de FOL PS ya está listo. Puedes descargar tu archivo aquí: ${result.url}\n\nCódigo de pedido: ${editingOrder.id}`);
      const waNumber = phone.length >= 8 ? (phone.startsWith('505') ? phone : `505${phone}`) : '50585853867';
      window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
    } else {
      alert('Error al subir archivo: ' + result.error);
    }
    setUploading(false);
  };

  const contactWhatsApp = (order: any) => {
    const phone = order.cliente_contacto.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hola ${order.cliente_nombre}, te contactamos de FOL PS sobre tu pedido de ${order.servicio_id}.`);
    window.open(`https://wa.me/${phone || '50585853867'}?text=${msg}`, '_blank');
  };

  const contactEmail = (order: any) => {
    const subject = encodeURIComponent(`Información sobre tu pedido - FOL PS`);
    const body = encodeURIComponent(`Hola ${order.cliente_nombre},\n\nTe contactamos para informarte sobre el avance de tu pedido de ${order.servicio_id}.`);
    window.open(`mailto:${order.cliente_contacto}?subject=${subject}&body=${body}`, '_blank');
  };

  const finance = (() => {
    const total = orders
      .filter(o => o.estado === 'entregado' || o.pago_estado === 'liquidado')
      .reduce((acc, o) => acc + (Number(o.monto_total) || 0), 0);
    return { empresa: total * 0.6, vendedores: total * 0.1, productores: total * 0.3, total };
  })();

  const filteredOrders = orders.filter(o => {
    const matchEstado = filterEstado === 'todos' || o.estado === filterEstado;
    const matchSearch = !searchId || (o.cliente_nombre || '').toLowerCase().includes(searchId.toLowerCase());
    return matchEstado && matchSearch;
  });

  const exportCSV = () => {
    const rows = [['ID', 'Cliente', 'Servicio', 'Estado', 'Pago', 'Monto', 'Fecha']];
    history.forEach(h => rows.push([h.pedido_id, h.cliente_nombre, h.servicio_id, 'entregado', 'liquidado', h.monto_total, new Date(h.fecha_emision).toLocaleDateString()]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'historial-fol.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      {/* Alerta de Pedido Nuevo */}
      {newOrderAlert && (
        <div className="fixed top-5 right-5 z-[500] bg-blue-600 text-white px-8 py-6 rounded-[2rem] shadow-2xl flex items-center gap-4 border-4 border-white max-w-sm" style={{ animation: 'slideInRight 0.5s ease-out, alertPulse 2s infinite' }}>
          <div style={{ animation: 'bellShake 0.5s ease-in-out infinite' }}><Bell className="w-10 h-10" /></div>
          <div><p className="font-black text-xl">¡NUEVO PEDIDO!</p><p className="text-sm font-bold opacity-90">{newOrderAlert.cliente_nombre}</p></div>
          <button onClick={() => setNewOrderAlert(null)} className="ml-auto opacity-50 hover:opacity-100"><X /></button>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes bellShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } 75% { transform: rotate(-10deg); } }
        @keyframes alertPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 50% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); } }
      `}</style>

      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white p-8 flex flex-col shrink-0">
        <div className="text-4xl font-black mb-12 tracking-tighter italic">FOL<span className="text-blue-500">PS</span></div>
        <nav className="flex-1 space-y-3">
          {[
            { id: 'orders', label: 'Operaciones', icon: ShoppingBag },
            { id: 'history', label: 'Historial', icon: History },
            { id: 'finance', label: 'Analítica', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-white'}`}>
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </nav>
        <div className="mt-4 p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 font-bold flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" /><span>Sincronización FOL</span>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="mt-4 flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-xs uppercase border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-end mb-12">
          <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mb-2">Administración de Ventas</p><h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">Dashboard</h1></div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Caja Liquidada</p><p className="text-3xl font-black text-slate-900 tracking-tighter">C${finance.total.toFixed(2)}</p></div>
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar cliente..." className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-100 outline-none focus:border-blue-600 font-bold text-sm" value={searchId} onChange={e => setSearchId(e.target.value)} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['todos', 'pendiente', 'en_proceso', 'revision', 'entregado'].map(f => (
                  <button key={f} onClick={() => setFilterEstado(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterEstado === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-900'}`}>
                    {f === 'todos' ? 'Todos' : ESTADOS.find(e => e.value === f)?.label}
                    {f !== 'todos' && <span className="ml-1 opacity-60">({orders.filter(o => o.estado === f).length})</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white">
                  <tr>{['Cliente', 'Contacto', 'Estado', 'Monto', 'Acciones'].map(h => <th key={h} className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-blue-50/40 transition-all">
                      <td className="px-8 py-8"><div className="font-black text-xl tracking-tighter uppercase">{o.cliente_nombre}</div><div className="text-[10px] font-bold text-blue-500">{o.servicio_id}</div><div className="text-[10px] font-bold mt-1 text-slate-400 uppercase">{o.metodo_pago === 'deposito_lafise' ? 'Depósito LAFISE' : 'Efectivo'}</div></td>
                      <td className="px-8 py-8">
                        <div className="flex gap-2">
                          <button onClick={() => contactWhatsApp(o)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><MessageCircle size={18} /></button>
                          <button onClick={() => contactEmail(o)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Mail size={18} /></button>
                        </div>
                      </td>
                      <td className="px-8 py-8"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${STATUS_COLOR[o.estado]}`}>{ESTADOS.find(e => e.value === o.estado)?.label || o.estado}</span></td>
                      <td className="px-8 py-8 text-2xl font-black tracking-tighter">C${Number(o.monto_total || 0).toFixed(2)}</td>
                      <td className="px-8 py-8">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingOrder({ ...o })} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600"><Save size={18} /></button>
                          <button onClick={() => handleDeleteOrder(o.id)} disabled={deletingId === o.id} className="bg-red-50 text-red-600 p-3 rounded-xl hover:bg-red-600 hover:text-white"><Ban size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Sin pedidos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1"><Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Buscar en historial..." className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border-2 border-slate-100 outline-none focus:border-blue-600 font-black" value={searchId} onChange={(e) => setSearchId(e.target.value)} /></div>
              <button onClick={exportCSV} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shrink-0"><Package size={16} /> Exportar CSV</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {history.filter(h => (h.cliente_nombre || '').toLowerCase().includes(searchId.toLowerCase()) || (h.servicio_id || '').toLowerCase().includes(searchId.toLowerCase())).map((h) => (
                <div key={h.id} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleDeleteHistory(h.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter">{h.cliente_nombre}</h4>
                  <p className="text-xs font-black text-slate-400 uppercase mb-6">{h.servicio_id} — {new Date(h.fecha_emision).toLocaleDateString()}</p>
                  <div className="flex justify-between items-end">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidado</p><p className="text-4xl font-black tracking-tighter">C${h.monto_total}</p></div>
                    <button onClick={() => setInvoiceOrder(h)} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600"><FileText size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8">
            {/* Resumen financiero */}
            <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
              <TrendingUp className="absolute top-0 right-0 w-[300px] h-[300px] opacity-5 rotate-12" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { label: 'Total Liquidado', val: finance.total },
                  { label: 'Empresa (60%)', val: finance.empresa },
                  { label: 'Productores (30%)', val: finance.productores },
                  { label: 'Vendedores (10%)', val: finance.vendedores },
                ].map(({ label, val }) => (
                  <div key={label}><p className="text-blue-400 font-black uppercase tracking-widest text-[10px] mb-2">{label}</p><h4 className="text-4xl font-black tracking-tighter">C${val.toFixed(2)}</h4></div>
                ))}
              </div>
            </div>
            {/* Stats generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Pedidos', val: orders.length },
                { label: 'Entregados', val: orders.filter(o => o.estado === 'entregado').length },
                { label: 'En Proceso', val: orders.filter(o => o.estado === 'en_proceso').length },
                { label: 'Promedio C$', val: orders.length ? (orders.reduce((a, o) => a + Number(o.monto_total || 0), 0) / orders.length).toFixed(0) : 0 },
              ].map(({ label, val }) => (
                <div key={label} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                  <p className="text-4xl font-black tracking-tighter text-slate-900">{val}</p>
                </div>
              ))}
            </div>
            {/* Pedidos por servicio */}
            <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Pedidos por Servicio</p>
              <div className="space-y-3">
                {Object.entries(
                  orders.reduce((acc: Record<string, number>, o) => { acc[o.servicio_id] = (acc[o.servicio_id] || 0) + 1; return acc; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([svc, count]) => (
                  <div key={svc} className="flex items-center gap-4">
                    <p className="text-sm font-black uppercase w-40 shrink-0 truncate">{svc}</p>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${(count / orders.length) * 100}%` }} />
                    </div>
                    <p className="text-sm font-black w-6 text-right">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EDICIÓN */}
      {editingOrder && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-72 bg-slate-50 p-10 border-r border-slate-100"><h3 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Expediente</h3><div className="space-y-6"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</label><p className="text-xl font-black uppercase">{editingOrder.cliente_nombre}</p></div><div className="bg-white p-5 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-500 italic">&quot;{editingOrder.detalles}&quot;</p></div></div></div>
            <div className="flex-1 p-12"><div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black uppercase underline decoration-blue-600 decoration-4 underline-offset-8">Ajustes</h3><button onClick={() => setEditingOrder(null)}><X /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div><label className="text-xs font-black uppercase tracking-widest mb-2 block">Monto (C$)</label><input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-black text-3xl" value={editingOrder.monto_total || 0} onChange={(e) => setEditingOrder({ ...editingOrder, monto_total: e.target.value })} /></div>
                <div><label className="text-xs font-black uppercase tracking-widest mb-2 block">Estado Pedido</label><select className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-black uppercase" value={editingOrder.estado} onChange={(e) => setEditingOrder({ ...editingOrder, estado: e.target.value })}>{ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select></div>
                <div><label className="text-xs font-black uppercase tracking-widest mb-2 block">Estado Pago</label><select className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-black uppercase" value={editingOrder.pago_estado} onChange={(e) => setEditingOrder({ ...editingOrder, pago_estado: e.target.value })}>{PAGO_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}</select></div>
                <div><label className="text-xs font-black uppercase tracking-widest mb-2 block">Staff</label><div className="flex gap-2"><input placeholder="Vendedor" className="w-1/2 p-4 rounded-xl bg-slate-50" value={editingOrder.vendedor || ''} onChange={(e) => setEditingOrder({ ...editingOrder, vendedor: e.target.value })} /><input placeholder="Productor" className="w-1/2 p-4 rounded-xl bg-slate-50" value={editingOrder.productor || ''} onChange={(e) => setEditingOrder({ ...editingOrder, productor: e.target.value })} /></div></div>
                <div><label className="text-xs font-black uppercase tracking-widest mb-2 block">Fecha Límite</label><input type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-black" value={editingOrder.deadline || ''} onChange={(e) => setEditingOrder({ ...editingOrder, deadline: e.target.value })} /></div>
              </div>
              <div className="mb-6"><label className="text-xs font-black uppercase tracking-widest mb-2 block">Notas Internas (solo admin)</label><textarea rows={2} placeholder="Notas privadas del equipo..." className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold text-sm resize-none" value={editingOrder.notas_internas || ''} onChange={(e) => setEditingOrder({ ...editingOrder, notas_internas: e.target.value })} /></div>
              <button onClick={handleUpdateOrder} disabled={saving} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-blue-600 transition-all">{saving ? 'Guardando...' : 'Sincronizar'}</button>

              {/* Subir archivo de entrega */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-500">Archivo de Entrega</label>
                {editingOrder.archivo_entrega && (
                  <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <Paperclip size={14} className="text-green-600 shrink-0" />
                    <a href={editingOrder.archivo_entrega} target="_blank" rel="noreferrer" className="text-xs text-green-700 font-bold truncate hover:underline">Archivo subido — ver</a>
                  </div>
                )}
                <label className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all font-black text-xs uppercase text-slate-500 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={18} />
                  {uploading ? 'Subiendo...' : 'Subir archivo (PDF, PPT, DOC, XLS…)'}
                  <input type="file" className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip" onChange={handleUploadFile} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURA */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-[700] bg-white p-16 flex flex-col items-center overflow-y-auto no-print">
          <div className="max-w-3xl w-full p-16 border-[20px] border-slate-50 rounded-[5rem] relative">
            <button onClick={() => setInvoiceOrder(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={40} /></button>
            <h4 className="text-5xl font-black mb-2 italic">FOL<span className="text-blue-600">PS</span></h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-16">Comprobante de Pago</p>
            <div className="grid grid-cols-2 gap-16 mb-16">
              <div><p className="text-xs font-black text-slate-400 uppercase mb-2">Cliente</p><p className="text-2xl font-black uppercase">{invoiceOrder.cliente_nombre}</p></div>
              <div className="text-right"><p className="text-xs font-black text-slate-400 uppercase mb-2">Fecha</p><p className="text-2xl font-black">{new Date(invoiceOrder.fecha_emision).toLocaleDateString()}</p></div>
            </div>
            <div className="border-y-4 border-slate-900 py-12 mb-16 flex justify-between items-center">
              <div><p className="text-blue-600 font-black text-sm uppercase mb-2">{invoiceOrder.servicio_id}</p><p className="text-lg font-bold text-slate-400 italic">ID: {invoiceOrder.pedido_id}</p></div>
              <p className="text-5xl font-black">C${invoiceOrder.monto_total}</p>
            </div>
            <button onClick={() => window.print()} className="w-full bg-blue-600 text-white py-8 rounded-[3rem] font-black uppercase shadow-xl hover:bg-slate-900 transition-all">Imprimir</button>
          </div>
        </div>
      )}
    </div>
  );
}
