import { Request, Response } from "express";
import { TeamsService } from "./teams.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const deptId = req.query.departmentId as string;
  const list = await TeamsService.listTeams(orgId, deptId);
  return sendSuccess(res, list);
});

export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const team = await TeamsService.getTeamById(req.params.id, orgId);
  return sendSuccess(res, team);
});

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const team = await TeamsService.createTeam(orgId, req.body);
  return sendSuccess(res, team, "Team created successfully");
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const updated = await TeamsService.updateTeam(req.params.id, orgId, req.body);
  return sendSuccess(res, updated, "Team updated successfully");
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  await TeamsService.deleteTeam(req.params.id, orgId);
  return sendSuccess(res, null, "Team deleted successfully");
});
