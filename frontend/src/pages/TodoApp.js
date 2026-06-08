import React, { useState, useEffect, useMemo } from 'react';
import authentication from '../SupabaseAuth';

let API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
let BASE_ENDPOINT = API_BASE_URL+"/tasks";

function TodoApp () {
  // --- Estados ---
  const [tasks, setTasks] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [editText, setEditText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const obterToken = async () => {
    console.log("Obtendo token de autenticação...");
    const sessionData = await authentication.getSession();
    return sessionData?.session?.access_token ?? '';
  };

  // --- Função principal para carregar as atividades (GET) ---
  const fetchTasks = async () => {
    setIsLoading(true);

    try {
      const token = await obterToken();
      
      const response = await fetch(BASE_ENDPOINT+"/list", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Token': token
        },
      });

      const data = await response.json();
      console.log("Resposta do servidor:", JSON.stringify(data));
      setTasks(Array.isArray(data) ? data : []); 

    } catch (error) {
      console.error("Erro ao carregar To-Dos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega a lista ao iniciar o componente
  useEffect(() => {
    console.log("Componente TodoApp montado. Carregando atividades...");
    fetchTasks();
  }, []);

  // --- Funções de Manipulação (CRUD) ---

  // 1. POST (Adicionar)
  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo = { descricao: newTodoText.trim(), completo: false };

    try {
      const token = await obterToken();
      console.log("Enviando nova atividade para o backend:", newTodo);
      const response = await fetch(BASE_ENDPOINT+"/save", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': token
        },
        body: JSON.stringify(newTodo),
      });

      console.log("Resposta do servidor após POST:", JSON.stringify(response));
      const addedTodo = await response.json();
    
      setTasks((tasks) => [...tasks, addedTodo]);
      setNewTodoText('');

    } catch (error) {
      console.error("Erro POST:", error);
    }
  };

  // 2. PUT/PATCH (Marcar como Feito)
  const toggleComplete = async (id, currentCompleted) => {
    const updatedStatus = { completo: !currentCompleted };

    try {
        const token = await obterToken();
        const response = await fetch(`${BASE_ENDPOINT}${"/put"}/${id}`, {
            method: 'PUT', // Ou 'PATCH'
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            },
            body: JSON.stringify(updatedStatus),
        });

        // Atualiza o estado local após sucesso
        setTasks(
            tasks.map((todo) =>
                todo.id === id ? { ...todo, completo: !currentCompleted } : todo
            )
        );
    } catch (error) {
        console.error("Erro PUT (toggle):", error);
    }
  };

  // 3. DELETE (Excluir)
  const deleteTodo = async (id) => {
    try {
        const token = await obterToken();
        const response = await fetch(`${BASE_ENDPOINT}${"/delete"}/${id}`, {
            method: 'DELETE',
              headers: {
                'Token': token
            },
        });

        // Atualiza o estado local após sucesso
        setTasks(tasks.filter((todo) => todo.id !== id));
    } catch (error) {
        console.error("Erro DELETE:", error);
    }
  };

  // 4. PUT/PATCH (Salvar Edição)
  const saveEdit = async (id, editText) => {

    const updatedText = { descricao: editText };
    try {
        const token = await obterToken();
        const response = await fetch(`${BASE_ENDPOINT}${"/put"}/${id}`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            },
            body: JSON.stringify(updatedText),
        });

        console.log("Resposta do servidor após PUT (edit):", JSON.stringify(response));

        // Atualiza o estado local após sucesso
        setTasks(
            tasks.map((todo) =>
                todo.id === id ? { ...todo, descricao: editText } : todo
            )
        );
        setEditingId(null);
        setEditText('');

    } catch (error) {
        console.error("Erro PUT (edit):", error);
    }
  };

  // Funções de UI (startEdit e filteredTasks permanecem como antes)
  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.descricao);
  };

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) {
      return tasks;
    }
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    return tasks.length > 0 ? tasks.filter((todo) =>
      todo.descricao.toLowerCase().includes(lowerCaseSearch)
    ) : [];
  }, [tasks, searchTerm]);

  // --- Componente UI (Renderização) ---

    return (

    <div className="todo-app">
      <h1>Minha Lista de Atividades (Pública)</h1>

      {/* Campo de Pesquisa */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar atividades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <hr />

      {/* Formulário de Adição */}
      <form onSubmit={addTodo} className="add-form">
        <input
          type="text"
          placeholder="Nova atividade..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
        />
        <button type="submit">Adicionar</button>
      </form>

      {isLoading ? (
        <p>Carregando atividades...</p>
      ) : (
        <ul className="todo-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${todo.completo ? 'completo' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completo}
                  onChange={() => toggleComplete(todo.id, todo.completo)} 
                />

                {editingId === todo.id ? (
                    <div className="edit-mode">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        />
                        <button className="save-btn" onClick={() => saveEdit(todo.id, editText)}>
                            Salvar
                        </button>
                        <button className="cancel-btn" onClick={() => setEditingId(null)}>
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <div className="view-mode">
                        <span className="todo-text">{todo.descricao}</span>
                        <button className="edit-btn" onClick={() => startEdit(todo)}>
                            Editar
                        </button>
                        <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
                            Excluir
                        </button>
                    </div>
                )}
              </li>
            ))
          ) : (
            <p>Nenhuma atividade encontrada.</p>
          )}
        </ul>
      )}
    </div>

    )

}

export default TodoApp;