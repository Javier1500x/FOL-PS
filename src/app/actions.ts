'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) return;
  // Solo enviar si parece un email válido
  if (!to.includes('@')) return;
  try {
    await resend.emails.send({ from: 'FOL PS <onboarding@resend.dev>', to: [to], subject, html });
  } catch (e) {
    console.error('[sendEmail] Error:', e);
  }
}

export async function submitOrder(formData: {
  name: string;
  contact: string;
  service: string;
  details: string;
  metodo_pago: string;
}) {
  try {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .insert([{
        cliente_nombre: formData.name,
        cliente_contacto: formData.contact,
        servicio_id: formData.service,
        detalles: formData.details,
        estado: 'pendiente',
        metodo_pago: formData.metodo_pago,
      }])
      .select()
      .single();

    if (error) throw error;

    // Email al admin
    await sendEmail('foldigital17@gmail.com', `Nuevo Pedido: ${formData.service} - ${formData.name}`,
      `<h2>Nuevo Pedido</h2><p><b>ID:</b> ${data.id}</p><p><b>Cliente:</b> ${formData.name}</p><p><b>Contacto:</b> ${formData.contact}</p><p><b>Servicio:</b> ${formData.service}</p><p><b>Detalles:</b> ${formData.details}</p>`
    );

    // Email de confirmación al cliente (si puso correo)
    await sendEmail(formData.contact, '✅ Pedido confirmado — FOL PS',
      `<h2>¡Hola ${formData.name}!</h2><p>Tu pedido fue recibido con éxito.</p><p><b>Código de rastreo:</b> <code>${data.id}</code></p><p>Puedes rastrear tu pedido en: <a href="https://fol-ps.netlify.app/#status">fol-ps.netlify.app</a></p><p>Te avisaremos cuando haya novedades.</p><br><p>— Equipo FOL PS</p>`
    );

    return { success: true, orderId: data.id };
  } catch (error) {
    console.error('[submitOrder] Error:', error);
    return { success: false, error };
  }
}

export async function deleteOrder(id: string) {
  try {
    const { data, error } = await supabaseServer.from('pedidos').delete().eq('id', id).select();
    if (error) return { success: false, error: error.message };
    if (!data || data.length === 0) return { success: false, error: 'No se pudo eliminar. Verifica permisos en Supabase.' };
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateOrder(id: string, updateData: {
  estado: string;
  pago_estado: string;
  monto_total: number;
  vendedor?: string;
  productor?: string;
  deadline?: string;
  notas_internas?: string;
}) {
  try {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .update({
        estado: updateData.estado,
        pago_estado: updateData.pago_estado,
        monto_total: updateData.monto_total,
        vendedor: updateData.vendedor || null,
        productor: updateData.productor || null,
        deadline: updateData.deadline || null,
        notas_internas: updateData.notas_internas || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'No se pudo actualizar.' };

    // Email al cliente cuando cambia el estado
    const estadoLabels: Record<string, string> = {
      pendiente: 'Recibido',
      en_proceso: 'En Proceso',
      revision: 'En Revisión de Calidad',
      entregado: '¡Entregado!',
    };
    await sendEmail(data.cliente_contacto, `📦 Tu pedido está: ${estadoLabels[updateData.estado] || updateData.estado} — FOL PS`,
      `<h2>Hola ${data.cliente_nombre},</h2><p>El estado de tu pedido cambió a: <b>${estadoLabels[updateData.estado] || updateData.estado}</b></p>${updateData.monto_total > 0 ? `<p><b>Monto:</b> C$${updateData.monto_total}</p>` : ''}<p>Rastrea tu pedido: <a href="https://fol-ps.netlify.app/#status">fol-ps.netlify.app</a></p><p>Código: <code>${id}</code></p><br><p>— Equipo FOL PS</p>`
    );

    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function saveToHistory(orderData: {
  pedido_id: string;
  cliente_nombre: string;
  monto_total: number;
  servicio_id: string;
  detalles: string;
  vendedor?: string;
  productor?: string;
}) {
  try {
    const { error } = await supabaseServer.from('historial_facturas').insert([orderData]);
    if (error) return { success: false };
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteHistoryItem(id: string) {
  try {
    const { error } = await supabaseServer.from('historial_facturas').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function fetchAllOrders() {
  try {
    const { data, error } = await supabaseServer.from('pedidos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function fetchAllHistory() {
  try {
    const { data, error } = await supabaseServer.from('historial_facturas').select('*').order('fecha_emision', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function uploadOrderFile(orderId: string, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const ext = file.name.split('.').pop();
    const path = `${orderId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from('entregas')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseServer.storage.from('entregas').getPublicUrl(path);

    const { data: order } = await supabaseServer
      .from('pedidos')
      .select('cliente_nombre, cliente_contacto')
      .eq('id', orderId)
      .single();

    const { error: updateError } = await supabaseServer
      .from('pedidos')
      .update({ archivo_entrega: urlData.publicUrl, estado: 'entregado' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Email al cliente con link de descarga
    await sendEmail(order?.cliente_contacto || '', '🎉 Tu entrega está lista — FOL PS',
      `<h2>¡Hola ${order?.cliente_nombre}!</h2><p>Tu pedido está listo para descargar.</p><p><a href="${urlData.publicUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Descargar Archivo</a></p><p>También puedes verlo en: <a href="https://fol-ps.netlify.app/#status">fol-ps.netlify.app</a></p><p>Código: <code>${orderId}</code></p><br><p>— Equipo FOL PS</p>`
    );

    return {
      success: true,
      url: urlData.publicUrl,
      clienteNombre: order?.cliente_nombre || '',
      clienteContacto: order?.cliente_contacto || '',
    };
  } catch (error) {
    console.error('[uploadOrderFile] Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function submitRating(orderId: string, rating: number, comment: string, clienteName: string, servicio: string) {
  try {
    const { error } = await supabaseServer.from('calificaciones').insert([{
      pedido_id: orderId,
      rating,
      comment,
      cliente_nombre: clienteName,
      servicio_id: servicio,
    }]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function fetchReviews() {
  try {
    const { data, error } = await supabaseServer
      .from('calificaciones')
      .select('*')
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch {
    return { success: false, data: [] };
  }
}

export async function fetchCompletedCount() {
  try {
    const { count, error } = await supabaseServer
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'entregado');
    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch {
    return { success: false, count: 0 };
  }
}

export async function fetchUrgentOrders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select('id, cliente_nombre, cliente_contacto, servicio_id, deadline')
      .lte('deadline', tomorrowStr)
      .neq('estado', 'entregado')
      .not('deadline', 'is', null);
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch {
    return { success: false, data: [] };
  }
}
