import React, { useState, useEffect } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";

import Footer from "./Footer";
import Body from "./Body";
import Header from "./Header";

interface Action {
  id: string;
  text: string;
  value?: any;
  type: "primary" | "secondary" | "cancel";
}

interface DialogProps {
  title?: string;
  text?: string;
  onClose?: () => void;
  noCloseButton?: boolean;
  actions: Action[];
  onShow?: () => void;
  onSubmit: ({
    action,
    value,
    event,
  }: {
    action: Action;
    value: any;
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>;
  }) => void;
  header?: React.ComponentType<any>;
  body?: React.ComponentType<any>;
  footer?: React.ComponentType<any>;
  value?: any;
}

const Dialog: React.FC<DialogProps> = ({
  title,
  text,
  onClose,
  noCloseButton = false,
  actions,
  onShow,
  onSubmit,
  header: HeaderComponent = Header,
  body: BodyComponent = Body,
  footer: FooterComponent = Footer,
  value: defaultValue = {},
}) => {
  const [value, setValue] = useState(defaultValue);

  const theme = "bg-gray-700";
  const flex = "flex flex-col";
  const border = "border-0 rounded";
  const outline = "outline-none focus:outline-none";
  const position = "relative";
  const width = "w-full";
  const padding = "px-[20px] pb-[20px] pt-[13px]";

  useEffect(() => {
    if (onShow) {
      onShow();
    }
  }, [onShow]);

  return (
    <div
      className={classNames(
        theme,
        flex,
        border,
        outline,
        position,
        width,
        padding
      )}
    >
      <HeaderComponent
        title={title}
        noCloseButton={noCloseButton}
        onClose={onClose}
        value={value}
        setValue={setValue}
      />
      <BodyComponent text={text} value={value} setValue={setValue} />
      <FooterComponent
        actions={actions}
        onSubmit={onSubmit}
        value={value}
        setValue={setValue}
      />
    </div>
  );
};

Dialog.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
  onClose: PropTypes.any,
  noCloseButton: PropTypes.bool,
  header: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  body: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  footer: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onSubmit: PropTypes.func.isRequired,
  value: PropTypes.object,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      value: PropTypes.any,
      type: PropTypes.oneOf(["primary", "secondary", "cancel"]).isRequired,
    }).isRequired
  ).isRequired,
  onShow: PropTypes.func,
};

export default Dialog;
