import { User, Organization } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        originalRole?: string;
        roles?: Array<{
          roleId: string;
          roleName: string;
          scopeType: string;
          scopeId: string;
        }>;
      };
      org?: Organization;
      permissions?: Array<{
        resource: string;
        action: string;
      }>;
    }
  }
}
export {};
