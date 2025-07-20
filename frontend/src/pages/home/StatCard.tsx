import React from "react";

interface StatCardProps {
  title: string;
  value: number;
  growth: string;
  icon: React.ReactNode;
  accent: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  growth,
  icon,
  accent,
  color,
}) => {
  return (
    <div className={`stat-card ${accent}`}>
      <div className="stat-card-inner">
        <div>
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value.toLocaleString()}</h3>
          <p
            className={`stat-growth ${
              growth.startsWith("+") ? "positive" : "negative"
            }`}
          >
            {growth} จากเดือนที่แล้ว
          </p>
        </div>
        <div className={`stat-icon ${color}`}>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
