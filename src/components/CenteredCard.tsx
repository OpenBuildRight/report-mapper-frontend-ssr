import React from "react";

interface CenteredCardProps {
  title: string;
  children: React.ReactNode;
}

export default function CenteredCard({ title, children }: CenteredCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-100">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}
