import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { SignIn } from "../../services/https";
import { SignInInterface } from "../../interfaces/SignIn";

import TopBar from "../../../src/components/topbar/TopBar";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    document.body.classList.add("bg-gray-100");
    return () => {
      document.body.classList.remove("bg-gray-100");
    };
  }, []);

  const onFinish = async (values: SignInInterface) => {
    const res = await SignIn(values);

    if (res.status === 200) {
      messageApi.success("เข้าสู่ระบบสำเร็จ");

      const { token, token_type, role, user_id, first_name, last_name } = res.data;

      localStorage.setItem("isLogin", "true");
      localStorage.setItem("token", token);
      localStorage.setItem("token_type", token_type);
      localStorage.setItem("role", role);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("first_name", first_name);
      localStorage.setItem("last_name", last_name);

      setTimeout(() => {
        if (role === "Admin") {
          navigate("/admin");
        } else if (role === "Scheduler" || role === "Instructor") {
          navigate("/instructor");
        } else {
          messageApi.error("ไม่สามารถระบุสิทธิ์ผู้ใช้งานได้");
        }
      }, 1000);
    } else {
      
      if (res.data?.error && res.data.error.toLowerCase() === "incorrect password") {
        messageApi.error("รหัสผ่านไม่ถูกต้อง");
        return;
      }

      messageApi.error(res.data?.error || "เข้าสู่ระบบล้มเหลว");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(rgba(60,60,60,0.4), rgba(60,60,60,0.3)),url(/sut.jpg)' }}
      >
        {contextHolder}
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#09261d] text-white text-center py-4">
            <h1 className="text-2xl font-bold tracking-wide">
              CPE Teaching Schedule
            </h1>
          </div>

          {/* กล่องซ้ายขวา */}
          <div className="flex flex-col md:flex-row">
            {/* ซ้ายมือเรา */}
            <div className="w-full md:w-1/2 p-8">
              <Form name="login-form" onFinish={onFinish} layout="vertical">
                <Form.Item
                  name="UsernameID"
                  label="รหัสพนักงาน"
                  rules={[{ required: true, message: "กรุณากรอกรหัสพนักงาน" }]}
                >
                  <Input placeholder="username" className="h-10" />
                </Form.Item>

                <Form.Item
                  name="Password"
                  label="รหัสผ่าน"
                  rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
                >
                  <Input.Password placeholder="password" className="h-10" />
                </Form.Item>

                <Form.Item>
                  <button
                    type="submit"
                    className="w-full h-12 bg-[#ff6314] hover:bg-orange-600 text-white text-sm font-medium rounded-md transition transform hover:scale-105"
                  >
                    เข้าสู่ระบบ
                  </button>
                </Form.Item>
              </Form>
            </div>

            {/* ขวามือเรา */}
            <div className="w-full md:w-1/2 p-8 border-t md:border-t-0 md:border-l border-gray-200 text-sm text-gray-700">
              <p className="mb-4">
                (1) If you can not log-in, <br />
                please contact the administrator<br />
                Tel: 0-4422-5759<br />
                Email:{" "}
                <a
                  href="mailto:administrator@sut.ac.th"
                  className="text-blue-600 underline"
                >
                  administrator@sut.ac.th
                </a>
              </p>
              <p className="mb-4">
                (2) Please enter your email address correctly to auto-reply in case you forgot your password
              </p>
              <Link
                to="/forgot-password"
                className="text-blue-600 text-sm font-semibold hover:underline"
              >
                Forgotten your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
