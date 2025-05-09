import { SignInInterface } from "../../interfaces/SignIn";
import { ChangePassInterface} from "../../interfaces/ChangePass";
import axios from "axios";

const apiUrl = "http://localhost:8080";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {

  headers: {
    "Content-Type": "application/json",
    Authorization: `${Bearer} ${Authorization}`,
  },

};

//------------------ login ------------------------------//

async function SignIn(data: SignInInterface) {

  return await axios

    .post(`${apiUrl}/signin`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);

}

//------------------ Password ------------------------------//

async function GetAllChangePassword() {

  return await axios

    .get(`${apiUrl}/get-all-change-password`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);

}

async function GetChangePasswordByUsernameID(id: string) {

  return await axios

    .get(`${apiUrl}/getbyid-change-password${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);

}


async function ChangePass(data: ChangePassInterface) {

  return await axios

    .post(`${apiUrl}/create-password`, data, requestOptions)  //สร้างคำร้องถึงแอดมิน
    .then((res) => res)
    .catch((e) => e.response);

}

async function NewPass(id: number) {
  return await axios

    .post(`${apiUrl}/change-password`,{id}, requestOptions)  //เปลี่ยนรหัส
    .then((res) => res)
    .catch((e) => e.response);

}

//------------------ 00000 ------------------------------//

export {
    SignIn,
    //ข้างล่าง ยังไม่แก้
    GetAllChangePassword,
    GetChangePasswordByUsernameID,
    ChangePass,
    NewPass,

};
