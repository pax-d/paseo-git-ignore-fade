export interface Row { index: number; name: string; pad: number }

// Rows are virtualized, so a path is known only after a depth-0 row in the same contiguous run.
export function resolvePaths(rows: readonly Row[], rootPad: number | null): (string | null)[] {
  const out: (string | null)[] = [];
  let stack: { pad: number; name: string }[] | null = null;
  let prev = Number.NaN;
  for (const row of rows) {
    if (row.index !== prev + 1) stack = null;
    prev = row.index;
    if (row.index === 0 || (rootPad !== null && Math.abs(row.pad - rootPad) < 0.5)) stack = [];
    if (!stack) {
      out.push(null);
      continue;
    }
    while (stack.length && stack[stack.length - 1].pad >= row.pad - 0.5) stack.pop();
    out.push([...stack.map((s) => s.name), row.name].join("/"));
    stack.push({ pad: row.pad, name: row.name });
  }
  return out;
}

export function isIgnored(path: string, ignored: ReadonlySet<string>): boolean {
  for (let end = path.length; end > 0; end = path.lastIndexOf("/", end - 1)) {
    if (ignored.has(path.slice(0, end))) return true;
  }
  return false;
}
