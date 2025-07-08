import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
// import { useAuth } from "./auth/AuthContext";
import Dashboard from "./pages/Dashboard";
import RoomManagement from "./pages/RoomManagement";
import DashboardPanel from "./components/DashboardPanel";
import { useAuth } from "./auth/AuthContext";
import Loader from "./components/Loader";
import RoomDetails from "./components/RoomDetails";
import AddRoom from "./components/AddRoom";
import Book from "./components/Book";
import EditRoom from "./components/EditRoom";
import EditBook from "./components/EditBook";

function App() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return <Loader />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
          <Route path="/" element={<Dashboard />}>
            <Route path="/dashboard" element={<DashboardPanel />} />
            <Route path="/rooms" element={<RoomManagement />}></Route>
            <Route path="/rooms/:id" element={<RoomDetails />} />
            <Route path="/rooms/add-room" element={<AddRoom />} />
            <Route path="/rooms/:id/book" element={<Book />} />
            <Route path="/bookings/:id" element={<EditBook />} />
            <Route path="/rooms/:id/edit-room" element={<EditRoom />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
