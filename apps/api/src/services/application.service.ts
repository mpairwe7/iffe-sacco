// @ts-nocheck
import { ApplicationRepository } from "../repositories/application.repository";
import { prisma } from "../config/db";
import { hashPassword } from "../utils/password";
import { HTTPException } from "hono/http-exception";
import { INTEREST_RATES } from "@iffe/shared";

const repo = new ApplicationRepository();

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
    const application = await this.getById(id);
    if (application.status !== "pending") {
      throw new HTTPException(400, { message: "Only pending applications can be approved" });
    }

    // Create User account if no userId (applicant didn't create account)
    let userId = application.userId;
    if (!userId && application.email) {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: application.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const password = await hashPassword("member123"); // default password
        const user = await prisma.user.create({
          data: {
            name: application.fullName,
            email: application.email || `${application.phone}@iffeds.org`,
            phone: application.phone,
            password,
            role: "member",
          },
        });
        userId = user.id;
      }
    }

    // Create Member record
    // Generate memberId using count + retry
    let member;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const count = await prisma.member.count();
        const memberId = `IFFE-${String(count + 1 + attempt).padStart(3, "0")}`;

        // Split fullName into first/last
        const nameParts = application.fullName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];

        member = await prisma.member.create({
          data: {
            memberId,
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
            // Bio data fields
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
        break;
      } catch (err: any) {
        if (err.code === "P2002" && attempt < 4) continue;
        throw err;
      }
    }

    // Create default savings account for the new member
    if (member) {
      const accCount = await prisma.account.count();
      const accountNo = `SAV-${String(accCount + 1).padStart(4, "0")}`;
      await prisma.account.create({
        data: { accountNo, memberId: member.id, type: "savings", interestRate: 12, status: "active" },
      });
    }

    // Update application status
    await repo.update(id, {
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      memberId: member?.id,
    });

    return { application: await repo.findById(id), member };
  }

  async reject(id: string, adminId: string, reason?: string) {
    const application = await this.getById(id);
    if (application.status !== "pending") {
      throw new HTTPException(400, { message: "Only pending applications can be rejected" });
    }

    return repo.update(id, {
      status: "rejected",
      rejectionReason: reason || "Application rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
    });
  }

  async getStats() {
    return repo.countByStatus();
  }
}
