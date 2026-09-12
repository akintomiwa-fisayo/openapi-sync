import prompts from "prompts";
import { ISpecAuth } from "../types";
import { buildAuthConfig } from "./spec-auth";
import type { AxiosRequestConfig } from "axios";

/**
 * When a spec fetch fails with 401/403, prompt the user for credentials.
 * Returns an axios config with the provided credentials, or null if the
 * user cancels (for non-interactive environments).
 *
 * This function is only called in interactive mode (i.e., from the CLI,
 * not from programmatic API use). Credentials are NEVER written to disk.
 */
export async function promptForAuth(
  apiName: string,
  apiUrl: string
): Promise<Pick<AxiosRequestConfig, "headers" | "params"> | null> {
  console.log(
    `\n🔐 Authentication required for "${apiName}" (${apiUrl})\n`
  );

  const { authType } = await prompts({
    type: "select",
    name: "authType",
    message: "Select authentication type:",
    choices: [
      { title: "Bearer token", value: "bearer" },
      { title: "Basic auth (username + password)", value: "basic" },
      { title: "API key in header", value: "apiKey-header" },
      { title: "API key in query param", value: "apiKey-query" },
      { title: "Cancel — skip this API", value: "cancel" },
    ],
  });

  if (!authType || authType === "cancel") return null;

  if (authType === "bearer") {
    const { token } = await prompts({
      type: "password",
      name: "token",
      message: "Enter your Bearer token:",
    });
    if (!token) return null;
    const auth: ISpecAuth = { type: "bearer", token };
    return buildAuthConfig(auth);
  }

  if (authType === "basic") {
    const { username, password } = await prompts([
      { type: "text", name: "username", message: "Username:" },
      { type: "password", name: "password", message: "Password:" },
    ]);
    if (!username || !password) return null;
    const auth: ISpecAuth = { type: "basic", username, password };
    return buildAuthConfig(auth);
  }

  if (authType === "apiKey-header") {
    const { headerName, keyValue } = await prompts([
      { type: "text", name: "headerName", message: "Header name (e.g. X-API-Key):", initial: "X-API-Key" },
      { type: "password", name: "keyValue", message: "API key value:" },
    ]);
    if (!headerName || !keyValue) return null;
    const auth: ISpecAuth = { type: "apiKey", in: "header", name: headerName, value: keyValue };
    return buildAuthConfig(auth);
  }

  if (authType === "apiKey-query") {
    const { paramName, keyValue } = await prompts([
      { type: "text", name: "paramName", message: "Query param name (e.g. api_key):", initial: "api_key" },
      { type: "password", name: "keyValue", message: "API key value:" },
    ]);
    if (!paramName || !keyValue) return null;
    const auth: ISpecAuth = { type: "apiKey", in: "query", name: paramName, value: keyValue };
    return buildAuthConfig(auth);
  }

  return null;
}
