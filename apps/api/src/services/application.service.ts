// @ts-nocheck
import { randomBytes } from "node:crypto";
import { ApplicationRepository } from "../repositories/application.repository";
import { prisma } from "../config/db";
import { hashPassword } from "../utils/password";
import { HTTPException } from "hono/http-exception";
import { INTEREST_RATES } from "@iffe/shared";
import { getNextAccountNumber, getNextMemberNumber } from "../utils/identifiers";
import { AuthService } from "./auth.service";

const repo = new ApplicationRepository();
const authService = new AuthService();

function splitName(fullName: string) {
  const nameParts = fullName.trim().split(/\s+/);
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || nameParts[0],
  };
}

export class ApplicationService {
  async getAll(params) {
    return repo.findAll(params);
  }

  async getById(id: string) {
    const app = await repo.findById(id);
    if (!app) throw new HTTPException(404, { message: "Application not found" });
    return app;
  }

  async getByUserId(userId: string) {
    return repo.findByUserId(userId);
  }

  async submit(data: any, userId?: string) {
    // If userId provided, check no existing application
    if (userId) {
      const existing = await repo.findByUserId(userId);
      if (existing) throw new HTTPException(409, { message: "Application already submitted" });
    }

    // Flatten place objects into individual fields for DB storage
    const dbData = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      sex: data.sex,
      phone: data.phone,
      email: data.email,
      clan: data.clan,
      totem: data.totem,

      // Birth place
      birthDistrict: data.birthPlace?.district,
      birthCounty: data.birthPlace?.county,
      birthSubCounty: data.birthPlace?.subCounty,
      birthParish: data.birthPlace?.parish,
      birthVillage: data.birthPlace?.village,

      // Ancestral place
      ancestralDistrict: data.ancestralPlace?.district,
      ancestralCounty: data.ancestralPlace?.county,
      ancestralSubCounty: data.ancestralPlace?.subCounty,
      ancestralParish: data.ancestralPlace?.parish,
      ancestralVillage: data.ancestralPlace?.village,

      // Residence
      residenceDistrict: data.residencePlace?.district,
      residenceCounty: data.residencePlace?.county,
      residenceSubCounty: data.residencePlace?.subCounty,
      residenceParish: data.residencePlace?.parish,
      residenceVillage: data.residencePlace?.village,

      // Work
      occupation: data.occupation,
      placeOfWork: data.placeOfWork,
      qualifications: data.qualifications,

      // Family (store as JSON)
      fatherInfo: data.fatherInfo || undefined,
      motherInfo: data.motherInfo || undefined,
      spouses: data.spouses || undefined,
      children: data.children || undefined,
      otherRelatives: data.otherRelatives || undefined,

      // Document
      applicationLetterUrl: data.applicationLetterUrl,
      applicationLetterName: data.applicationLetterName,

      // Workflow
      status: "pending",
      userId: userId || undefined,
    };

    return repo.create(dbData);
  }

  async approve(id: string, adminId: string) {
    let createdUserId: string | null = null;

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id } });
      if (!application) {
        throw new HTTPException(404, { message: "Application not found" });
      }
      if (application.status !== "pending") {
        throw new HTTPException(400, { message: "Only pending applications can be approved" });
      }

      const claimed = await tx.application.updateMany({
        where: { id, status: "pending" },
        data: {
          status: "approved",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      if (claimed.count === 0) {
        throw new HTTPException(409, { message: "Application is no longer pending approval" });
      }

      let userId = application.userId;
      if (!userId && application.email) {
        const existingUser = await tx.user.findUnique({ where: { email: application.email } });
        if (existingUser) {
          if (existingUser.role !== "member") {
            throw new HTTPException(409, { message: "Application email is already assigned to a non-member account" });
          }
          userId = existingUser.id;
        } else {
          const password = await hashPassword(randomBytes(32).toString("base64url"));
          const user = await tx.user.create({
            data: {
              name: application.fullName,
              email: application.email,
              phone: application.phone,
              password,
              role: "member",
            },
          });
          userId = user.id;
          createdUserId = user.id;
        }
      }

      const { firstName, lastName } = splitName(application.fullName);
      const member = await tx.member.create({
        data: {
          memberId: await getNextMemberNumber(tx),
          firstName,
          lastName,
          email: application.email || application.phone,
          phone: application.phone,
          gender: application.sex,
          dateOfBirth: application.dateOfBirth,
          occupation: application.occupation,
          district: application.residenceDistrict,
          country: "UG",
          status: "active",
          userId: userId || undefined,
          applicationId: application.id,
          clan: application.clan,
          totem: application.totem,
          birthDistrict: application.birthDistrict,
          birthVillage: application.birthVillage,
          ancestralDistrict: application.ancestralDistrict,
          ancestralVillage: application.ancestralVillage,
          residenceDistrict: application.residenceDistrict,
          residenceVillage: application.residenceVillage,
          placeOfWork: application.placeOfWork,
          qualifications: application.qualifications,
          fatherInfo: application.fatherInfo || undefined,
          motherInfo: application.motherInfo || undefined,
          spouses: application.spouses || undefined,
          children: application.children || undefined,
          otherRelatives: application.otherRelatives || undefined,
        },
      });

      await tx.account.create({
        data: {
          accountNo: await getNextAccountNumber(tx, "savings"),
          memberId: member.id,
          type: "savings",
          interestRate: INTEREST_RATES.savings,
          status: "active",
        },
      });

      const updatedApplication = await tx.application.update({
        where: { id },
        data: { memberId: member.id },
      });

      return { application: updatedApplication, member };
    });

    let onboarding: { userId: string; debugResetUrl?: string } | undefined;
    if (createdUserId) {
      let resetResult: { resetUrl: string } | null = null;
      try {
        resetResult = await authService.issuePasswordResetTokenForUser(createdUserId);
      } catch (error) {
        console.error("Failed to generate onboarding reset token", error);
      }

      onboarding = {
        userId: createdUserId,
        ...(process.env.NODE_ENV === "production" || !resetResult ? {} : { debugResetUrl: resetResult.resetUrl }),
      };
    }

    return { ...result, onboarding };
  }

  async reject(id: string, adminId: string, reason?: string) {
    const application = await this.getById(id);
    if (application.status !== "pending") {
      throw new HTTPException(400, { message: "Only pending applications can be rejected" });
    }

    const updated = await prisma.application.updateMany({
      where: { id, status: "pending" },
      data: {
        status: "rejected",
        rejectionReason: reason || "Application rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new HTTPException(409, { message: "Application is no longer pending review" });
    }

    return repo.findById(id);
  }

  async getStats() {
    return repo.countByStatus();
  }
}
