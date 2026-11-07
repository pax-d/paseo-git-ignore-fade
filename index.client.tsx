import type { PluginClientContext } from "@getpaseo/plugin/client";
import { ignoredRpc } from "./shared/ignored";
import { installDimming } from "./client/web";

export default function contribute(client: PluginClientContext) {
  return installDimming(async (workspaceId) => (await client.rpc(ignoredRpc, { workspaceId })).paths);
}
