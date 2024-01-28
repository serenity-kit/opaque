import { z } from "zod";

const noProtoString = z
  .string()
  .min(1)
  .refine(
    (value) => {
      return !value.startsWith("__proto__");
    },
    {
      message: "String must not start with '__proto__'",
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
