import React, { useState, useEffect, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useUser } from "@/context/UserContext";
import UserAvatar from "./Avatar";
import Link from "next/link";
import { useTranslation } from "../i18n";

interface AppLayoutProps {
  children: ReactNode;
  name?: string;
}

const AppLayout = ({ children, name }: AppLayoutProps) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("others");
      setT(() => t);
    };
    loadTranslation();
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

  const DicomUrl = "/worklist";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-between z-50">
        <h1 className="text-lg md:text-2xl font-bold ml-5">
          {name}{" "}
          {name == t("Statistics") && (
            <>
              <label>| </label>
              <Link href={DicomUrl} className="text-blue-500 cursor-pointer">
                {t("Worklist")}
              </Link>
            </>
          )}
        </h1>
        {user && (
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            avatarColor={user.avatar_color}
          />
        )}
      </header>
      <main className="flex-grow px-4 md:p-4">{children}</main>
    </div>
  );
};

export default AppLayout;
