import React from "react";
import { Project } from "../../types";
import ProjectCard from "./ProjectCard";

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onDeleteProject,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSelect={onSelectProject}
          onDelete={onDeleteProject}
        />
      ))}
    </div>
  );
};

export default ProjectList;
