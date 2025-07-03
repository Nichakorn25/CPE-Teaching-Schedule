import React from "react";
import Sidebar from "../../../components/schedule-sidebar/Sidebar";
import Header from "../../../components/schedule-header/Header";
import "./Homepage.css";

const Homepage: React.FC = () => {
    return (
        <>
            {/* Background Layer */}
            <div className="homepage-background" />
            
            {/* Sidebar */}
            <div className="homepage-sidebar">
                <Sidebar />
            </div>
            
            {/* Main Content */}
            <div className="homepage-main-content">
                {/* Header */}
                <div className="homepage-header">
                    <Header />
                </div>
                
                {/* Welcome Image */}
                <img 
                    src="/src/assets/Welcome.png"
                    alt="Welcome"
                    className="homepage-welcome-image"
                />
            </div>
        </>
    );
};

export default Homepage;