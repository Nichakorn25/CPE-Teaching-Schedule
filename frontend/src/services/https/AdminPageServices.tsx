import {
  CreateCourseInteface,
  CreateCurriculumInterface,
  CreateLaboratoryInterface,
  CreateUserInterface,
} from "../../interfaces/Adminpage";
import { TeachingAssistantInterface } from "../../interfaces/TeachingAssistant";
import { OpenCourseInterface } from "../../interfaces/OpenCourse";
import { TimeFixedCoursesIn } from "../../interfaces/TimeFix";
import {UpdateFixedCourse} from "../../interfaces/UpFixedCourse";
import axios from "axios";
import { LaboratoryData } from "../../interfaces/Lab";
import { Curriculum, CreateCurriculumInput, UpdateCurriculumInput } from "../../interfaces/Curriculum";

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

async function getTypeofCourse() {
  return await axios
    .get(`${apiUrl}/course-type`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ User ------------------------------//
async function getTeachers() {
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
    .get(`${apiUrl}/teaching-assistants/${id}`, requestOptions)
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

async function putUpdateTeachingAssistant(
  id: number,
  data: TeachingAssistantInterface
) {
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

///////////////////// TimeFixedCourses /////////////////////////
async function postCreateTimeFixedCourses(data: TimeFixedCoursesIn) {
  return await axios
    .post(`${apiUrl}/offered-courses/fixed`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
async function postCreateSchduleTeachingAssistant(
  data: TeachingAssistantInterface
) {
  return await axios
    .post(`${apiUrl}/ScheduleTeachingAssistants`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


async function postCreateLaboratory(data: CreateLaboratoryInterface) {
  return await axios
    .post(`${apiUrl}/lab`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function getLaboratoryById(id: string) {
  return await axios
    .get(`${apiUrl}/lab/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


async function putUpdateLaboratory(
  id: number,
  data: LaboratoryData
) {
  try {
    const res = await axios.put(`${apiUrl}/lab/${id}`, data, requestOptions);
    return res.data;
  } catch (e: any) {
    return e.response?.data || { error: "เกิดข้อผิดพลาด" };
  }
}

async function deleteLaboratory(id: string) {
  return await axios
    .delete(`${apiUrl}/lab/${id}`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}


async function postCreateCurriculum(data: CreateCurriculumInterface) {
  return await axios
    .post(`${apiUrl}/api/v1/curricula`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

/////////////////////////////
async function putUpdateFixedCourse(
  id: number,
  data: UpdateFixedCourse
) {
  try {
    const res = await axios.put(`${apiUrl}/up-fixed/${id}`, data, requestOptions);
    return res.data;
  } catch (e: any) {
    return e.response?.data || { error: "เกิดข้อผิดพลาด" };
  }
}

async function getCurriculumById(id: string | number): Promise<Curriculum | null> {
  try {
    const res = await axios.get(`${apiUrl}/curriculum/${id}`);
    return res.data.data;
  } catch (error: any) {
    console.error("getCurriculumById error:", error.response || error.message);
    return null;
  }
}

async function createCurriculum(input: CreateCurriculumInput) {
  try {
    const res = await axios.post(`${apiUrl}/curriculum`, input);
    return res.data.data;
  } catch (error: any) {
    console.error("createCurriculum error:", error.response || error.message);
    throw error;
  }
}

async function updateCurriculum(id: string | number, input: UpdateCurriculumInput) {
  try {
    const res = await axios.put(`${apiUrl}/curriculum/${id}`, input);
    return res.data.data;
  } catch (error: any) {
    console.error("updateCurriculum error:", error.response || error.message);
    throw error;
  }
}

async function duplicateAllCourses(curriculumId: string | number) {
  try {
    const res = await axios.post(`${apiUrl}/curriculum-into-allcourse/${curriculumId}`);
    return res.data.data;
  } catch (error: any) {
    console.error("duplicateAllCourses error:", error.response || error.message);
    throw error;
  }
}


export {
  getCoursebyid, //used
  getAllCourses, //used
  postCreateCourse, //used
  putUpdateCourse, //used
  deleteCourse, //used
  getTeachers, //used
  getAllTeachers, //used
  getUserById, //used
  postCreateUser, //used
  putUpdateUser, //used
  deleteUser, //used
  getOpenCourses, //used
  postCreateOfferedCourse, //used
  getTeachingAssistantsById, //used
  getAllTeachingAssistants, //used
  postCreateTeachingAssistant, //used
  putUpdateTeachingAssistant, //used
  deleteTeachingAssistant, //used
  getTypeofCourse, //used
  postCreateTimeFixedCourses,
  postCreateSchduleTeachingAssistant,
  postCreateLaboratory,
  getLaboratoryById,
  putUpdateLaboratory,
  deleteLaboratory,
  postCreateCurriculum,
  createCurriculum,
  updateCurriculum,
  getCurriculumById,
  duplicateAllCourses,

  putUpdateFixedCourse,
};
