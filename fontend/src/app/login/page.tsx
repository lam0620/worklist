"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { ClipLoader } from "react-spinners";
import * as Toast from "@radix-ui/react-toast";
import Head from "next/head";
import { useUser } from "@/context/UserContext";
import { Login } from "@/services/apiService";
import { PERMISSIONS } from "@/utils/constant";
import backgroundImage from "../../../public/images/login_bg.jpg";
import "../../../node_modules/flag-icons/css/flag-icons.min.css";
import i18next, { i18n } from "i18next";
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { user, login, logout } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState("vi");
  const [isOpen, setIsOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Login");

  const hasViewStatisticsPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_STATISTICS) ||
    user?.is_superuser;

  const redirectUrl = (username: string) => {
    //if (username === 'root' || username === 'admin') {
    if (hasViewStatisticsPermission) {
      // router.push("/home");
      redirect("/home");
    } else {
      const currentUrl = new URL(`${process.env.NEXT_PUBLIC_DICOM_VIEWER_URL}`);
      const urlParams = new URLSearchParams(currentUrl.search);

      const formattedDate = new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      urlParams.set("startDate", formattedDate);

      // router.push(currentUrl.toString());
      redirect(currentUrl.toString());
    }
  };

  // If already logged in, rediect to /home
  if (user) {
    redirectUrl(user.username);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Login...");
      const response = await Login({ username, password });
      if (response.status === 200) {
        const { access_token, refresh_token } = response.data?.data;
        logout();
        login(access_token, refresh_token);

        // router.push("/home");

        redirectUrl(user.username);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setToastMessage("Incorrect username or password");
      } else {
        setToastMessage("Login failed");
      }
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let savedLanguage = localStorage.getItem("language");
    if (!savedLanguage) {
      savedLanguage = "vi";
    }
    setLanguage(savedLanguage);
    localStorage.setItem("language", savedLanguage);
    updatePageTitle(savedLanguage);
    //i18next.changeLanguage(savedLanguage);
  }, []);

  const handleChangeLanguage = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    localStorage.setItem("language", selectedLanguage);
    updatePageTitle(selectedLanguage);
    setIsOpen(false);
  };

  const flagCode = (lang: string) => {
    switch (lang) {
      case "en":
        return "gb";
      case "vi":
        return "vn";
      case "jp":
        return "jp";
      default:
        return "gb";
    }
  };
  const updatePageTitle = (lang: string) => {
    switch (lang) {
      case "vi":
        setPageTitle("Đăng nhập");
        break;
      case "jp":
        setPageTitle("ログイン");
        break;
      case "en":
      default:
        setPageTitle("Login");
        break;
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "cover",
          opacity: 1,
        }}
        className="flex flex-col items-center justify-center min-h-screen bg-white px-4"
      >
        <div
          className="px-14 pt-16 pb-6 rounded shadow-md w-full max-w-lg relative"
          style={{ backgroundColor: "#323237", color: "#d0d0d0" }}
        >
          {/* <h1 className="text-3xl font-bold mb-6 text-center">{pageTitle}</h1> */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
                style={{ backgroundColor: "#27272b" }}
              />
            </div>
            <div className="flex flex-col">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
                  style={{ backgroundColor: "#27272b" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <svg
                      width="20px"
                      height="20px"
                      viewBox="0 0 24 24"
                      fill="#ffff"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                        stroke="#ffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20px"
                      height="20px"
                      viewBox="0 0 24 24"
                      fill="#ffff"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
                        stroke="#1C274C"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                        stroke="#1C274C"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-500 font-bold rounded p-3 w-full flex items-center justify-center"
              disabled={isLoading}
              style={{ backgroundColor: "#fe615a" }}
            >
              {isLoading ? <ClipLoader color="white" size={24} /> : pageTitle}
            </button>
          </form>

          {/* Select language         */}
          <div className="pt-8 flex justify-center">
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="items-center inline-flex justify-center whitespace-nowrap w-32 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span
                  className={`fi fis fi-${flagCode(language)} rounded-full`}
                  style={{
                    display: "inline-block",
                    width: "20px",
                    height: "20px",
                    overflow: "hidden",
                    border: "1px solid black",
                    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
                    borderRadius: "50%",
                    marginRight: "4px",
                  }}
                />
                {language === "en"
                  ? "English"
                  : language === "vi"
                  ? "Tiếng Việt"
                  : "日本語"}
              </button>
              {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1 grid grid-cols-1 gap-2" role="none">
                    <button
                      onClick={() => handleChangeLanguage("en")}
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-900 text-white"
                    >
                      <span
                        className="fi fis fi-gb mr-2"
                        style={{
                          display: "inline-block",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: "1px solid black",
                          overflow: "hidden",
                          boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      English
                    </button>
                    <button
                      onClick={() => handleChangeLanguage("vi")}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-900"
                    >
                      <span
                        className="fi fis fi-vn rounded-full"
                        style={{
                          display: "inline-block",
                          width: "20px",
                          height: "20px",
                          overflow: "hidden",
                          border: "1px solid black",
                          boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
                          borderRadius: "50%",
                          marginRight: "4px",
                        }}
                      />
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => handleChangeLanguage("jp")}
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-gray-900"
                    >
                      <span
                        className="fi fis fi-jp mr-2"
                        style={{
                          display: "inline-block",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: "1px solid black",
                          overflow: "hidden",
                          boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      日本語
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Toast.Provider>
          <Toast.Root
            open={open}
            onOpenChange={setOpen}
            className="bg-red-500 text-white p-3 rounded shadow-lg"
          >
            <Toast.Title>{toastMessage}</Toast.Title>
          </Toast.Root>
          <Toast.Viewport className="fixed top-0 right-0 p-6 z-50" />
        </Toast.Provider>
      </div>
    </>
  );
};

export default LoginPage;
