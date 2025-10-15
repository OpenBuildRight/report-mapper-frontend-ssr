import { DefaultSession } from "next-auth";
import { Role } from "./rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: Role[];
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    id: string;
  }
}
