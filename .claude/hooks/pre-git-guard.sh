#!/usr/bin/env bash
# PreToolUse hook (Bash): surface history-writing git commands as a permission ask (Rule E).
# Read-only git passes silently. "ask" (not deny) preserves the documented per-instance
# "commit this for me" exception - the human approves in the moment.
# Fail-open: any error exits 0 and lets the command through.

command -v jq >/dev/null 2>&1 || exit 0

stdin=$(cat 2>/dev/null) || exit 0
cmd=$(printf '%s' "$stdin" | jq -r '.tool_input.command // empty' 2>/dev/null) || exit 0
[ -z "${cmd//[[:space:]]/}" ] && exit 0

# Verbs anchored to the subcommand position (flags allowed between) so
# read-only forms like `git log --grep=commit` never match.
history_verbs='\bgit\s+(?:-\S+\s+)*(commit|push|merge|rebase|revert|cherry-pick)\b'
reset_hard='\bgit\s+(?:-\S+\s+)*reset\b[^|;&]{0,200}--hard'
tag_create='\bgit\s+(?:-\S+\s+)*tag\s+(?!(-l\b|--list\b|-n\b))\S'

if printf '%s' "$cmd" | grep -qPi "$history_verbs" \
  || printf '%s' "$cmd" | grep -qPi "$reset_hard" \
  || printf '%s' "$cmd" | grep -qPi "$tag_create"; then
  jq -nc '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: "Rule E (CLAUDE.md): Claude never runs history-writing git; the human commits. Approve only if you explicitly asked for this operation."
    }
  }' 2>/dev/null
fi

exit 0
