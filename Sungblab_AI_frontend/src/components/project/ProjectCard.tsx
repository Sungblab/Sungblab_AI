import React from "react";
import { Project } from "../../types";
import { formatDate } from "../../utils/helpers";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onSelect(project)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {project.name}
        </h3>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {project.type === "general"
          ? "챗봇"
          : project.type === "assignment"
          ? "수행평가 도우미"
          : "생기부 도우미"}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        마지막 수정: {formatDate(project.updatedAt)}
      </p>
    </div>
  );
};

export default ProjectCard;
