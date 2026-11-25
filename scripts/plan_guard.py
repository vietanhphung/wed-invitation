#!/usr/bin/env python3
"""Summarise a Terraform JSON plan and refuse destructive changes.

    terraform show -json tfplan > tfplan.json
    python3 scripts/plan_guard.py tfplan.json [--markdown]

Exit 0: only creates / in-place updates (or no changes).
Exit 1: something would be destroyed or replaced -> stop and review by hand.
Exit 3: no changes at all (lets callers skip the apply prompt).
"""
import json
import sys

LABELS = {
    "create": "Resources to create",
    "update": "Resources to update in place",
    "replace": "Resources to REPLACE (destroy + create)",
    "delete": "Resources to DESTROY",
}


def main() -> int:
    path = sys.argv[1]
    markdown = "--markdown" in sys.argv
    with open(path) as f:
        plan = json.load(f)

    groups = {k: [] for k in LABELS}
    for rc in plan.get("resource_changes", []):
        actions = rc["change"]["actions"]
        if actions in (["no-op"], ["read"]):
            continue
        if "delete" in actions and "create" in actions:
            kind = "replace"
        elif "delete" in actions:
            kind = "delete"
        else:
            kind = actions[0]
        groups.setdefault(kind, []).append(rc["address"])

    if not any(groups.values()):
        print("No changes. Infrastructure matches the configuration.")
        return 3

    for kind, label in LABELS.items():
        if groups[kind]:
            print(f"\n{'### ' if markdown else ''}{label} ({len(groups[kind])}){'' if markdown else ':'}")
            for addr in groups[kind]:
                print(f"{'- `' if markdown else '  '}{addr}{'`' if markdown else ''}")

    if groups["delete"] or groups["replace"]:
        print("\nSTOP: this plan destroys or replaces existing resources. Not applying automatically.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
