"use client";
import { HealthStatus } from "@/component/health-status";

export default function HealthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <h1 className="font-outfit text-2xl font-bold text-primary mb-4 text-center">
          Status API
        </h1>
        <HealthStatus />
      </div>
    </div>
  );
}
