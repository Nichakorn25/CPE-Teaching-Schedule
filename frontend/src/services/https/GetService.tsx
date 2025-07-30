import axios from "axios";

const apiUrl = "http://localhost:8080";
const Authorization = localStorage.getItem("token");
const Bearer = localStorage.getItem("token_type");

const requestOptions = {
  headers: {
    "Content-Type": "aaplication/json",
    Authorization: `${Bearer} ${Authorization}`,
  },
};

//------------------ Title ------------------------------//
async function getAllTitle() {
  return await axios
    .get(`${apiUrl}/all-title`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Position ------------------------------//
async function getAllPosition() {
  return await axios
    .get(`${apiUrl}/all-position`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ TypeofCourse ------------------------------//
async function getTypeofCourse() {
  return await axios
    .get(`${apiUrl}/course-type`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ TypeofCourse ------------------------------//
async function getMajorOfDepathment() {
  return await axios
    .get(`${apiUrl}/all-majors`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Roles ------------------------------//
async function getAllRoles() {
  return await axios
    .get(`${apiUrl}/all-roles`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ AcademicYears ------------------------------//
async function getAllAcademicYears() {
  return await axios
    .get(`${apiUrl}/all-academic-years`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Curriculum ------------------------------//
async function getAllCurriculum() {
  return await axios
    .get(`${apiUrl}/all-curriculum`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Laboratory ------------------------------//
async function getLaboratory() {
  return await axios
    .get(`${apiUrl}/all-laboratory`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}
//------------------ Department ------------------------------//
async function getAllDepartment() {
  return await axios
    .get(`${apiUrl}/all-department`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

//------------------ Offered ------------------------------ const data = { year, term };//
async function getOffered(params) {
  return await axios
    .get(`${apiUrl}/offered`, {
      ...requestOptions,
      params,
    })
    .then((res) => res)
    .catch((e) => e.response);
}

export {
  getAllTitle, //used
  getAllPosition, //used
  getTypeofCourse, //used
  getMajorOfDepathment, //used
  getAllRoles, //used
  getAllAcademicYears, //used
  getAllCurriculum, //used
  getLaboratory,
  getAllDepartment,
  getOffered,
};
