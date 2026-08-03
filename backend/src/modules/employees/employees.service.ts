import { prisma } from "../../config/database";
import { hashPassword, comparePassword } from "../../utils/hash.util";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notifications/notifications.service";
import { AuditAction, UserStatus, NotificationType, SalaryBand, EmployeeType, TaxRegime, SystemRole, Prisma } from "@prisma/client";
import { AppError } from "../../utils/errors.util";
import { redis } from "../../config/redis";
import { getPermissionScopes } from "../../utils/permission.util";
import { encrypt, decrypt } from "../../utils/encryption.util";

export class EmployeesService {
  static async listEmployees(
    user: any,
    orgId: string,
    filters: { departmentId?: string; teamId?: string; taskAssignees?: string | boolean; status?: UserStatus; search?: string },
    page: number,
    limit: number
  ) {
    const where: any = {
      organizationId: orgId,
      isDeleted: false
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters.teamId) {
      where.teams = {
        some: {
          id: filters.teamId
        }
      };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { employeeId: { contains: filters.search, mode: "insensitive" } }
      ];
    }
    if (filters.taskAssignees === "true" || filters.taskAssignees === true) {
      const isHR = user.roles.some((r: any) => r.roleName === "HR_MANAGER");
      const isAdmin = user.systemRole === "SUPER_ADMIN" || user.systemRole === "ORG_ADMIN";

      if (!isAdmin && !isHR) {
        // Fetch teams led by user
        const ledTeams = await prisma.team.findMany({
          where: { leadId: user.id, isDeleted: false },
          select: { id: true }
        });
        const ledTeamIds = ledTeams.map((t) => t.id);

        // Fetch departments headed by user
        const headedDepts = await prisma.department.findMany({
          where: { headId: user.id, isDeleted: false },
          select: { id: true }
        });
        const headedDeptIds = headedDepts.map((d) => d.id);

        const conditions: any[] = [
          { id: user.id }, // Self
          { managerId: user.id } // Direct reports
        ];

        if (ledTeamIds.length > 0) {
          conditions.push({
            teams: {
              some: {
                id: { in: ledTeamIds }
              }
            }
          });
        }

        if (headedDeptIds.length > 0) {
          conditions.push({
            departmentId: { in: headedDeptIds }
          });
        }

        where.OR = conditions;
      }
    }

