import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { SignIn } from "../../services/https";
import { SignInInterface } from "../../interfaces/SignIn";

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

      const { token, role, user_id, first_name, last_name } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("first_name", first_name);
      localStorage.setItem("last_name", last_name);

      setTimeout(() => {
        if (role === "Admin") {
          navigate("/admin");
        } else if (role === "Scheduler") {
          navigate("/instructor");
        } else if (role === "Instructor") {
          navigate("/instructor");
        } else {
          messageApi.error("ไม่สามารถระบุสิทธิ์ผู้ใช้งานได้");
        }
      }, 1000);
    } else {
      messageApi.error(res.data?.error || "เข้าสู่ระบบล้มเหลว");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {contextHolder}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#09261d] mb-6">
          CPE Teaching Schedule
        </h1>

        <Form name="login-form" onFinish={onFinish} layout="vertical">
          <Form.Item
            name="UsernameID"
            label="รหัสพนักงาน"
            rules={[{ required: true, message: "กรุณากรอกรหัสพนักงาน" }]}
          >
            <Input placeholder="Username" className="h-10" />
          </Form.Item>

          <Form.Item
            name="Password"
            label="รหัสผ่าน"
            rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}
          >
            <Input.Password placeholder="Password" className="h-10" />
          </Form.Item>

          <div className="text-right mb-4">
            <a href="#" className="text-sm text-blue-500 hover:underline">
              ลืมรหัสผ่าน?
            </a>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-[#ff6314] hover:bg-orange-600 text-white font-semibold h-10 rounded-lg"
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>

        <div className="text-sm text-gray-600 mt-6 space-y-2">
          <p>
            (1) หากไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ<br />
            โทร: 0-4422-5759<br />
            อีเมล:{" "}
            <a
              href="mailto:administrator@sut.ac.th"
              className="text-blue-600 underline"
            >
              administrator@sut.ac.th
            </a>
          </p>
          <p>
            (2) กรุณากรอกอีเมลให้ถูกต้องเพื่อใช้ในกรณีลืมรหัสผ่าน
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
