import { supabaseClient } from "./db.js";

export async function createTask(payload, userId) {
  try {
    const task = {
      id_usuario: userId,
      descricao: payload.descricao,
      completo: payload.completo ?? false
    };
  
    const { data, error } = await supabaseClient
    .from('tasks')
    .insert( task )
    .select()
    .single();
    
    if (error) {
      throw new Error(`Erro interno ao criar task ${error.message}`);
    }
    return data;
  } catch (error) {
    throw new Error(`Erro interno ao criar task ${error.message}`);
  }
};