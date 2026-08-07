#!/usr/bin/env bash
# UserPromptSubmit hook: inject a one-line pipeline router on every prompt.
# Fail-open: any error must leave the prompt untouched.

cat >/dev/null 2>&1

command -v jq >/dev/null 2>&1 || exit 0

jq -nc '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: "smart-management-ui: if this request is a code task (fix / feature / refactor / diagnose), invoke the smart-pipeline skill BEFORE any edit; trivial fixes use its fast path."
  }
}' 2>/dev/null

exit 0
