import { supabaseClient } from "./db.js";

export const updateTask = async (id, payload, userId) => {
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};

    Object.entries(payload).forEach(([key, value]) => {
      updateExpression.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
    });
    const { data, error } = await supabaseClient
      .from('tasks')
      .update({ descricao: payload.descricao, completo: payload.completo })
      .eq('id', id)
      .eq('id_usuario', userId);

    if (error) {
      throw new Error(`Erro interno ao atualizar task ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Erro ao atualizar task:", error);

    return ;
  }
};
