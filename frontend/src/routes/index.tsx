// import { useRoutes } from "react-router-dom";
// import { AdminRoutes } from "./AdminRoutes";
// import { SchedulerRoutes } from "./SchedulerRoutes";
// import { InstructorRoutes } from "./InstructorRoutes";
// import { MainRoutes } from "./MainRoutes";

// const AppRoutes = () => {
//   const isLoggedIn = localStorage.getItem("isLogin") === "true";
//   const role = localStorage.getItem("role");

//   let routes = [];

//   if (!isLoggedIn) {
//     routes = [MainRoutes()];
//   } else if (role === "Admin") {
//     routes = [AdminRoutes(isLoggedIn)];
//   } else if (role === "Scheduler") {
//     routes = [SchedulerRoutes(isLoggedIn)];
//   } else if (role === "Instructor") {
//     routes = [InstructorRoutes(isLoggedIn)];
//   }

//   return useRoutes(routes);
// };

// export default AppRoutes;
