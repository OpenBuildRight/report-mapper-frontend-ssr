import React from "react";
import {AuthClientType} from "@/lib/auth-client";

export const AuthClientContext = React.createContext<AuthClientType | null>(null);