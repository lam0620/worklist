import React, { useState, useEffect } from "react";
import classNames from "classnames";
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

interface Action {
  id: string;
  text: string;
  value?: any;
  type: "primary" | "secondary";
  classes?: string[];
}

interface DialogProps {
  title?: string;
  text?: string;
  onClose?: () => void;
  noCloseButton?: boolean;
  actions?: Action[];
  onShow?: () => void;
  onSubmit: (params: {
    action: Action;
    value: any;
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>;
  }) => void;
  value?: any;
  className?: string;
}

const Dialog: React.FC<DialogProps> = ({
  title,
  text,
  onClose,
  noCloseButton = false,
  actions,
  onShow,
  onSubmit,
  value: defaultValue = {},
  className,
}) => {
  const [value, setValue] = useState(defaultValue);

  // Trigger `onShow` when the dialog is displayed
  useEffect(() => {
    if (onShow) {
      onShow();
    }
  }, [onShow]);

  const dialogClasses = classNames(
    "bg-gray-700 flex flex-col border-0 rounded outline-none focus:outline-none relative w-full px-[20px] pb-[20px] pt-[13px]",
    className
  );

  return (
    <div className={dialogClasses}>
      {/* Header */}
      <Header title={title} noCloseButton={noCloseButton} onClose={onClose} />
      {/* Body */}
      <Body text={text} />
      {/* Footer */}
      <Footer actions={actions} onSubmit={onSubmit} value={value} />
    </div>
  );
};

export default Dialog;
