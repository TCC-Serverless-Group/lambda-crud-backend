export async function route(request) {
    const { method, path, body, userId } = request;

    if (method === "GET" && path === "/tasks/list") {
        return {
            statusCode: 200,
            body: await listTasks(userId),
        };
    }

    if (method === "POST" && path === "/tasks/save") {
        return {
            statusCode: 201,
            body: await createTask(body, userId),
        };
    }

    if (method === "GET" && path.startsWith("/tasks/get/")) {
        const id = path.split("/").pop();
        return {
            statusCode: 200,
            body: await getTask(id, userId),
        };
    }

    if (method === "PUT" && path.startsWith("/tasks/put/")) {
        const id = path.split("/").pop();
        return {
            statusCode: 204,
            body: await updateTask(id, body, userId),
        };
    }

    if (method === "DELETE" && path.startsWith("/tasks/delete/")) {
        const id = path.split("/").pop();
        return {
            statusCode: 204,
            body: await deleteTask(id, userId),
        };
    }

    return {
        statusCode: 404,
        body: { message: "Rota não encontrada", method, path },
    };
}