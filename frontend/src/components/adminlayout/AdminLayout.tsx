import { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "./index.css";
import home_1 from "../../assets/react.svg"; 

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const logout = () => {
    navigate("/");
  };

  const menuItems = [
    {
      key: "1",
      label: <Link to="/home">Home</Link>,
      icon: <img src={home_1} alt="Home" style={{ width: 24 }} />,
      visible: role === "Admin",
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="80"
        collapsed={collapsed}
        onCollapse={toggleSidebar}
        className="bg-orange-800"
      >
        <div className="text-white text-center py-4 text-lg font-bold">
          Admin Menu
        </div>
        <Menu theme="dark" mode="inline">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => (
              <Menu.Item key={item.key} icon={item.icon} className="text-white">
                {item.label}
              </Menu.Item>
            ))}
        </Menu>
      </Sider>

      <Layout>
        <Header className="flex justify-between items-center bg-orange-800 px-4 text-white">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="text-white"
          />
          <div className="text-xl font-bold">Admin Dashboard</div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            className="text-white"
          >
            Logout
          </Button>
        </Header>
        <Content className="p-4 bg-gray-100">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
