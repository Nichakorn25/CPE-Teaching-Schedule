import React from "react";
import TopBar from "../../../src/components/topbar/TopBar";

function HomePage() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <TopBar />
            <div
                className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
                style={{ backgroundImage: 'linear-gradient(rgba(10,10,10,0.2), rgba(10,10,10,0.1)),url(/sut.jpg)' }}
            >
            </div>
        </div>
    );
}
export default HomePage;