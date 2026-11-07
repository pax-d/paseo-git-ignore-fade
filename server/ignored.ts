/// <reference types="node" />
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RpcInput } from "@getpaseo/plugin";
import type { PluginHandlerContext } from "@getpaseo/plugin/server";
import { ignoredRpc } from "../shared/ignored";

const run = promisify(execFile);

export async function listIgnored(
  { workspaceId }: RpcInput<typeof ignoredRpc>,
  { paseo }: PluginHandlerContext,
) {
  const ref = paseo.workspaces.ref(workspaceId);
  await ref.refresh();
  const cwd = ref.directory;
  if (!cwd) return { paths: [] };
  try {
    const { stdout } = await run(
      "git",
      ["-c", "core.fsmonitor=false", "ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"],
      { cwd, timeout: 10_000, maxBuffer: 16 * 1024 * 1024 },
    );
    return { paths: stdout.split("\0").filter(Boolean).map((p) => p.replace(/\/$/, "")) };
  } catch {
    return { paths: [] };
  }
}
