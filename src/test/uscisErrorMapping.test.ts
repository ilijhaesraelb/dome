import { describe, expect, it } from "vitest";
import { resolveCaseStatusError } from "@/lib/uscisError";

describe("resolveCaseStatusError", () => {
  it("prefers the USCIS-provided message when present", () => {
    expect(
      resolveCaseStatusError({
        code: 404,
        message: "Case Status Online does not recognize the receipt number entered. Please check your receipt number and try again. If you need further assistance, please call the USCIS Contact Center at 1-800-375-5283.",
      })
    ).toEqual({
      code: 404,
      message: "Case Status Online does not recognize the receipt number entered. Please check your receipt number and try again. If you need further assistance, please call the USCIS Contact Center at 1-800-375-5283.",
    });
  });

  it("handles the 401 invalid access token payload", () => {
    expect(resolveCaseStatusError({ code: 401, message: "Invalid Access Token" })).toEqual({
      code: 401,
      message: "Invalid Access Token",
    });
  });

  it("supports legacy error shapes without losing the message", () => {
    expect(resolveCaseStatusError({ code: 503, error: "Service Unavailable" })).toEqual({
      code: 503,
      message: "Service Unavailable",
    });
  });
});
