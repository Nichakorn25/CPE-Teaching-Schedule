import {ConditionInterface,} from "../../interfaces/SchedulerIn";
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

//------------------ Conditions ------------------------------//

async function postCreateConditions(data: ConditionInterface) {
  return await axios
    .post(`${apiUrl}/condition`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function putUpdateConditions(data: ConditionInterface) {
  return await axios
    .put(`${apiUrl}/update-conditions`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function getAllConditions() {
  return await axios
    .get(`${apiUrl}/conditions`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


async function getConditionsByUserId(userID: string) {
  return await axios
    .get(`${apiUrl}/conditions/user/${userID}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}



export {
  postCreateConditions,
  putUpdateConditions,
  getAllConditions,
  getConditionsByUserId,

};
