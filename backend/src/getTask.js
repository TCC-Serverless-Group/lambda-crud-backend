import { supabaseClient } from "./db.js";

export const getTask = async (id, userId) => {

    const { data, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('id_usuario', userId)
    .single();

    if (error) {
      console.error("Erro ao consultar task:", error);
      throw new Error(`Erro interno ao consultar task ${error.message}`);
    }
    
    return data || {};
};
