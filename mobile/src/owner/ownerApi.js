// Shortcut for owner API calls, for example ownerApi("GET", "/parts")
import { api } from "../api";

export function ownerApi(method, path, body) {
  return api(method, "/owner" + path, body, "owner");
}
