import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam
} from "./teams.controller";
import {
  createTeamSchema,
  updateTeamSchema
} from "./teams.validation";

const router = Router();

router.use(authenticate);

router.get("/", listTeams);
router.get("/:id", getTeam);
router.post("/", requirePermission("employee", "create"), validate(createTeamSchema), createTeam);
router.patch("/:id", validate(updateTeamSchema), updateTeam);
router.delete("/:id", requirePermission("employee", "delete"), deleteTeam);

export const teamsRouter = router;
