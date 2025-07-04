import React, { useState, useEffect} from "react";
import { OfferedCourseInterface } from "../../interfaces/Adminpage";
import { getOpenCourses } from "../../services/https/AdminPageServices";

const TestHome: React.FC = () => {
    const [test, setOpenCourses] = useState<OfferedCourseInterface[]>([]);

    const getcustomers = async () => {
        let res = await getOpenCourses();
        console.log("sdfghjkl;", res.data);
        if (res) {
            setOpenCourses(res.data);
        }
    };

    useEffect(() => {
    getcustomers();
  }, []);

    return (
        <div>
            <h1>ยินดีต้อนรับสู่หน้าแรก</h1>
        </div>
    );
};

export default TestHome;