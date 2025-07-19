import { SignInInterface, ChangePasswordInterface } from "../../interfaces/SignIn";
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

async function ChangePassword(data: ChangePasswordInterface) {
  return await axios
    .patch(`${apiUrl}/change-password`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ 00000 ------------------------------//

export {
    SignIn, //used
    ChangePassword, //used

};
