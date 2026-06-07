import { supabaseClient } from "./db.js";

export const listTasks = async (userId) => {
    const { data, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('id_usuario', userId)
    .range(0, 9);  // Paginação (primeiros 10 itens)
    
    if (error) {
      console.error("Erro ao listar tasks:", error);
      throw new Error(`Erro interno ao listar tasks ${error.message}`);
    }

    return data || [];
};
