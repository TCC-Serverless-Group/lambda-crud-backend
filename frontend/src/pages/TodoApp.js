import React, { useState, useEffect, useMemo } from 'react';
import authentication from '../SupabaseAuth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const BASE_ENDPOINT = API_BASE_URL+"/tasks";

function TodoApp () {
  // --- Estados ---
  const [tasks, setTasks] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [editText, setEditText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const obterToken = () => authentication.getSession() ? authentication.getSession().session.access_token : '';
  // --- Função principal para carregar as atividades (GET) ---
  const fetchTasks = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(BASE_ENDPOINT+"/list", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Token': obterToken()
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao buscar atividades`);
      }

      const data = await response.json();
      setTasks(JSON.parse(data.body)); 

    } catch (error) {
      console.error("Erro ao carregar To-Dos:", error);
    } finally {
      setIsLoading(false);
      setTasks([]); // Limpa a lista em caso de erro para evitar exibir dados antigos
    }
  };

  // Carrega a lista ao iniciar o componente
  useEffect(() => {
    fetchTasks();
  });

  // --- Funções de Manipulação (CRUD) ---

  // 1. POST (Adicionar)
  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo = { descricao: newTodoText.trim(), completed: false };

    try {
      const response = await fetch(BASE_ENDPOINT+"/save", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': obterToken()
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar atividade.');
      }

      const addedTodo = await response.json();
      const parsedBody = typeof addedTodo.body === 'string'
      ? JSON.parse(addedTodo.body)
      : addedTodo.body;
      setTasks([...tasks, parsedBody]); 
      setNewTodoText('');

    } catch (error) {
      console.error("Erro POST:", error);
    }
  };

  // 2. PUT/PATCH (Marcar como Feito)
  const toggleComplete = async (id, currentCompleted) => {
    const updatedStatus = { completed: !currentCompleted };

    try {
        const response = await fetch(`${BASE_ENDPOINT}${"/put"}/${id}`, {
            method: 'PUT', // Ou 'PATCH'
            headers: {
                'Content-Type': 'application/json',
                'Token': obterToken()
            },
            body: JSON.stringify(updatedStatus),
        });

        if (!response.ok) {
            throw new Error('Falha ao atualizar o status.');
        }

        // Atualiza o estado local após sucesso
        setTasks(
            tasks.map((todo) =>
                todo.id === id ? { ...todo, completed: !currentCompleted } : todo
            )
        );
    } catch (error) {
        console.error("Erro PUT (toggle):", error);
    }
  };

  // 3. DELETE (Excluir)
  const deleteTodo = async (id) => {
    try {
        const response = await fetch(`${BASE_ENDPOINT}${"/delete"}/${id}`, {
            method: 'DELETE',
              headers: {
                'Token': obterToken()
            },
        });

        if (!response.ok) {
            throw new Error('Falha ao excluir atividade.');
        }

        // Atualiza o estado local após sucesso
        setTasks(tasks.filter((todo) => todo.id !== id));
    } catch (error) {
        console.error("Erro DELETE:", error);
    }
  };

  // 4. PUT/PATCH (Salvar Edição)
  const saveEdit = async (id) => {
    if (!editText.trim()) {
      deleteTodo(id); 
      return;
    }

    const updatedText = { text: editText.trim() };

    try {
        const response = await fetch(`${BASE_ENDPOINT}${"/put"}/${id}`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Token': obterToken()
            },
            body: JSON.stringify(updatedText),
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar edição.');
        }

        // Atualiza o estado local após sucesso
        setTasks(
            tasks.map((todo) =>
                todo.id === id ? { ...todo, text: editText.trim() } : todo
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
    setEditText(todo.text);
  };

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) {
      return tasks;
    }
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    return tasks.filter((todo) =>
      todo.text.toLowerCase().includes(lowerCaseSearch)
    );
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
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id, todo.completed)} 
                />

                {editingId === todo.id ? (
                    <div className="edit-mode">
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        />
                        <button className="save-btn" onClick={() => saveEdit(todo.id)}>
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