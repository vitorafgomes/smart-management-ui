#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): one-line Rule B reminder on src/**/*.{ts,html,scss} edits.
# Fail-open: any error exits 0 silently.

command -v jq >/dev/null 2>&1 || exit 0

stdin=$(cat 2>/dev/null) || exit 0
path=$(printf '%s' "$stdin" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -z "${path//[[:space:]]/}" ] && exit 0

if printf '%s' "$path" | grep -qEi 'src/.*\.(ts|html|scss)$'; then
  jq -nc '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: "Rule B: test this edit now; ng build with zero errors/warnings AND ng test --no-watch green before closing the task."
    }
  }' 2>/dev/null
fi

exit 0
