import { Router } from "express";
import { OrgCanvasController } from "./org-canvas.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { requireFeature } from "../../middleware/feature.middleware";
import { requirePermission } from "../../middleware/permission.middleware";

const router = Router();

// Apply authentication & feature gate middleware to all Org Canvas routes
router.use(authenticate);
router.use(requireFeature("org-canvas"));

// Read Endpoints
router.get("/tree", requirePermission("employee", "read"), OrgCanvasController.getOrgTree);
router.get("/team/:teamId/members", requirePermission("employee", "read"), OrgCanvasController.getTeamMembers);
router.get("/search", requirePermission("employee", "read"), OrgCanvasController.searchNodes);

// Mutation Endpoints
router.patch("/reassign-manager", requirePermission("employee", "update"), OrgCanvasController.reassignManager);
router.patch("/reassign-department", requirePermission("employee", "update"), OrgCanvasController.reassignDepartment);
router.patch("/move-team", requirePermission("employee", "update"), OrgCanvasController.moveTeam);
router.patch("/promote-executive", requirePermission("employee", "update"), OrgCanvasController.promoteExecutive);

// Dynamic Role & Permission Management Endpoints
router.get("/roles", requirePermission("employee", "read"), OrgCanvasController.getRoles);
router.post("/roles", requirePermission("employee", "update"), OrgCanvasController.createRole);
router.put("/roles/:roleId", requirePermission("employee", "update"), OrgCanvasController.updateRole);
router.delete("/roles/:roleId", requirePermission("employee", "update"), OrgCanvasController.deleteRole);
router.patch("/assign-role", requirePermission("employee", "update"), OrgCanvasController.assignUserRole);

export default router;
