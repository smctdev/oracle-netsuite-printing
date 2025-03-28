"use client";
import { data } from "@/data/credentials";
import { fetchProfile } from "@/lib/authSanctum";
import { AuthContextType, Branch, User } from "@/types/types";
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    // const storedBranch = localStorage.getItem('branch');  && storedBranch
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const foundBranch = data.find((branch) =>
        branch.users.some((user) => user.branchCode === parsedUser.branchCode)
      );
      if (foundBranch) {
        const foundUser = foundBranch.users.find(
          (user) => user.branchCode === parsedUser.branchCode
        );
        if (foundUser) {
          setUser(foundUser);
          setBranch(foundBranch);
          setIsAuthenticated(true);
        }
      }
    }
    // const fetchProfileData = async () => {
    //   try {
    //     const response = await fetchProfile();
    //     if (response.status === 200) {
    //       console.log(response);
    //     }
    //   } catch (error) {
    //     console.error(error);
    //   }
    // };

    // fetchProfileData();
  }, []);

  const login = (foundUser: any, foundBranch: any, version: any) => {
    const { password, ...Datas } = foundUser;
    setUser(foundUser);
    setBranch(foundBranch);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(Datas));
    // localStorage.setItem('branch', JSON.stringify(foundBranch));
    localStorage.setItem("ls-app-version", version);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setBranch(null);
    localStorage.removeItem("user");
    // localStorage.removeItem('branch');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        user,
        branch,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
