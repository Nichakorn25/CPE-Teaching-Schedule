import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, ChangePassword } from "../../services/https/LoginServices";
import {
  SignInInterface,
  ChangePasswordInterface,
} from "../../interfaces/SignIn";
import Swal from "sweetalert2";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loginFormRef = useRef<HTMLFormElement>(null);
  const resetFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    document.body.classList.add("bg-gray-100");
    return () => {
      document.body.classList.remove("bg-gray-100");
    };
  }, []);

  ///////////////////////////// Login /////////////////////////////////
  const onFinish = async (values: SignInInterface) => {
    if (!values.Username) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสพนักงาน",
        confirmButtonColor: "#F26522",
      });
      return;
    }
    if (!values.Password) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสผ่าน",
        confirmButtonColor: "#F26522",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await SignIn(values);

      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          showConfirmButton: false,
          timer: 3000,
        });
        const {
          token,
          token_type,
          role,
          user_id,
          first_name,
          last_name,
          image,
          first_password,
          major_name,
          position,
          title,
          username,
          email,
        } = res.data;

        localStorage.setItem("isLogin", "true");
        localStorage.setItem("token", token);
        localStorage.setItem("token_type", token_type);
        localStorage.setItem("role", role);
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("first_name", first_name);
        localStorage.setItem("last_name", last_name);
        localStorage.setItem("username", username);
        localStorage.setItem("title", title);
        localStorage.setItem("position", position);
        localStorage.setItem("major_name", major_name);
        localStorage.setItem("first_password", first_password);
        localStorage.setItem("image", image);
        localStorage.setItem("email", email);

        setTimeout(() => {
          if (first_password === false) {
            navigate("/change-password");
          } else if (role === "Admin") {
            navigate("/home-dash");
          } else if (role === "Scheduler") {
            navigate("/home-dash");
          } else if (role === "Instructor") {
            navigate("/home-dash");
          } else {
            Swal.fire({
              icon: "error",
              title: "เข้าสู่ระบบไม่สำเร็จ",
              text: "ไม่สามารถระบุสิทธิ์ผู้ใช้งานได้",
              confirmButtonColor: "#F26522",
            });
          }
        }, 3000);
      } else {
        if (res.data?.error) {
          if (res.data.error.toLowerCase() === "incorrect password") {
            Swal.fire({
              icon: "error",
              title: "เข้าสู่ระบบไม่สำเร็จ",
              text: "รหัสผ่านไม่ถูกต้อง",
              confirmButtonColor: "#F26522",
            }).then(() => {
              loginFormRef.current?.reset();
            });
          } else if (res.data.error.toLowerCase() === "invalid user id") {
            Swal.fire({
              icon: "error",
              title: "เข้าสู่ระบบไม่สำเร็จ",
              text: "ไม่พบรหัสพนักงาน",
              confirmButtonColor: "#F26522",
            }).then(() => {
              loginFormRef.current?.reset();
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "เข้าสู่ระบบไม่สำเร็จ",
              text: "เข้าสู่ระบบล้มเหลว",
              confirmButtonColor: "#F26522",
            }).then(() => {
              loginFormRef.current?.reset();
            });
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "เข้าสู่ระบบไม่สำเร็จ",
            text: "เกิดข้อผิดพลาดบางประการ",
            confirmButtonColor: "#F26522",
          }).then(() => {
            loginFormRef.current?.reset();
          });
        }
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        confirmButtonColor: "#F26522",
      }).then(() => {
        loginFormRef.current?.reset();
      });
    } finally {
      setLoading(false);
    }
  };

  //////////////////// forget password /////////////////////////////////
  const handleReset = async (values: ChangePasswordInterface) => {
    setLoading(true);

    if (!values.Email) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกอีเมล",
        text: "โปรดใส่อีเมลก่อนดำเนินการ",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.Email)) {
      Swal.fire({
        icon: "warning",
        title: "อีเมลไม่ถูกต้อง",
        text: "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (!values.NewPassword) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสผ่านใหม่",
        text: "โปรดใส่รหัสผ่านใหม่ก่อนดำเนินการ",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (!values.ConfirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกยืนยันรหัสผ่าน",
        text: "โปรดยืนยันรหัสผ่านก่อนดำเนินการ",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.NewPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.NewPassword !== values.ConfirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "รหัสผ่านใหม่และยืนยันรหัสผ่านต้องตรงกัน",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    if (values.ConfirmPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "ยืนยันรหัสผ่านสั้นเกินไป",
        text: "ยืนยันรหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        confirmButtonColor: "#F26522",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await ChangePassword(values);

      if (res?.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "สำเร็จ",
          text: "รีเซ็ตรหัสผ่านสำเร็จ",
          confirmButtonColor: "#F26522",
        });
        resetFormRef.current?.reset();
        setShowReset(false);
        loginFormRef.current?.reset();
      } else if (res?.status === 404) {
        await Swal.fire({
          icon: "error",
          title: "ไม่พบผู้ใช้งาน",
          text: "ไม่พบผู้ใช้งานด้วยอีเมลนี้",
          confirmButtonColor: "#F26522",
        });
        resetFormRef.current?.reset();
      } else {
        await Swal.fire({
          icon: "error",
          title: "ผิดพลาด",
          text: res?.data?.error || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
          confirmButtonColor: "#F26522",
        });
        resetFormRef.current?.reset();
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เชื่อมต่อไม่สำเร็จ",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
        confirmButtonColor: "#F26522",
      });
      resetFormRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
        src="/login.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#5D7285]/70 backdrop-blur-lg border border-[#E7E7E7] rounded-[3rem] p-10 shadow-lg">
          <div className="text-center mb-6 leading-tight">
            <h1 className="text-4xl font-bold text-white">CPE</h1>
            <h2 className="text-xl font-semibold text-white tracking-wide">
              Teaching Schedule
            </h2>
          </div>
          {!showReset ? (
            <form
              noValidate
              ref={loginFormRef}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const values: SignInInterface = {
                  Username: formData.get("Username") as string,
                  Password: formData.get("Password") as string,
                };
                onFinish(values);
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="Username"
                  className="block text-white font-medium pl-4"
                >
                  รหัสพนักงาน
                </label>
                <input
                  type="text"
                  id="Username"
                  name="Username"
                  placeholder="🧑 username"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm 
                 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div>
                <label
                  htmlFor="Password"
                  className="block text-white font-medium pl-4"
                >
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  id="Password"
                  name="Password"
                  placeholder="🔑 password"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#F26522] text-white font-semibold rounded-full transition-transform hover:scale-105"
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-white font-semibold hover:underline"
                    onClick={() => {
                      setShowReset(true);
                      loginFormRef.current?.reset();
                    }}
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form
              ref={resetFormRef}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const values: ChangePasswordInterface = {
                  Email: formData.get("Email") as string,
                  NewPassword: formData.get("NewPassword") as string,
                  ConfirmPassword: formData.get("ConfirmPassword") as string,
                };

                if (values.NewPassword !== values.ConfirmPassword) {
                  Swal.fire({
                    icon: "warning",
                    title: "รหัสผ่านไม่ตรงกัน",
                    text: "รหัสผ่านใหม่และยืนยันรหัสผ่านต้องตรงกัน",
                    confirmButtonColor: "#F26522",
                  });
                  return;
                }

                handleReset(values);
              }}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="Email"
                  className="block text-white font-medium pl-4"
                >
                  อีเมล
                </label>
                <input
                  type="email"
                  id="Email"
                  name="Email"
                  placeholder="📧 example@g.sut.ac.th"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div>
                <label
                  htmlFor="NewPassword"
                  className="block text-white font-medium pl-4"
                >
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  id="NewPassword"
                  name="NewPassword"
                  placeholder="🔐 รหัสผ่านใหม่"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div>
                <label
                  htmlFor="ConfirmPassword"
                  className="block text-white font-medium pl-4"
                >
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  id="ConfirmPassword"
                  name="ConfirmPassword"
                  placeholder="🔐 ยืนยันรหัสผ่าน"
                  className="w-full mt-1 p-3 border border-gray-300 rounded-full text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#F26522] text-white font-semibold rounded-full transition-transform hover:scale-105"
                >
                  {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-white font-semibold hover:underline"
                    onClick={() => {
                      setShowReset(false);
                      resetFormRef.current?.reset();
                    }}
                  >
                    กลับสู่หน้าเข้าสู่ระบบ
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
