import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'custom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  customSize?: string;
  showHeader?: boolean;
  title?: string;
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
  custom: ''
};

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children,
  size = 'md',
  customSize,
  showHeader = false,
  title,
  showFooter = false,
  footerContent,
  closeOnBackdrop = true,
  showCloseButton = true
}) => {
  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleBackdropClick}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`
                transform rounded-lg bg-white dark:bg-gray-800 
                text-left align-middle shadow-xl transition-all w-full
                ${size === 'custom' && customSize ? customSize : sizeClasses[size]}
              `}>
                {/* Header */}
                {showHeader && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    {title && (
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {title}
                      </Dialog.Title>
                    )}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={showHeader || showFooter ? 'px-6 py-4' : ''}>
                  {children}
                </div>

                {/* Footer */}
                {showFooter && footerContent && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    {footerContent}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
