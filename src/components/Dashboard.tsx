// Dashboard removed per user request; provide a minimal placeholder to keep routing stable.
import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 bg-card border border-input rounded-2xl shadow-card">
      <h3 className="text-lg font-semibold">Dashboard</h3>
      <p className="text-sm text-muted-foreground mt-2">This page has been cleared.</p>
    </div>
  );
};

export default Dashboard;
