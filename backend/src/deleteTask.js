import { supabaseClient } from "./db.js";

export const deleteTask = async (id, userId) => {
  try {

    await supabaseClient
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('id_usuario', userId);
    
    return '{"message": "Task deletada com sucesso"}';
  } catch (error) {
    console.error("Erro ao deletar task:", error);
    throw new Error(`Erro interno ao deletar task ${error.message}`);
  }
};
