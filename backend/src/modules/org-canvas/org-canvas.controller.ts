import { Request, Response, NextFunction } from "express";
import { OrgCanvasService } from "./org-canvas.service";
import {
  reassignManagerSchema,
  reassignDepartmentSchema,
  moveTeamSchema,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  searchQuerySchema
} from "./org-canvas.validation";

export class OrgCanvasController {
  static async getOrgTree(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const data = await OrgCanvasService.getOrgTree(orgId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTeamMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const { teamId } = req.params;
      const members = await OrgCanvasService.getTeamMembers(orgId, teamId);
      res.json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  }

  static async searchNodes(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const { q } = searchQuerySchema.parse(req.query);
      const results = await OrgCanvasService.searchNodes(orgId, q);
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  static async reassignManager(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const body = reassignManagerSchema.parse(req.body);
      const result = await OrgCanvasService.reassignManager(
        orgId,
        actorId,
        body.userId,
        body.newManagerId
      );
      res.json({ success: true, data: result, message: "Manager reassigned successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async reassignDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const body = reassignDepartmentSchema.parse(req.body);
      const result = await OrgCanvasService.reassignDepartment(
        orgId,
        actorId,
        body.userId,
        body.newDepartmentId,
        body.newTeamId
      );
      res.json({ success: true, data: result, message: "Department reassigned successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async moveTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const body = moveTeamSchema.parse(req.body);
      const result = await OrgCanvasService.moveTeam(
        orgId,
        actorId,
        body.teamId,
        body.newDepartmentId
      );
      res.json({ success: true, data: result, message: "Team moved successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const roles = await OrgCanvasService.getRoles(orgId);
      res.json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const body = createRoleSchema.parse(req.body);
      const role = await OrgCanvasService.createRole(orgId, actorId, body);
      res.status(201).json({ success: true, data: role, message: "Role created successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const { roleId } = req.params;
      const body = updateRoleSchema.parse(req.body);
      const role = await OrgCanvasService.updateRole(orgId, actorId, roleId, body);
      res.json({ success: true, data: role, message: "Role permissions updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const { roleId } = req.params;
      const result = await OrgCanvasService.deleteRole(orgId, actorId, roleId);
      res.json({ success: true, data: result, message: "Role deleted successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async assignUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.org!.id;
      const actorId = req.user!.id;
      const body = assignRoleSchema.parse(req.body);
      const result = await OrgCanvasService.assignUserRole(
        orgId,
        actorId,
        body.userId,
        body.roleId,
        body.action
      );
      res.json({ success: true, data: result, message: `Role ${body.action === 'add' ? 'assigned' : 'removed'} successfully` });
    } catch (err) {
      next(err);
    }
  }
}
