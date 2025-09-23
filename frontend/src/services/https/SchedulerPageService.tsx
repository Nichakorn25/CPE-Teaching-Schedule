import axios from "axios";
import {
  ConditionsRequestInterface,
  ScheduleIn,
  UpdateTARequest,
} from "../../interfaces/SchedulerIn";
import { OpenCourseInterface } from "../../interfaces/OpenCourse";
import { TARequestInterface } from "../../interfaces/TAIn";

const apiUrl = "https://cpeoffice.sut.ac.th/plan/api/";
// const apiUrl = "http://localhost:8001";
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
// async function getSchedulesBynameTable(nameTable: string, majorName: string) {
//   return await axios
//     .get(`${apiUrl}/schedule`, {
//       ...requestOptions,
//       params: {
//         nameTable,
//         majorName,
//       },
//     })
//     .then((res) => res)
//     .catch((e) => e.response);
// }
async function getSchedulesBynameTable(majorName: string, year: string, term: string) {
  return await axios
    .get(`${apiUrl}/schedules`, {
      ...requestOptions,
      params: {
        major_name: majorName,
        year,
        term,
      },
    })
    .then((res) => res)
    .catch((e) => e.response);
}

async function getNameTable() {
  return await axios
    .get(`${apiUrl}/unique-nametables`, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function postAutoGenerateSchedule(
  year: number,
  term: number,
  major_name: string
) {
  return await axios
    .post(
      `${apiUrl}/auto-generate-schedule?year=${year}&term=${term}&major_name=${major_name}`,
      null,
      requestOptions
    )
    .then((res) => res)
    .catch((e) => e.response);
}

async function putupdateScheduleTime(id: number, payload: ScheduleIn) {
  return await axios
    .put(`${apiUrl}/up-schedule/${id}`, payload, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function deleteSchedulebyNametable(nameTable: String) {
  return await axios
    .delete(`${apiUrl}/delete-schedule/${nameTable}`, requestOptions)
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

async function postCreateTA(data: TARequestInterface) {
  return await axios
    .post(`${apiUrl}/assign-ta-to-schedule`, data, requestOptions)
    .then((res) => res)
    .catch((e) => e.response);
}

async function removeTeachingAssistant(sectionID: number, taID: number) {
  return await axios
    .delete(`${apiUrl}/remove-teaching-assistant/${sectionID}/${taID}`, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

async function upUpdateTeachingAssistants(sectionID: number, taIDs: number[]) {
  const data: UpdateTARequest = {
    section_id: sectionID,
    teaching_assistant_ids: taIDs,
  };

  return await axios
    .put(`${apiUrl}/update-teaching-assistants`, data, requestOptions)
    .then(res => res)
    .catch(e => e.response);
}

export {
  postCreateConditions,
  putUpdateConditions,
  getAllConditions,
  getConditionsByUserId,
  deleteConditionsByUser,
  upCreateOfferedCourse, //used
  deleteOfferedCourse, //used
  getSchedulesBynameTable,
  getNameTable, //used
  postAutoGenerateSchedule,
  putupdateScheduleTime,
  deleteSchedulebyNametable,
  postCreateTA,
  removeTeachingAssistant,
  upUpdateTeachingAssistants,
};
