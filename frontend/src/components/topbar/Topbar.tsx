import React from 'react';

interface User {
  name: string;
  avatarUrl: string;
}

const Topbar: React.FC<{
  user?: User;
  onLogin?: () => void;
  onLogout?: () => void;
}> = ({ user, onLogin, onLogout }) => {
  return (
    <div className="w-full h-16 bg-white shadow-md fixed top-0 left-0 flex items-center justify-between px-4 z-50">
      <div className="flex items-center">
        {!user ? (
          <button
            onClick={onLogin}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            เข้าสู่ระบบ
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <img
              src={user.avatarUrl}
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{user.name}</span>
            <button
              onClick={onLogout}
              className="ml-2 text-xs text-gray-500 hover:text-red-500 transition"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-10 object-contain"
        />
      </div>
    </div>
  );
};

export default Topbar;
