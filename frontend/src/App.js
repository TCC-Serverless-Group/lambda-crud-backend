import './App.css'; 
import { Routes, Route } from "react-router-dom";
import TodoApp from './pages/TodoApp';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import ProtectedRoute from "./ProtectedRoute";
import Navbar from './components/Navbar';

function App() {
  console.log("App renderizou");
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/app" element={<ProtectedRoute> <TodoApp /> </ProtectedRoute>} />
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </div>
  );
}

export default App;