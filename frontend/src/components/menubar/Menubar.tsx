import React from "react";

const MenuBar = () => {
  const role = localStorage.getItem("role");

  const menuByRole: Record<string, string[]> = {
    User: ["เมนู 1", "เมนู 2", "เมนู 3"],
    Seller: ["เมนู 4", "เมนู 5", "เมนู 6"],
    Admin: ["เมนู 4", "เมนู 5", "เมนู 6", "เมนู 7", "เมนู 8"],
  };

  const menus = menuByRole[role || "User"];

  return (
    <div className="menu-bar">
      <ul>
        {menus.map((menu, index) => (
          <li key={index}>{menu}</li>
        ))}
      </ul>
    </div>
  );
};

export default MenuBar;
