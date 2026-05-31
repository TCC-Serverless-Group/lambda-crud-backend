import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import authentication from '../SupabaseAuth';

function Cadastro() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit (e) {
    e.preventDefault();
    setError("");
    const result = authentication.signUp(email, password);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="login-container">
      <h2>Registrar</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />

        <button type="submit" className="login-button">
          Cadastrar
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}

      <p>
        Já tem conta?
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="login-switch"
        >
          Acesse sua conta
        </button>
      </p>
    </div>
  );
}

export default Cadastro;