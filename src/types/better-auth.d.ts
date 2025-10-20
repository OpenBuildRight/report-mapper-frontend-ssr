import { type Role } from "./rbac";

declare module "better-auth/types" {
  interface Session {
    user: User & {
      roles: Role[];
    };
  }

  interface User {
    roles: Role[];
  }
}
