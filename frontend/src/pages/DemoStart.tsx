import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

/** Entry point for /demo: signs in as the demo player and opens the dashboard. */
export function DemoStart() {
  const { startDemo } = useAuth();
  const navigate = useNavigate();

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startDemo();
    navigate("/dashboard", { replace: true });
  }, [startDemo, navigate]);

  return (
    <div className="min-h-[calc(100dvh-3.25rem)] bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Starting the demo...</p>
    </div>
  );
}
