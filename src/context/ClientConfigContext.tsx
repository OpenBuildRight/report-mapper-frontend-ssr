import {RuntimeClientConfig} from "@/config/runtime-config";
import React from "react";

export const ClientConfigContext = React.createContext<RuntimeClientConfig | null>(null)