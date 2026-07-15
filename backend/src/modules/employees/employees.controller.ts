import { Request, Response } from "express";
import { EmployeesService } from "./employees.service";
import { sendSuccess, sendPaginated } from "../../utils/response.util";
import { parsePagination } from "../../utils/pagination.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { getFileUrl } from "../../utils/upload.util";
import { AppError } from "../../utils/errors.util";

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { page, limit } = parsePagination(req.query);
  const filters = {
    departmentId: req.query.departmentId as string,
    teamId: req.query.teamId as string,
    taskAssignees: req.query.taskAssignees as string,
    status: req.query.status as any,
    search: req.query.search as string
  };

  const result = await EmployeesService.listEmployees(req.user, orgId, filters, page, limit);

  return sendPaginated(res, result.employees, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit)
  });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const result = await EmployeesService.createEmployee(orgId, req.body, actorId, req);
  return sendSuccess(res, result, "Employee profile created successfully");
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const employee = await EmployeesService.getEmployeeById(req.params.id, orgId);
  return sendSuccess(res, employee);
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  const updated = await EmployeesService.updateEmployee(req.params.id, orgId, req.body, actorId, req);
  return sendSuccess(res, updated, "Employee profile updated successfully");
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const actorId = req.user!.id;
  await EmployeesService.deleteEmployee(req.params.id, orgId, actorId, req);
  return sendSuccess(res, null, "Employee profile deleted successfully");
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const orgId = req.org!.id;
  const uploadedBy = req.user!.id;

  if (!req.file) {
    throw AppError.badRequest("No file uploaded");
  }

  const fileUrl = getFileUrl(req.file);
  const fileType = req.file.mimetype;
  const docName = req.body.name || req.file.originalname;

  const doc = await EmployeesService.uploadDocument(userId, orgId, docName, fileUrl, fileType, uploadedBy);

  return sendSuccess(res, doc, "Document uploaded successfully");
});

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const docs = await EmployeesService.listDocuments(userId);
  return sendSuccess(res, docs);
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const docId = req.params.docId;
  await EmployeesService.deleteDocument(docId, userId);
  return sendSuccess(res, null, "Document deleted successfully");
});

// Lightweight directory endpoint — accessible to ALL authenticated org members for
// calendar invitee selection, messaging, etc.
export const getDirectory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { prisma } = await import("../../config/database");
  const users = await prisma.user.findMany({
    where: { organizationId: orgId, isDeleted: false, status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      designation: true,
      avatarUrl: true,
      departmentId: true,
      systemRole: true,
      department: { select: { name: true } }
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
  });
  return sendSuccess(res, users);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const adminId = req.user!.id;
  const employeeId = req.params.id;
  const { adminPassword, newPassword } = req.body;

  if (!adminPassword || !newPassword) {
    throw AppError.badRequest("Administrator password and new employee password are required");
  }

  await EmployeesService.resetPassword(employeeId, orgId, adminId, adminPassword, newPassword, req);
  return sendSuccess(res, null, "Employee password reset successfully");
});

export const createProfileRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const result = await EmployeesService.createProfileRequest(userId, orgId, req.body, req);
  return sendSuccess(res, result, "Profile update request submitted successfully", 201);
});

export const listProfileRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const systemRole = req.user!.systemRole;
  const list = await EmployeesService.listProfileRequests(userId, orgId, systemRole);
  return sendSuccess(res, list);
});

export const approveProfileRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const requestId = req.params.id;
  const result = await EmployeesService.approveProfileRequest(requestId, orgId, reviewerId, req);
  return sendSuccess(res, result, "Profile update request approved successfully");
});

export const rejectProfileRequest = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const reviewerId = req.user!.id;
  const requestId = req.params.id;
  const { comment } = req.body;
  const result = await EmployeesService.rejectProfileRequest(requestId, orgId, reviewerId, comment, req);
  return sendSuccess(res, result, "Profile update request rejected successfully");
});

export const setHomeAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const orgId = req.org!.id;
  const { lat, lng, radius, addressLabel } = req.body;

  if (lat === undefined || lng === undefined) {
    throw AppError.badRequest("lat and lng are required");
  }

  const result = await EmployeesService.setHomeAddress(userId, orgId, parseFloat(lat), parseFloat(lng), parseInt(radius) || 200, addressLabel || "", req);
  return sendSuccess(res, result, "Home address set successfully");
});



