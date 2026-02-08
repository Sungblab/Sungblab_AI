import React, { useState } from "react";
import Modal from "../layout/common/Modal";
import { ProjectType } from "../../types/project";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  projectType: ProjectType;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectType,
}) => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit(projectName.trim(), description.trim());
      setProjectName("");
      setDescription("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[90vw] max-w-[350px] md:max-w-[700px] lg:max-w-[600px] mx-auto">
        <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            새 프로젝트 만들기
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                프로젝트 이름
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                  focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white
                  text-base sm:text-sm"
                placeholder="프로젝트 이름을 입력하세요"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                이 프로젝트로 어떤걸 하실 예정인가요?
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                  focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:text-white
                  text-base sm:text-sm"
                placeholder="프로젝트에 대해 간단히 설명해주세요"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-base sm:text-sm font-medium 
                  text-gray-700 dark:text-gray-300 
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  rounded-md transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!projectName.trim()}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-base sm:text-sm font-medium 
                  text-white bg-primary-600 hover:bg-primary-700 
                  rounded-md disabled:opacity-50
                  transition-colors"
              >
                만들기
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
