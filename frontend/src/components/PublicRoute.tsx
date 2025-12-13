import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { JSX } from "react";

export const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return children;
};
