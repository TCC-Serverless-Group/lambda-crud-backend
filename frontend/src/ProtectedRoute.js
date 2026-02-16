import { Navigate } from "react-router-dom";
import authentication from './SupabaseAuth';

function ProtectedRoute({ children }) {
  const user = authentication.getSession();

  if (user.aud != 'authenticated') return <p>Carregando...</p>;

  if (user.aud == 'authenticated') return <Navigate to="/" replace />;

    console.log("ProtectedRoute: user =", user);

  return children;

}

export default ProtectedRoute;