    const total = await prisma.user.count({ where });
    const employees = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return { employees, total };
  }

  static async createEmployee(
    orgId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      avatarUrl?: string;
      designation?: string;
      departmentId?: string;
      managerId?: string;
      salaryBand?: SalaryBand;
      joinDate?: Date;

      dateOfBirth?: Date;
      gender?: string;
      bloodGroup?: string;
      personalEmail?: string;
      personalPhone?: string;
      address?: any;
      employeeType?: EmployeeType;
      workLocation?: string;
      shiftId?: string;
      probationEndDate?: Date;
      basicSalary?: number;
      pfApplicable?: boolean;
      taxRegime?: TaxRegime;
      ctcAnnual?: number;
      systemRole?: SystemRole;

      bankDetail?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        accountHolderName: string;
        panNumber: string;
        aadhaarLast4?: string;
      };
      emergencyContact?: {
        name: string;
        relation: string;
        phone: string;
        altPhone?: string;
      };
      leaveAllocations?: {
        leaveType: string;
        allocated: number;
      }[];
    },
    actorId: string,
    req?: any
  ) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, isDeleted: false }
    });

    if (existing) {
      throw AppError.conflict("Email is already in use");
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { licenseMaxEmployees: true, licenseStatus: true }
    });
    if (org) {
      if (org.licenseStatus === "INACTIVE" || org.licenseStatus === "REVOKED") {
        throw AppError.forbidden("Organization license is inactive. Please reactivate your license to add new employees.");
      }
      const activeCount = await prisma.user.count({
        where: { organizationId: orgId, status: "ACTIVE", isDeleted: false }
      });
      if (activeCount >= org.licenseMaxEmployees) {
        throw AppError.badRequest(
          `Employee capacity limit reached (${activeCount}/${org.licenseMaxEmployees} seats used). Please upgrade your License Key to add more employees.`
        );
      }
    }

    const { bankDetail, emergencyContact, leaveAllocations, ...coreUserData } = data;

    const result = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.user.count({
        where: {
          organizationId: orgId,
          employeeId: { startsWith: `EMP-${year}-` }
        },
        ignoreSoftDelete: true
      } as any);
      const index = String(count + 1).padStart(4, "0");
      const employeeId = `EMP-${year}-${index}`;

      const tempPassword = `Temp-${year}-${Math.round(Math.random() * 10000)}`;
      const passwordHash = await hashPassword(tempPassword);

      const employee = await tx.user.create({
        data: {
          ...coreUserData,
          employeeId,
          passwordHash,
          organizationId: orgId,
          status: UserStatus.ACTIVE,
          systemRole: data.systemRole || "EMPLOYEE",
          forcePasswordChange: true
        }
      });

      if (bankDetail) {
        await tx.bankDetail.create({
          data: {
            userId: employee.id,
            bankName: bankDetail.bankName,
            accountNumber: encrypt(bankDetail.accountNumber),
            ifscCode: bankDetail.ifscCode,
            accountHolderName: bankDetail.accountHolderName,
            panNumber: encrypt(bankDetail.panNumber),
            aadhaarLast4: bankDetail.aadhaarLast4 || null
          }
        });
      }

      if (emergencyContact) {
        await tx.emergencyContact.create({
          data: {
            userId: employee.id,
            name: emergencyContact.name,
            relation: emergencyContact.relation,
            phone: emergencyContact.phone,
            altPhone: emergencyContact.altPhone || null
          }
        });
      }

      if (leaveAllocations && leaveAllocations.length > 0) {
        for (const allocation of leaveAllocations) {
          await tx.leaveBalance.create({
            data: {
              userId: employee.id,
              leaveType: allocation.leaveType as any,
              year,
              allocated: allocation.allocated,
              used: 0,
              pending: 0,
              remaining: allocation.allocated
            }
          });
        }
      } else {
        const policies = await tx.leavePolicy.findMany({
          where: { organizationId: orgId, isDeleted: false }
        });

        for (const policy of policies) {
          await tx.leaveBalance.create({
            data: {
              userId: employee.id,
              leaveType: policy.leaveType,
              year,
              allocated: policy.daysAllowed,
              used: 0,
              pending: 0,
              remaining: policy.daysAllowed
            }
          });
        }
      }

      return { employee, tempPassword };
    });

    // Logging audit and notification after transaction commit
    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.CREATED,
      module: "employees",
      targetId: result.employee.id,
      targetType: "User",
      newValue: { employeeId: result.employee.employeeId },
      req
    });

    await NotificationService.notify(
      result.employee.id,
      NotificationType.SYSTEM,
      "Welcome to WorkforceOS",
      `Your account has been created. Please secure your temporary login credentials from your administrator.`
    );

    return result;
  }

  static async getEmployeeById(id: string, orgId: string) {
    const emp = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        teams: {
          where: { isDeleted: false }
        },
        documents: {
          where: { isDeleted: false }
        },
        leaveBalances: true,
        departmentHead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        teamLead: {
          where: { isDeleted: false },
          select: { id: true, name: true }
        },
        bankDetail: true,
        emergencyContact: true
      }
    });

    if (!emp) {
      throw AppError.notFound("Employee profile not found");
    }

    if (emp.bankDetail) {
      try {
        const decryptedAccount = decrypt(emp.bankDetail.accountNumber);
        const decryptedPan = decrypt(emp.bankDetail.panNumber);
        
        (emp.bankDetail as any).accountNumber = decryptedAccount.length > 4
          ? "*".repeat(decryptedAccount.length - 4) + decryptedAccount.slice(-4)
          : decryptedAccount;
        (emp.bankDetail as any).panNumber = decryptedPan.length > 4
          ? "*".repeat(decryptedPan.length - 4) + decryptedPan.slice(-4)
          : decryptedPan;
      } catch (err) {
        console.error("Failed to decrypt bank detail:", err);
      }
    }

    return emp;
  }

  static async updateEmployee(
    id: string,
    orgId: string,
    data: any,
    actorId: string,
    req?: any
  ) {
    const oldUser = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!oldUser) {
      throw AppError.notFound("Employee profile not found");
    }

    const { bankDetail, emergencyContact, leaveAllocations, ...coreUserData } = data;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: coreUserData
      });

      if (bankDetail) {
        const updateData: any = { ...bankDetail };
        
        if (bankDetail.accountNumber && !bankDetail.accountNumber.includes('*')) {
          updateData.accountNumber = encrypt(bankDetail.accountNumber);
        } else {
          delete updateData.accountNumber;
        }

        if (bankDetail.panNumber && !bankDetail.panNumber.includes('*')) {
          updateData.panNumber = encrypt(bankDetail.panNumber);
        } else {
          delete updateData.panNumber;
        }

        await tx.bankDetail.upsert({
          where: { userId: id },
          update: updateData,
          create: {
            userId: id,
            bankName: bankDetail.bankName || "",
            accountNumber: bankDetail.accountNumber && !bankDetail.accountNumber.includes('*') ? encrypt(bankDetail.accountNumber) : "",
            ifscCode: bankDetail.ifscCode || "",
            accountHolderName: bankDetail.accountHolderName || "",
            panNumber: bankDetail.panNumber && !bankDetail.panNumber.includes('*') ? encrypt(bankDetail.panNumber) : "",
            aadhaarLast4: bankDetail.aadhaarLast4 || null
          }
        });
      }

      if (emergencyContact) {
        await tx.emergencyContact.upsert({
          where: { userId: id },
          update: emergencyContact,
          create: {
            userId: id,
            name: emergencyContact.name || "",
            relation: emergencyContact.relation || "",
            phone: emergencyContact.phone || "",
            altPhone: emergencyContact.altPhone || null
          }
        });
      }

      if (leaveAllocations && leaveAllocations.length > 0) {
        const year = new Date().getFullYear();
        for (const allocation of leaveAllocations) {
          const existingBalance = await tx.leaveBalance.findUnique({
            where: {
              userId_leaveType_year: {
                userId: id,
                leaveType: allocation.leaveType as any,
                year
              }
            }
          });

          if (existingBalance) {
            const newRemaining = allocation.allocated - existingBalance.used;
            await tx.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: allocation.allocated,
                remaining: newRemaining < 0 ? 0 : newRemaining
              }
            });
          } else {
            await tx.leaveBalance.create({
              data: {
                userId: id,
                leaveType: allocation.leaveType as any,
                year,
                allocated: allocation.allocated,
                used: 0,
                pending: 0,
                remaining: allocation.allocated
              }
            });
          }
        }
      }

      return user;
    });

    await redis.del(`user:session:${id}`).catch(() => {});

    const fields = ["firstName", "lastName", "email", "phone", "avatarUrl", "designation", "departmentId", "managerId", "salaryBand", "status"];
    for (const f of fields) {
      const oldVal = (oldUser as any)[f];
      const newVal = (updatedUser as any)[f];
      if (oldVal !== newVal) {
        await AuditService.log({
          organizationId: orgId,
          actorId,
          action: AuditAction.UPDATED,
          module: "employees",
          targetId: id,
          targetType: "User",
          oldValue: { [f]: oldVal },
          newValue: { [f]: newVal },
          req
        });
      }
    }

    return updatedUser;
  }

  static async deleteEmployee(id: string, orgId: string, actorId: string, req?: any) {
    const emp = await prisma.user.findFirst({
      where: { id, organizationId: orgId, isDeleted: false }
    });

    if (!emp) {
      throw AppError.notFound("Employee profile not found");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated sensitive tables
      await tx.bankDetail.deleteMany({ where: { userId: id } });
      await tx.emergencyContact.deleteMany({ where: { userId: id } });

      // 2. Anonymize/Scrub personal details in the User model to conform to GDPR/DPDP erasure rules
      await tx.user.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          email: `deleted-${id}@workforceos.com`, // Avoid unique constraint clashes while removing PII
          firstName: "Deleted",
          lastName: "Employee",
          phone: null,
          avatarUrl: null,
          personalEmail: null,
          personalPhone: null,
          address: Prisma.DbNull,
          dateOfBirth: null,
          gender: null,
          bloodGroup: null,
        }
      });
    });

    await redis.del(`user:session:${id}`).catch(() => {});

    await prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true }
    });

    await AuditService.log({
      organizationId: orgId,
      actorId,
      action: AuditAction.DELETED,
      module: "employees",
      targetId: id,
      targetType: "User",
      req
    });
  }

  static async uploadDocument(
    userId: string,
    orgId: string,
    name: string,
    fileUrl: string,
    fileType: string,
    uploadedBy: string
  ) {
    return prisma.employeeDocument.create({
      data: {
        userId,
        name,
        fileUrl,
        fileType,
        uploadedBy
      }
    });
  }

  static async listDocuments(userId: string) {
    return prisma.employeeDocument.findMany({
      where: { userId, isDeleted: false }
    });
  }

  static async deleteDocument(docId: string, userId: string) {
    return prisma.employeeDocument.update({
      where: { id: docId, userId },
      data: {
        isDeleted: true
      }
    });
  }

  static async resetPassword(
    employeeId: string,
    orgId: string,
    adminId: string,
    adminPass: string,
    newPass: string,
    req?: any
   ) {
     const admin = await prisma.user.findFirst({
       where: { id: adminId, organizationId: orgId, isDeleted: false }
     });
     if (!admin || (admin.systemRole !== "SUPER_ADMIN" && admin.systemRole !== "ORG_ADMIN")) {
       throw AppError.forbidden("Access denied: only administrators can reset passwords");
     }

     const matches = await comparePassword(adminPass, admin.passwordHash);
     if (!matches) {
       throw AppError.badRequest("Invalid administrator password");
     }

     const employee = await prisma.user.findFirst({
       where: { id: employeeId, organizationId: orgId, isDeleted: false }
     });
     if (!employee) {
       throw AppError.notFound("Employee not found");
     }

     const passwordHash = await hashPassword(newPass);
     const updatedEmployee = await prisma.user.update({
       where: { id: employeeId },
       data: { 
         passwordHash,
         forcePasswordChange: true 
       }
     });

     await prisma.refreshToken.updateMany({
       where: { userId: employeeId },
       data: { isRevoked: true }
     });

     await AuditService.log({
       organizationId: orgId,
       actorId: adminId,
       action: AuditAction.UPDATED,
       module: "employees",
       targetId: employeeId,
       targetType: "User",
       newValue: { passwordReset: true, forcePasswordChange: true },
       req
     });

      return updatedEmployee;
    }

    static async setHomeAddress(userId: string, orgId: string, lat: number, lng: number, radius: number, addressLabel: string, req?: any) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound("User not found");

      if (user.homeAddressLocked) {
        throw AppError.forbidden("Home address is locked. Submit a change request through HR.");
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          homeLatitude: lat,
          homeLongitude: lng,
          homeRadius: radius,
          homeAddressLocked: true,
          address: { ...(user.address as any || {}), homeLabel: addressLabel }
        }
      });

      await AuditService.log({
        organizationId: orgId,
        actorId: userId,
        action: AuditAction.UPDATED,
        module: "employees",
        targetId: userId,
        targetType: "User",
        newValue: { homeLatitude: lat, homeLongitude: lng, homeRadius: radius, homeAddressLocked: true },
        req
      });

      return updated;
    }

    static async createProfileRequest(userId: string, orgId: string, requestedData: any, req?: any) {
      const request = await prisma.profileUpdateRequest.create({
        data: {
          userId,
          organizationId: orgId,
          requestedData
        }
      });

      // Find organization admins and HR to notify them
      const adminsAndHr = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          systemRole: { in: [SystemRole.ORG_ADMIN, SystemRole.HR] },
          isDeleted: false
        },
        select: { id: true }
      });

      const actorName = `${req.user?.firstName || "An employee"} ${req.user?.lastName || ""}`;
      for (const adm of adminsAndHr) {
        await NotificationService.notify(
          adm.id,
          NotificationType.SYSTEM,
          "Profile Update Request",
          `${actorName} has submitted a request to update their personal details.`
        ).catch(console.error);
      }

      return request;
    }

    static async listProfileRequests(userId: string, orgId: string, systemRole: string) {
      const isPriorityRole = ["SUPER_ADMIN", "ORG_ADMIN", "HR"].includes(systemRole);
      const where: any = { organizationId: orgId };
      if (!isPriorityRole) {
        where.userId = userId;
      }

      return await prisma.profileUpdateRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              designation: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    static async approveProfileRequest(requestId: string, orgId: string, reviewerId: string, req?: any) {
      const request = await prisma.profileUpdateRequest.findFirst({
        where: { id: requestId, organizationId: orgId, status: "PENDING" }
      });

      if (!request) {
        throw AppError.notFound("Pending profile update request not found");
      }

      const { bankDetail, emergencyContact, changeReason: _changeReason, ...coreUserData } = request.requestedData as any;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: request.userId },
          data: { ...coreUserData, homeAddressLocked: coreUserData.homeLatitude !== undefined ? true : undefined }
        });

        if (bankDetail) {
          const updateData = { ...bankDetail };
          if (bankDetail.accountNumber && !bankDetail.accountNumber.includes('*')) {
            updateData.accountNumber = encrypt(bankDetail.accountNumber);
          } else {
            delete updateData.accountNumber;
          }
          if (bankDetail.panNumber && !bankDetail.panNumber.includes('*')) {
            updateData.panNumber = encrypt(bankDetail.panNumber);
          } else {
            delete updateData.panNumber;
          }

          await tx.bankDetail.upsert({
            where: { userId: request.userId },
            update: updateData,
            create: {
              userId: request.userId,
              bankName: bankDetail.bankName || "",
              accountNumber: bankDetail.accountNumber ? encrypt(bankDetail.accountNumber) : "",
              ifscCode: bankDetail.ifscCode || "",
              accountHolderName: bankDetail.accountHolderName || "",
              panNumber: bankDetail.panNumber ? encrypt(bankDetail.panNumber) : "",
              aadhaarLast4: bankDetail.aadhaarLast4 || null
            }
          });
        }

        if (emergencyContact) {
          await tx.emergencyContact.upsert({
            where: { userId: request.userId },
            update: emergencyContact,
            create: {
              userId: request.userId,
              name: emergencyContact.name || "",
              relation: emergencyContact.relation || "",
              phone: emergencyContact.phone || "",
              altPhone: emergencyContact.altPhone || null
            }
          });
        }

        await tx.profileUpdateRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedBy: reviewerId,
            reviewedAt: new Date()
          }
        });
      });

      await NotificationService.notify(
        request.userId,
        NotificationType.SYSTEM,
        "Profile Update Approved",
        "Your request to update personal details has been approved."
      ).catch(console.error);

      return { success: true };
    }

    static async rejectProfileRequest(requestId: string, orgId: string, reviewerId: string, comment?: string, req?: any) {
      const request = await prisma.profileUpdateRequest.findFirst({
        where: { id: requestId, organizationId: orgId, status: "PENDING" }
      });

      if (!request) {
        throw AppError.notFound("Pending profile update request not found");
      }

      await prisma.profileUpdateRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          comment
        }
      });

      await NotificationService.notify(
        request.userId,
        NotificationType.SYSTEM,
        "Profile Update Rejected",
        `Your request to update personal details was declined. Reason: ${comment || "None provided"}`
      ).catch(console.error);

      return { success: true };
    }
}
