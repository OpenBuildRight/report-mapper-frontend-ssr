import React from "react";

interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="rounded-md bg-red-900 bg-opacity-50 p-4">
      <p className="text-sm text-red-200">{message}</p>
    </div>
  );
}
