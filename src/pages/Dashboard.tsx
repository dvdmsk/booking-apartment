import { useAuth } from "../auth/AuthContext";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Функція для обробки повернення назад
  const handleGoBack = () => {
    navigate(-1); // navigate(-1) повертає на попередню сторінку в історії
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Система бронювання кімнат 
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                title="Повернутися на попередню сторінку"
              >
                &larr; Назад
              </button>

              <div className="text-sm text-gray-700">
                Вітаємо, {userData?.name}!
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {userData?.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}