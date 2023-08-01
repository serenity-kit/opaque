"use client";

import Button from "./Button";
import runFullFlowDemo from "./utils/demoflow";

export default function Demoflow() {
  return (
    <div className="space-x-4 flex items-center">
      <p className="text-gray-500 text-sm">
        Run full flow in-memory demo (check console.log output):
      </p>
      <Button
        size="small"
        variant="muted"
        onClick={() => {
          runFullFlowDemo();
        }}
      >
        Run Demo
      </Button>
    </div>
  );
}
