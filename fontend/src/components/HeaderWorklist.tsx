import React, { useState, useEffect, ReactNode } from "react";
import logo from "../../public/images/custom_logo.png";
import { useUser } from "@/context/UserContext";
import UserAvatar from "../components/Avatar";
interface AppLayoutProps {
  children: ReactNode;
}

const HeaderWorklist = ({ children }: AppLayoutProps) => {
  const { user } = useUser();
  return (
    <div className="relative">
      <header className="fixed top-0 left-0 w-full h-[75px] md:h-[48px] flex justify-between items-center p-1 bg-top text-white z-50 shadow-md">
        <div className="flex items-center">
          <img src={logo.src} className="w-8 h-8 mx-1 my-1 mr-4" alt="logo" />
          <main>{children}</main>
        </div>
        <div className="mr-2">
          <div className="z-50 text-black">
            {user && (
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                avatarColor={user.avatar_color}
              />
            )}
          </div>
        </div>
      </header>
      <div className="pt-[75px] md:pt-[48px]">{children}</div>
    </div>
  );
};
export default HeaderWorklist;
