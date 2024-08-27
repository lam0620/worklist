import React, { useState, useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useUser } from "@/context/UserContext";
import UserAvatar from "./Avatar";

interface AppLayoutProps {
  children: ReactNode;
  name?: string;
}

const AppLayout = ({ children, name }: AppLayoutProps) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
      if (user === null) {
        window.location.href = "/login";
      }
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between p-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        {user && (
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            avatarColor={user.avatar_color}
          />
        )}
      </header>
      <main className="flex-grow p-4">{children}</main>
    </div>
  );
};

export default AppLayout;
