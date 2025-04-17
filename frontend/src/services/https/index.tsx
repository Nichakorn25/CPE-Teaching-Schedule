import { SignInInterface } from "../../interfaces/SignIn";
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


async function SignIn(data: SignInInterface) {

  return await axios

    .post(`${apiUrl}/signin`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);

}

async function ForgottenPassword(email: string, newPassword: string) {
  try {
    const token = localStorage.getItem('token');
    console.log(token);
    const response = await axios.post(`${apiUrl}/employee/change-password`, {
      Email: email,
      NewPassword: newPassword,
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${Bearer} ${Authorization}`,
      }
    });
    return response.data;
  } catch (error: any) {
    return error.response ? error.response.data : { error: "An unknown error occurred" };
  }
}

export {
    SignIn,
    ForgottenPassword,
};
