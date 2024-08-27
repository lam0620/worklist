import React, { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useUser } from "@/context/UserContext";

const withLoading = (WrappedComponent: React.ComponentType) => {
  // eslint-disable-next-line react/display-name
  return () => {
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

    return <WrappedComponent />;
  };
};

export default withLoading;
