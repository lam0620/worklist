import React from "react";
import { useState } from "react";

interface BaseButtonProps {
  buttonText: string;
  modalComponent?: React.ReactNode;
  onApiCall?: () => void;
  onSuccess?: () => void;
  onClick?: () => void;
  className?: string;
  isDisabled?: boolean;
}

const BaseButton = ({
  buttonText,
  modalComponent,
  onApiCall,
  onSuccess,
  onClick,
  className,
  isDisabled,
}: BaseButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = async () => {
    if (modalComponent) {
      setIsModalOpen(true);
    } else if (onApiCall) {
      try {
        onApiCall();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("API call failed:", error);
      }
    } else if (onClick) {
      onClick();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <button
        onClick={handleButtonClick}
        className={`bg-blue-300 text-white px-4 py-2 rounded ${className}`}
        disabled={isDisabled}
      >
        {buttonText}
      </button>
      {isModalOpen && modalComponent && (
        <>
          {React.cloneElement(modalComponent as React.ReactElement, {
            onClose: handleCloseModal,
            onSuccess,
          })}
        </>
      )}
    </div>
  );
};

export default BaseButton;
