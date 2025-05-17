import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Paint from "../components/Paint";

function PaintPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Drawing Board
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Use this paint tool to create diagrams, sketches, or visual notes for
          your studies.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <Paint isPage={true} />
      </div>
    </div>
  );
}

export default PaintPage;
