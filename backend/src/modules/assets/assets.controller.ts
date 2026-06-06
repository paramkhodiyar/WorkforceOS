import { Request, Response } from "express";
import { AssetsService } from "./assets.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";

export const listAssets = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const filters = {
    category: req.query.category as string,
    status: req.query.status as any
  };

  const assets = await AssetsService.listAssets(orgId, filters);
  return sendSuccess(res, assets);
});

export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const asset = await AssetsService.createAsset(orgId, req.body, actorId, req);
  return sendSuccess(res, asset, "Asset record created successfully");
});

export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await AssetsService.updateAsset(req.params.id, orgId, req.body, actorId, req);
  return sendSuccess(res, updated, "Asset details updated successfully");
});

export const assignAsset = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { userId, notes } = req.body;
  const assignment = await AssetsService.assignAsset(req.params.id, orgId, userId, notes, actorId, req);
  return sendSuccess(res, assignment, "Asset assigned successfully");
});

export const returnAsset = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const { condition } = req.body;
  const updated = await AssetsService.returnAsset(req.params.id, orgId, condition, actorId, req);
  return sendSuccess(res, updated, "Asset return processed successfully");
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const history = await AssetsService.getHistory(req.params.id, orgId);
  return sendSuccess(res, history);
});

export const getEmployeeAssets = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const userId = req.params.id;
  const list = await AssetsService.getEmployeeAssets(userId, orgId);
  return sendSuccess(res, list);
});
