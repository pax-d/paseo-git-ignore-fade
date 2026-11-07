import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const ignoredRpc = defineRpc({
  name: "ignored.list",
  input: z.object({ workspaceId: z.string().min(1).max(200) }),
  output: z.object({ paths: z.array(z.string()) }),
});
