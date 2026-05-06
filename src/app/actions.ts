'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';

// Solo inicializar Resend si existe la API Key para evitar que el servidor explote
const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

export async function submitOrder(formData: {
  name: string;
  contact: string;
  service: string;
  details: string;
}) {
  try {
    // 1. Guardar en Supabase (SIEMPRE se intenta esto primero)
    const { data, error } = await supabaseServer
      .from('pedidos')
      .insert([
        { 
          cliente_nombre: formData.name, 
          cliente_contacto: formData.contact, 
          servicio_id: formData.service, 
          detalles: formData.details,
          estado: 'pendiente'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 2. Intentar enviar correo solo si Resend está configurado
    if (resend) {
      try {
        await resend.emails.send({
          from: 'FOL PS <onboarding@resend.dev>',
          to: ['foldigital17@gmail.com'],
          subject: `Nuevo Pedido: ${formData.service} - ${formData.name}`,
          html: `
            <h1>Nuevo Pedido Recibido</h1>
            <p><strong>ID del Pedido:</strong> ${data.id}</p>
            <p><strong>Cliente:</strong> ${formData.name}</p>
            <p><strong>Contacto:</strong> ${formData.contact}</p>
            <p><strong>Servicio:</strong> ${formData.service}</p>
            <p><strong>Detalles:</strong> ${formData.details}</p>
          `
        });
      } catch (emailError) {
        console.error('Error al enviar email (pero el pedido se guardó):', emailError);
      }
    }

    return { success: true, orderId: data.id };
  } catch (error) {
    console.error('Error crítico al procesar pedido:', error);
    return { success: false, error };
  }
}

export async function deleteOrder(id: string) {
  try {
    console.log('[deleteOrder] Intentando eliminar pedido:', id);
    
    // Usar select() para verificar que realmente se eliminó
    const { data, error } = await supabaseServer
      .from('pedidos')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[deleteOrder] Error de Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('[deleteOrder] No se eliminó ninguna fila. Probablemente RLS bloquea DELETE. Agrega SUPABASE_SERVICE_ROLE_KEY a .env.local');
      return { success: false, error: 'No se pudo eliminar. Verifica permisos en Supabase.' };
    }

    console.log('[deleteOrder] ✓ Eliminado exitosamente:', id);
    return { success: true };
  } catch (error) {
    console.error('[deleteOrder] Error crítico:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateOrder(id: string, updateData: {
  estado: string;
  pago_estado: string;
  monto_total: number;
  vendedor?: string;
  productor?: string;
}) {
  try {
    console.log('[updateOrder] Actualizando pedido:', id, updateData);

    const { data, error } = await supabaseServer
      .from('pedidos')
      .update({
        estado: updateData.estado,
        pago_estado: updateData.pago_estado,
        monto_total: updateData.monto_total,
        vendedor: updateData.vendedor || null,
        productor: updateData.productor || null,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('[updateOrder] Error de Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.error('[updateOrder] No se actualizó ninguna fila. RLS puede estar bloqueando UPDATE.');
      return { success: false, error: 'No se pudo actualizar. Verifica permisos en Supabase.' };
    }

    console.log('[updateOrder] ✓ Actualizado:', id, '→', updateData.estado);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('[updateOrder] Error crítico:', error);
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
    if (error) {
      console.error('[saveToHistory] Error:', error);
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
export async function deleteHistoryItem(id: string) {
  try {
    const { error } = await supabaseServer
      .from('historial_facturas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('[deleteHistoryItem] Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function fetchAllOrders() {
  try {
    const { data, error } = await supabaseServer
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[fetchAllOrders] Error:', error);
    return { success: false, data: [] };
  }
}

export async function fetchAllHistory() {
  try {
    const { data, error } = await supabaseServer
      .from('historial_facturas')
      .select('*')
      .order('fecha_emision', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[fetchAllHistory] Error:', error);
    return { success: false, data: [] };
  }
}
