import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import authentication from '../SupabaseAuth';

function Login() {

  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { usuario, error } = authentication.getSession();

  function handleSignIn(e) {
    e.preventDefault();
    const result = authentication.signIn(email, password);
    if (result.usuario) {
      setUser(result.usuario);
      navigate("/app", { replace: true });
    }
    console.error("Erro no login:", result.error);
  }

  function getFriendlyErrorMessage(error) {
    if (!error) return "";    
    return error.message;
  }

  useEffect(() => {
    async function checkSession() {
      const  userAuth = authentication.getSession();
      if (userAuth) {
        setUser(userAuth);
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
