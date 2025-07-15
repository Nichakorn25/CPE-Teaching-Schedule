import React from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/header/Header";
import "./Homepage.css";

const Homepage: React.FC = () => {
    return (
        <div className="p-6 font-sarabun mt-16">
            <Header />
            
            {/* Background Layer */}
            <div className="homepage-background" />
            
            {/* Sidebar */}
            <div className="homepage-sidebar">
                <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="homepage-main-content">
                {/* Welcome Image */}
                <img 
                    src="/src/assets/Welcome.png"
                    alt="Welcome"
                    className="homepage-welcome-image"
                />
            </div>
        </div>
    );
};

export default Homepage;