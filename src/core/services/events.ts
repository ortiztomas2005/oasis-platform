import { getSupabaseAdmin } from '@/core/supabase/admin';

export async function deductPrepaidTicket(producerName: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Consultamos el saldo actual de la productora
  const { data: producer, error: fetchError } = await supabase
    .from('producers')
    .select('prepaid_balance')
    .eq('name', producerName)
    .single();

  if (fetchError || !producer || producer.prepaid_balance <= 0) {
    console.error('No se pudo obtener el saldo o la productora no tiene créditos', fetchError);
    return false;
  }

  // Restamos 1 al saldo prepago
  const { error: updateError } = await supabase
    .from('producers')
    .update({ prepaid_balance: producer.prepaid_balance - 1 })
    .eq('name', producerName);

  if (updateError) {
    console.error('Error al descontar el ticket prepago', updateError);
    return false;
  }

  return true;
}