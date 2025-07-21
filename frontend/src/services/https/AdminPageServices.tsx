import {CreateCourseInteface,CreateUserInterface,} from "../../interfaces/Adminpage";
import {TeachingAssistantInterface,} from "../../interfaces/TeachingAssistant";
import {OpenCourseInterface} from "../../interfaces/OpenCourse";
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
async function getCoursebyid(id: number) {
  return await axios
    .get(`${apiUrl}/all-courses/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

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
async function getTeachers() {  //ดึงวิชาทั้งหมดไปเลือก
  return await axios
    .get(`${apiUrl}/all-instructor`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

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

async function postCreateOfferedCourse(data: OpenCourseInterface) {
  return await axios
    .post(`${apiUrl}/offered-courses`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

///////////////////// TeachingAssistant /////////////////////////
async function getTeachingAssistantsById(id: string) {
  return await axios
    .get(`${apiUrl}/teaching_assistants/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function getAllTeachingAssistants() {
  return await axios
    .get(`${apiUrl}/all-teaching-assistants`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function postCreateTeachingAssistant(data: TeachingAssistantInterface) {
  return await axios
    .post(`${apiUrl}/create-teaching-assistants`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function putUpdateTeachingAssistant(id: number, data: TeachingAssistantInterface) {
  return await axios
    .put(`${apiUrl}/update-teaching-assistants/${id}`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function deleteTeachingAssistant(id: number) {
  return await axios
    .delete(`${apiUrl}/delete-teaching-assistants/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


export {
  getCoursebyid, //used
  getAllCourses, //used
  postCreateCourse, //used
  putUpdateCourse, //used มีปัญหาที่หน่วยกิต
  deleteCourse, //used

  getTeachers,//used
  getAllTeachers, //used
  getUserById, //used
  postCreateUser,//used
  putUpdateUser,//used
  deleteUser,//used

  getOpenCourses, //used
  postCreateOfferedCourse, 

  getTeachingAssistantsById, //used
  getAllTeachingAssistants, //used
  postCreateTeachingAssistant, //used
  putUpdateTeachingAssistant, //used
  deleteTeachingAssistant, //used

  getTypeofCourse,//used

};
