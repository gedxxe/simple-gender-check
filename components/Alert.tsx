
import React from 'react';
import { XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';

interface AlertProps {
  type: 'error' | 'success' | 'warning';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const baseClasses = "p-4 mb-4 text-sm rounded-lg shadow-md flex items-center";
  let typeClasses = "";
  let IconComponent: React.FC<{className?: string}> | null = null;

  switch (type) {
    case 'error':
      typeClasses = "bg-red-100 text-red-700 border border-red-300";
      IconComponent = XCircleIcon;
      break;
    case 'success':
      typeClasses = "bg-green-100 text-green-700 border border-green-300";
      IconComponent = CheckCircleIcon;
      break;
    case 'warning':
      typeClasses = "bg-yellow-100 text-yellow-700 border border-yellow-300";
      IconComponent = ExclamationTriangleIcon;
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} animate-fade-in`} role="alert">
      {IconComponent && <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />}
      <span className="flex-grow">{message}</span>
      {onClose && (
        <button
          type="button"
          className="-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 focus:ring-2"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg className="h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
