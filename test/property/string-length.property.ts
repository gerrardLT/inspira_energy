/**
 * Property 4: String Length Enforcement
 *
 * For any string input where the value exceeds 1000 characters for a single-line field
 * or 5000 characters for a multi-line field, the Form_Service shall reject the request
 * with a 400 status code identifying which field exceeded its length limit.
 *
 * **Validates: Requirements 9.1**
 *
 * Tag: Feature: backend-infrastructure, Property 4: String Length Enforcement
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { FIELD_LENGTH_LIMITS } from "@/types/api";
import {
  lpInterestSchema,
  developerSchema,
  contactGeneralSchema,
  contactInvestorSchema,
  newsletterSchema,
} from "@/lib/validation/schemas";

describe("Feature: backend-infrastructure, Property 4: String Length Enforcement", () => {
  /**
   * Helper: generate a string that exceeds the given max length.
   * Uses printable ASCII to avoid encoding complexities.
   */
  const oversizedString = (minLength: number) =>
    fc.string({ minLength: minLength + 1, maxLength: minLength + 500 }).filter(
      (s) => s.length > minLength && !s.includes("\n") && !s.includes("\r")
    );

  const oversizedMultiLineString = (minLength: number) =>
    fc.string({ minLength: minLength + 1, maxLength: minLength + 500 }).filter(
      (s) => s.length > minLength
    );

  describe("Single-line field length enforcement", () => {
    it("should reject LP Interest form when name exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.name),
          (oversizedName) => {
            const input = {
              name: oversizedName,
              institution: "Valid Institution",
              email: "test@example.com",
              fund_types: ["solar"],
            };

            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("name");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject LP Interest form when institution exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.institution),
          (oversizedInstitution) => {
            const input = {
              name: "Valid Name",
              institution: oversizedInstitution,
              email: "test@example.com",
              fund_types: ["solar"],
            };

            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("institution");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject LP Interest form when email exceeds 254 characters", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.email),
          (oversizedEmail) => {
            const input = {
              name: "Valid Name",
              institution: "Valid Institution",
              email: oversizedEmail,
              fund_types: ["solar"],
            };

            const result = lpInterestSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("email");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject Developer form when company_name exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.company),
          (oversizedCompany) => {
            const input = {
              company_name: oversizedCompany,
              contact_name: "Valid Name",
              email: "test@example.com",
              region: "East China",
              project_type: "Solar",
              capacity_mw: 50,
            };

            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("company_name");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject Developer form when contact_name exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.name),
          (oversizedName) => {
            const input = {
              company_name: "Valid Company",
              contact_name: oversizedName,
              email: "test@example.com",
              region: "East China",
              project_type: "Solar",
              capacity_mw: 50,
            };

            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("contact_name");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject Contact Investor form when name exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.name),
          (oversizedName) => {
            const input = {
              form_type: "investor" as const,
              name: oversizedName,
              company: "Valid Company",
              email: "test@example.com",
            };

            const result = contactInvestorSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("name");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject Contact Investor form when company exceeds max length", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.company),
          (oversizedCompany) => {
            const input = {
              form_type: "investor" as const,
              name: "Valid Name",
              company: oversizedCompany,
              email: "test@example.com",
            };

            const result = contactInvestorSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("company");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Multi-line field length enforcement", () => {
    it("should reject Contact General form when message exceeds 5000 characters", () => {
      fc.assert(
        fc.property(
          oversizedMultiLineString(FIELD_LENGTH_LIMITS.message),
          (oversizedMessage) => {
            const input = {
              form_type: "general" as const,
              name: "Valid Name",
              email: "test@example.com",
              message: oversizedMessage,
            };

            const result = contactGeneralSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("message");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject Developer form when notes exceeds 5000 characters", () => {
      fc.assert(
        fc.property(
          oversizedMultiLineString(FIELD_LENGTH_LIMITS.message),
          (oversizedNotes) => {
            const input = {
              company_name: "Valid Company",
              contact_name: "Valid Name",
              email: "test@example.com",
              region: "East China",
              project_type: "Solar",
              capacity_mw: 50,
              notes: oversizedNotes,
            };

            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("notes");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Generic single-line field enforcement (singleLine limit = 1000)", () => {
    it("should reject any single-line field exceeding 1000 characters via Developer region field", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.singleLine),
          (oversizedRegion) => {
            const input = {
              company_name: "Valid Company",
              contact_name: "Valid Name",
              email: "test@example.com",
              region: oversizedRegion,
              project_type: "Solar",
              capacity_mw: 50,
            };

            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("region");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject any single-line field exceeding 1000 characters via Developer project_type field", () => {
      fc.assert(
        fc.property(
          oversizedString(FIELD_LENGTH_LIMITS.singleLine),
          (oversizedType) => {
            const input = {
              company_name: "Valid Company",
              contact_name: "Valid Name",
              email: "test@example.com",
              region: "East China",
              project_type: oversizedType,
              capacity_mw: 50,
            };

            const result = developerSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
              const fieldNames = result.error.issues.map((issue) =>
                issue.path.join(".")
              );
              expect(fieldNames).toContain("project_type");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
