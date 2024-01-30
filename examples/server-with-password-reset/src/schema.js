import { z } from "zod";

const noProtoString = z
  .string()
  .min(1)
  .refine(
    (value) => {
      return !value.includes("__proto__");
    },
    {
      message: "String must not include '__proto__'",
    },
  );

export const LoginStartParams = z.object({
  userIdentifier: noProtoString,
  startLoginRequest: noProtoString,
});

export const LoginFinishParams = z.object({
  userIdentifier: noProtoString,
  finishLoginRequest: noProtoString,
});

export const RegisterStartParams = z.object({
  userIdentifier: noProtoString,
  registrationRequest: noProtoString,
});

export const RegisterFinishParams = z.object({
  userIdentifier: noProtoString,
  registrationRecord: noProtoString,
});

export const ResetPasswordInitiateParams = z.object({
  userIdentifier: noProtoString,
});

export const ResetPasswordConfirmStartParams = z.object({
  userIdentifier: noProtoString,
  resetCode: noProtoString,
  registrationRequest: noProtoString,
});

export const ResetPasswordConfirmFinishParams = z.object({
  userIdentifier: noProtoString,
  resetCode: noProtoString,
  registrationRecord: noProtoString,
});
