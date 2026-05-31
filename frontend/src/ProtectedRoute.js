import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authentication from './SupabaseAuth';

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const data = await authentication.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
    };

    loadSession();
  }, []);

  if (loading) return null;
  if (!session?.user) return <Navigate to="/" replace />;

  return children;

}

export default ProtectedRoute;