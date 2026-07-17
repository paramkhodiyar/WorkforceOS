import { Request, Response } from "express";
import { OrganizationService } from "./organization.service";
import { sendSuccess } from "../../utils/response.util";
import { asyncHandler } from "../../utils/asyncHandler.util";
import { AppError } from "../../utils/errors.util";
import { prisma } from "../../config/database";

export const getOrgMetadata = asyncHandler(async (req: Request, res: Response) => {
  const org = await OrganizationService.getById(req.org!.id);
  if (!org) {
    throw AppError.notFound("Organization not found");
  }
  return sendSuccess(res, org);
});

export const getOrgBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const org = await OrganizationService.getBySlug(slug);
  if (!org) {
    throw AppError.notFound("Organization not found");
  }
  return sendSuccess(res, org);
});

export const updateOrgFeatures = asyncHandler(async (req: Request, res: Response) => {
  if (
    req.user!.systemRole !== "SYS_OWNER" &&
    req.user!.systemRole !== "SUPER_ADMIN" &&
    req.user!.systemRole !== "ORG_ADMIN" &&
    req.user!.originalRole !== "SYS_OWNER"
  ) {
    throw AppError.forbidden("Only organization administrators are authorized to configure features");
  }

  const { orgId } = req.params;

  if (req.user!.systemRole === "ORG_ADMIN" && req.user!.organizationId !== orgId && req.user!.originalRole !== "SYS_OWNER") {
    throw AppError.forbidden("You can only configure features for your own organization");
  }

  const { enabledFeatures } = req.body;

  const updated = await OrganizationService.updateFeatures(orgId, enabledFeatures, req.user!.id, req);
  return sendSuccess(res, updated, "Organization features configured successfully");
});

export const updateOrgLocation = asyncHandler(async (req: Request, res: Response) => {
  if (
    req.user!.systemRole !== "SYS_OWNER" &&
    req.user!.systemRole !== "SUPER_ADMIN" &&
    req.user!.systemRole !== "ORG_ADMIN" &&
    req.user!.originalRole !== "SYS_OWNER"
  ) {
    throw AppError.forbidden("Only organization administrators are authorized to configure geofencing settings");
  }

  const { orgId } = req.params;

  if (req.user!.systemRole === "ORG_ADMIN" && req.user!.organizationId !== orgId && req.user!.originalRole !== "SYS_OWNER") {
    throw AppError.forbidden("You can only configure geofencing settings for your own organization");
  }

  const { officeLatitude, officeLongitude, officeRadius } = req.body;

  const updated = await OrganizationService.updateLocation(
    orgId,
    { officeLatitude, officeLongitude, officeRadius },
    req.user!.id,
    req
  );
  return sendSuccess(res, updated, "Organization geofencing configured successfully");
});

export const verifyUpi = asyncHandler(async (req: Request, res: Response) => {
  if (
    req.user!.systemRole !== "SYS_OWNER" &&
    req.user!.systemRole !== "SUPER_ADMIN" &&
    req.user!.systemRole !== "ORG_ADMIN" &&
    req.user!.originalRole !== "SYS_OWNER"
  ) {
    throw AppError.forbidden("Only organization administrators are authorized to verify payments");
  }

  const { utr, tier } = req.body;
  const orgId = req.org!.id;

  const updated = await OrganizationService.verifyUpi(orgId, utr, tier, req.user!.id, req);
  return sendSuccess(res, updated, "Payment verified and organization subscription updated successfully");
});

async function seedDefaultHolidays(orgId: string, year: number) {
  try {
    const res = await fetch(`https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`);
    if (!res.ok) {
      throw new Error(`Failed to fetch from calendar-bharat: ${res.status}`);
    }
    const data = (await res.json()) as any;
    const yearData = data[String(year)];
    if (yearData && typeof yearData === "object") {
      for (const [monthName, monthEvents] of Object.entries(yearData)) {
        if (typeof monthEvents === "object" && monthEvents !== null) {
          for (const [dateStr, eventInfo] of Object.entries(monthEvents)) {
            const info = eventInfo as any;
            if (info.type === "Government Holiday" || info.type === "Religional Festival") {
              const dateParts = dateStr.split(",");
              const cleanDateStr = dateParts[0].trim() + "," + dateParts[1];
              const parsedDate = new Date(cleanDateStr);
              if (!isNaN(parsedDate.getTime())) {
                const utcDate = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
                try {
                  await prisma.holiday.create({
                    data: {
                      organizationId: orgId,
                      date: utcDate,
                      name: info.event,
                      isOptional: false
                    }
                  });
                } catch (e) {
                  // Ignore duplicates
                }
              }
            }
          }
        }
      }
      return;
    }
  } catch (error) {
    console.error("Error fetching holidays from calendar-bharat:", error);
  }

  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
    if (res.ok) {
      const data = (await res.json()) as any[];
      if (data && data.length > 0) {
        for (const holiday of data) {
          try {
            await prisma.holiday.create({
              data: {
                organizationId: orgId,
                date: new Date(holiday.date),
                name: holiday.localName || holiday.name,
                isOptional: false
              }
            });
          } catch (e) {
            // Ignore duplicates
          }
        }
        return;
      }
    }
  } catch (error) {
    console.error("Error fetching holidays from Nager.Date:", error);
  }

  const defaults = [
    { date: new Date(year, 0, 26), name: "Republic Day" },
    { date: new Date(year, 4, 1), name: "May Day / Labor Day" },
    { date: new Date(year, 7, 15), name: "Independence Day" },
    { date: new Date(year, 9, 2), name: "Gandhi Jayanti" },
    { date: new Date(year, 11, 25), name: "Christmas Day" }
  ];

  for (const holiday of defaults) {
    try {
      await prisma.holiday.create({
        data: {
          organizationId: orgId,
          date: holiday.date,
          name: holiday.name,
          isOptional: false
        }
      });
    } catch (e) {
      // Ignore duplicates
    }
  }
}

export const listHolidays = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const currentYear = new Date().getFullYear();

  let holidays = await prisma.holiday.findMany({
    where: {
      organizationId: orgId,
      date: {
        gte: new Date(currentYear, 0, 1),
        lte: new Date(currentYear, 11, 31)
      }
    },
    orderBy: { date: "asc" }
  });

  if (holidays.length === 0) {
    await seedDefaultHolidays(orgId, currentYear);
    holidays = await prisma.holiday.findMany({
      where: {
        organizationId: orgId,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        }
      },
      orderBy: { date: "asc" }
    });
  }

  return sendSuccess(res, holidays);
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { date, name, isOptional } = req.body;

  const parsedDate = new Date(date);
  const existing = await prisma.holiday.findUnique({
    where: {
      organizationId_date: {
        organizationId: orgId,
        date: parsedDate
      }
    }
  });

  if (existing) {
    throw AppError.badRequest("A holiday already exists on this date");
  }

  const holiday = await prisma.holiday.create({
    data: {
      organizationId: orgId,
      date: parsedDate,
      name,
      isOptional: !!isOptional
    }
  });

  return sendSuccess(res, holiday, "Holiday added successfully");
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.org!.id;
  const { id } = req.params;

  const holiday = await prisma.holiday.findFirst({
    where: { id, organizationId: orgId }
  });

  if (!holiday) {
    throw AppError.notFound("Holiday not found");
  }

  await prisma.holiday.delete({
    where: { id }
  });

  return sendSuccess(res, null, "Holiday deleted successfully");
});
