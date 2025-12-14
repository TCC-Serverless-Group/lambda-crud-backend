import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./db.js";

export const updateTask = async (id, data, userId) => {
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};

    Object.entries(data).forEach(([key, value]) => {
      updateExpression.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
    });

    const result = await docClient.send(
      new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id, userId },
        UpdateExpression: `SET ${updateExpression.join(", ")}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      })
    );
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization"
      },
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error("Erro ao atualizar task:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Erro interno ao atualizar task" })
    };
  }
};
