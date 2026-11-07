import type { PluginServerContext } from "@getpaseo/plugin/server";
import { listIgnored } from "./server/ignored";
import { ignoredRpc } from "./shared/ignored";

export default function contribute(server: PluginServerContext) {
  server.handle(ignoredRpc, listIgnored);
  return () => {};
}
