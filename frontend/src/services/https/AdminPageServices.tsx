import {CreateCourseInteface,CreateUserInterface,} from "../../interfaces/Adminpage";
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

//------------------ Courses ------------------------------//
async function getAllCourses() {
  return await axios
    .get(`${apiUrl}/all-courses`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function postCreateCourse(data: CreateCourseInteface) {
  return await axios
    .post(`${apiUrl}/courses`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function putUpdateCourse(id: number, data: CreateCourseInteface) {
  return await axios
    .put(`${apiUrl}/update-courses/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function deleteCourse(id: number) {
  return await axios
    .delete(`${apiUrl}/delete-courses/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function getTypeofCourse() {   //////////////////////ย้ายไป GetService นะ
  return await axios
    .get(`${apiUrl}/course-type`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ User ------------------------------//
async function getAllTeachers() {
  return await axios
    .get(`${apiUrl}/all-teachers`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function getUserById(id: string) {
  return await axios
    .get(`${apiUrl}/users/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function postCreateUser(data: CreateUserInterface) {
  return await axios
    .post(`${apiUrl}/users`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function putUpdateUser(id: number, data: CreateUserInterface) {
  return await axios
    .put(`${apiUrl}/update-users/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function deleteUser(id: number) {
  return await axios
    .delete(`${apiUrl}/delete-users/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ OpenCourses ------------------------------//
async function getOpenCourses() {
  return await axios
    .get(`${apiUrl}/open-courses`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


export {
  getAllCourses,
  postCreateCourse,
  putUpdateCourse,
  deleteCourse,

  getAllTeachers,
  getUserById,
  postCreateUser,
  putUpdateUser,
  deleteUser,

  getOpenCourses,

  getTypeofCourse,

};
