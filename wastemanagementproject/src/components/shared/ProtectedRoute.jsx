import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import supabase from '../../lib/supabaseClient'
 // Ensure correct import

const ProtectedRoute = () => {
  const [session, setSession] = useState(undefined); // Use `undefined` instead of `null`

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div>Loading...</div>; // Prevents flashing redirects

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
