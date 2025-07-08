import { Link } from "react-router-dom";

const DashboardPanel = () => {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Панель управління
          </h2>
          <p className="text-gray-600 mb-8">
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iure
            praesentium sapiente nemo aperiam quis ipsam, officia optio eligendi
            fuga. Maxime tempora obcaecati ipsa sit fugiat optio asperiores enim
            perferendis! Neque.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to={`/rooms`} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Кімнати
              </h3>
              <p className="text-gray-600">
                Управління переговорними кімнатами
              </p>
            </Link>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Бронювання
              </h3>
              <p className="text-gray-600">
                Створення та управління бронюваннями
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Користувачі
              </h3>
              <p className="text-gray-600">
                Управління користувачами та ролями
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
