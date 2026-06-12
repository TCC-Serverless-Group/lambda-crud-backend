import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authentication from "./SupabaseAuth";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const userAuth = await authentication.getSession();

      setHasSession(Boolean(userAuth?.session));
      setLoading(false);
    }

    verifySession();
  }, []);

  if (loading) {
    return <p>Verificando sessão...</p>;
  }

  if (!hasSession) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;