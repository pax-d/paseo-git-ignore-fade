**See what matters at a glance.** Git Ignore Fade dims everything git ignores in the Files explorer — `node_modules`, `dist`, `.venv`, `.env`, log files — so your source stands out, just like in your editor.

- **Zero setup.** Uses your existing `.gitignore`, `.git/info/exclude` and global excludes.
- **Stays current.** The ignore list refreshes every 15 seconds, so fresh build output fades on its own.
- **Local only.** The daemon runs `git ls-files --others --ignored --exclude-standard --directory` in the open workspace; nothing is sent anywhere else.

Desktop and web only. Paseo has no explorer decoration API yet, so the plugin reads rows from the page and may need an update after a Paseo release. Deep rows fade only while their parent folders are in view.
