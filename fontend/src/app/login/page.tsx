"use client";

import { useState } from "react";
import { useRouter, redirect } from "next/navigation";
import { ClipLoader } from "react-spinners";
import * as Toast from "@radix-ui/react-toast";
import Head from "next/head";
import { useUser } from "@/context/UserContext";
import { Login } from "@/services/apiService";
import { PERMISSIONS } from "@/utils/constant";

import backgroundImage from "../../../public/images/login_bg.jpg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { user, login, logout } = useUser();

  const hasViewStatisticsPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_STATISTICS) ||
    user?.is_superuser;

  const redirectUrl = (username:string) => {
    //if (username === 'root' || username === 'admin') {
    if (hasViewStatisticsPermission) {
      // router.push("/home");
      redirect("/home");
    } else {
      const currentUrl = new URL(`${process.env.NEXT_PUBLIC_DICOM_VIEWER_URL}`);
      const urlParams = new URLSearchParams(currentUrl.search);

      const formattedDate = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000))
                            .toISOString().slice(0, 10).replace(/-/g, "");
      urlParams.set('startDate', formattedDate);

      // router.push(currentUrl.toString());
      redirect(currentUrl.toString());
    }
  }

  // If already logged in, rediect to /home
  if (user) {
    redirectUrl(user.username);
  }

    
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Login...');
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

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div style= {{
                    backgroundImage: `url(${backgroundImage.src})`,
                    backgroundSize: 'cover',
                    opacity: 1
                }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="p-8 rounded shadow-md w-full max-w-md" style={{backgroundColor: '#323237',color:'#d0d0d0' }}>
          <h1 className="text-3xl font-bold mb-6 text-center"></h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              {/* <label className="mb-2 font-medium">Username</label> */}
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
                style={{backgroundColor: '#27272b'}}
              />
            </div>
            <div className="flex flex-col">
              {/* <label className="mb-2 font-medium">Password</label> */}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
                style={{backgroundColor: '#27272b'}}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 font-bold rounded p-3 w-full flex items-center justify-center"
              disabled={isLoading}
              style={{backgroundColor: '#fe615a'}}
            >
              {isLoading ? <ClipLoader color="white" size={24} /> : "LOGIN"}
            </button>
          </form>
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
