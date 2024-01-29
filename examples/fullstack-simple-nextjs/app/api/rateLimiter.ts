import { NextRequest } from "next/server";

const limit = 40;
const limitWindow = 1000 * 60; // 1 minute

const rateLimiter = new Map<
  string,
  { requestCount: number; firstRequest: Date }
>();

type Params = {
  request: NextRequest;
};

/** Simple rate-limiter based on the IP */
export const checkRateLimit = ({ request }: Params) => {
  const ip = request.ip || "anonymous";
  const existingEntry = rateLimiter.get(ip);
  if (!existingEntry) {
    rateLimiter.set(ip, {
      requestCount: 1,
      firstRequest: new Date(),
    });
    return false;
  }

  const { requestCount, firstRequest } = existingEntry;
  const now = new Date();

  // if the first request was more than 1 minute ago, reset the counter
  if (now.getTime() - firstRequest.getTime() > limitWindow) {
    rateLimiter.set(ip, {
      requestCount: 1,
      firstRequest: now,
    });
    return false;
  }

  // if the request count is more than the limit, block the request
  if (requestCount > limit) {
    return true;
  }

  // otherwise, increment the request count and allow the request
  rateLimiter.set(ip, {
    requestCount: requestCount + 1,
    firstRequest,
  });
  return false;
};
