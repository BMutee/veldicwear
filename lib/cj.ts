import type { CJPointsInfo, CJResponse } from "@/lib/cj-types";

const CJ_API_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

type CJAccessTokenData = {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  openId?: string;
  createDate?: string;
};

let cachedToken: CJAccessTokenData | null = null;

function getCJApiKey() {
  const key = process.env.CJ_API_KEY;
  if (!key) {
    throw new Error("Missing CJ_API_KEY environment variable. Add CJ_API_KEY to your .env file.");
  }
  return key;
}

function isTokenValid(token: CJAccessTokenData | null) {
  if (!token?.accessTokenExpiryDate) {
    return false;
  }

  const expiry = Date.parse(token.accessTokenExpiryDate);
  return !Number.isNaN(expiry) && expiry > Date.now() + 60_000;
}

function isRefreshTokenValid(token: CJAccessTokenData | null) {
  if (!token?.refreshTokenExpiryDate) {
    return false;
  }

  const expiry = Date.parse(token.refreshTokenExpiryDate);
  return !Number.isNaN(expiry) && expiry > Date.now() + 60_000;
}

function isRateLimitResponse(response: Response, body: CJResponse<unknown> | null) {
  const message = String(body?.message ?? response.statusText ?? "").toLowerCase();
  return (
    response.status === 429 ||
    /rate limit|too many requests|one ip limit 3 users|limit/.test(message)
  );
}

function isRetriableRateLimitResponse(response: Response, body: CJResponse<unknown> | null) {
  const message = String(body?.message ?? response.statusText ?? "").toLowerCase();
  return (
    response.status === 429 && !/insufficient api points/i.test(message)
  ) || /rate limit|too many requests|one ip limit 3 users/.test(message);
}

function createCJErrorMessage(response: Response, body: CJResponse<unknown> | null) {
  let message = `CJ API request failed: ${body?.message ?? response.statusText} (${body?.code ?? response.status})`;
  if (body?.pointsInfo) {
    message += ` | points usedToday=${body.pointsInfo.usedToday ?? "?"} remaining=${body.pointsInfo.remaining ?? "?"} total=${body.pointsInfo.total ?? "?"}`;
  }
  return message;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestCJ<T>(path: string, init: RequestInit, retries = 1): Promise<CJResponse<T>> {
  const response = await fetch(`${CJ_API_BASE_URL}/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: CJResponse<T> | null = null;
  try {
    body = (await response.json()) as CJResponse<T>;
  } catch {
    // ignore parse errors, fallback to raw response status/text
  }

  const isSuccessful = response.ok && (body?.code === undefined || body?.code === 200);
  if (!isSuccessful) {
    if (retries > 0 && isRetriableRateLimitResponse(response, body)) {
      await sleep(600);
      return requestCJ(path, init, retries - 1);
    }

    throw new Error(createCJErrorMessage(response, body));
  }

  return body as CJResponse<T>;
}

async function fetchCJ<T>(path: string, init: RequestInit): Promise<CJResponse<T>> {
  return requestCJ(path, init, 1);
}

export async function cjPost<T>(path: string, body: unknown) {
  const accessToken = await getCJAccessToken();
  return requestCJ<T>(path, {
    method: "POST",
    headers: {
      "CJ-Access-Token": accessToken,
    },
    body: JSON.stringify(body),
  });
}

export async function cjPatch<T>(path: string, body: unknown) {
  const accessToken = await getCJAccessToken();
  return requestCJ<T>(path, {
    method: "PATCH",
    headers: {
      "CJ-Access-Token": accessToken,
    },
    body: JSON.stringify(body),
  });
}

async function requestNewAccessToken() {
  const body = await fetchCJ<CJAccessTokenData>("authentication/getAccessToken", {
    method: "POST",
    body: JSON.stringify({ apiKey: getCJApiKey() }),
  });

  cachedToken = body.data;
  return cachedToken;
}

async function requestRefreshAccessToken(refreshToken: string) {
  const body = await fetchCJ<CJAccessTokenData>("authentication/refreshAccessToken", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  cachedToken = body.data;
  return cachedToken;
}

export async function getCJAccessToken() {
  if (isTokenValid(cachedToken) && cachedToken) {
    return cachedToken.accessToken;
  }

  if (cachedToken?.refreshToken && isRefreshTokenValid(cachedToken)) {
    try {
      await requestRefreshAccessToken(cachedToken.refreshToken);
      if (isTokenValid(cachedToken) && cachedToken) {
        return cachedToken.accessToken;
      }
    } catch {
      // refresh failed; fallback to requesting a new token.
    }
  }

  const token = await requestNewAccessToken();
  return token.accessToken;
}

export async function getCJOpenId() {
  if (process.env.CJ_OPEN_ID) {
    return process.env.CJ_OPEN_ID;
  }

  if (cachedToken?.openId) {
    return String(cachedToken.openId);
  }

  await getCJAccessToken();
  if (cachedToken?.openId) {
    return String(cachedToken.openId);
  }

  throw new Error("CJ openId is not available. Set CJ_OPEN_ID or ensure the access token response includes openId.");
}

export async function getCJAuthStatus() {
  if (!process.env.CJ_API_KEY) {
    return {
      connected: false,
      error:
        "CJ_API_KEY is not configured. Add your CJ Dropshipping API key to the environment variables.",
    };
  }

  if (isTokenValid(cachedToken)) {
    return {
      connected: true,
      accessTokenExpiryDate: cachedToken?.accessTokenExpiryDate,
      refreshTokenExpiryDate: cachedToken?.refreshTokenExpiryDate,
    };
  }

  if (cachedToken && !isRefreshTokenValid(cachedToken)) {
    return {
      connected: false,
      error:
        "CJ refresh token is expired. Reauthorization is required to obtain new tokens.",
    };
  }

  try {
    const token = await getCJAccessToken();
    return {
      connected: Boolean(token),
      accessTokenExpiryDate: cachedToken?.accessTokenExpiryDate,
      refreshTokenExpiryDate: cachedToken?.refreshTokenExpiryDate,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unable to connect to CJ API.",
    };
  }
}

export async function cjGet<T>(path: string, params?: Record<string, string>) {
  const accessToken = await getCJAccessToken();
  const url = new URL(`${CJ_API_BASE_URL}/${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const query = url.searchParams.toString();
  const pathWithQuery = query ? `${path}?${query}` : path;

  return requestCJ<T>(pathWithQuery, {
    method: "GET",
    headers: {
      "CJ-Access-Token": accessToken,
    },
    body: null,
  });
}
