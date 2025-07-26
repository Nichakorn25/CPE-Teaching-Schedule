import axios from "axios";
import {ConditionsRequestInterface} from "../../interfaces/SchedulerIn";
import {OpenCourseInterface} from "../../interfaces/OpenCourse";

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

async function postCreateConditions(data: ConditionsRequestInterface) {
  return await axios
    .post(`${apiUrl}/condition`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function putUpdateConditions(data: ConditionsRequestInterface) {
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

async function deleteConditionsByUser(userID: string) {
  return await axios
    .delete(`${apiUrl}/conditions-user/${userID}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Schedules ------------------------------//
async function getSchedulesBynameTable(nameTable: string) {
  return await axios
    .get(`${apiUrl}/schedules/${nameTable}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ OpenCourses ------------------------------//
async function upCreateOfferedCourse(id: number, data: OpenCourseInterface) {
  return await axios
    .put(`${apiUrl}/offered-courses/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function deleteOfferedCourse(id: number) {
  return await axios
    .delete(`${apiUrl}/delete-offered-courses/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


export {
  postCreateConditions,
  putUpdateConditions,
  getAllConditions,
  getConditionsByUserId,
  deleteConditionsByUser,
  getSchedulesBynameTable,
  upCreateOfferedCourse,
  deleteOfferedCourse,
};