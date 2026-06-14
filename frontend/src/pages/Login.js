import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import authentication from '../SupabaseAuth';

function Login() {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleSignIn(e) {
    e.preventDefault();
    const result = await authentication.signIn(email, password);

    if(result.error) {
      console.error("Erro no login:", result.error);
      setError("Falha ao entrar. Verifique suas credenciais e tente novamente.");
      return;
    }

    if(result?.user) {
      setUser(result.user);
      navigate("/app", { replace: true });
    }
  }

  function getFriendlyErrorMessage(error) {
    if (!error) return "";    
    return error.message;
  }

  useEffect(() => {
    async function checkSession() {
      const userAuth = await authentication.getSession();
      if (userAuth?.session) {
        setUser(userAuth.session.user);
        navigate("/app", { replace: true });
      }
    }
    checkSession();
  }, [navigate]);

  return (

    <div className="login-container">
      <h2>Entrar</h2>

      <form onSubmit={handleSignIn} className="login-form">
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
          {error ? "Entrando..." : "Entrar"}
        </button>

      </form>

      {error && (
        <p className="login-error">
          {getFriendlyErrorMessage(error)}
        </p>
      )}

      <p>
        Não tem conta?
        <button
          type="button"
          onClick={() => navigate("/cadastro", { replace: true })}
          className="login-switch"
        >
          Cadastre-se
        </button>
      </p>

    </div>
  );
}

export default Login;
