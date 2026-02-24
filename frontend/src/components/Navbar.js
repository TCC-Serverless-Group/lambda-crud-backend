import { useLocation, useNavigate, Link } from "react-router-dom";
import authentication from '../SupabaseAuth';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authentication.signOut().then(() => console.log("Logout feito!"))
    navigate("/");
  };

  const showLogout = location.pathname === "/app";

  const showLoginCadastro = location.pathname !== "/app";

  return (
    <nav style={styles.nav}>
      <div>
        {showLoginCadastro && (
          <>
            <Link style={styles.link} to="/">Login</Link>
            <Link style={styles.link} to="/cadastro">Cadastro</Link>
          </>
        )}
      </div>
      {showLogout && (
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Deslogar
        </button>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: "#282c34",
    padding: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  link: {
    color: "white",
    marginRight: "15px",
    textDecoration: "none",
    fontSize: "18px"
  },
  logoutBtn: {
    background: "#ff5555",
    color: "white",
    border: "none",
    padding: "8px 15px",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default Navbar;
