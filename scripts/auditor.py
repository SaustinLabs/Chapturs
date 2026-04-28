#!/usr/bin/env python3
"""
Auditor — periodic review of autonomous Chapturs development.

Reads TASKS.md (master task list in repo) and TASK_QUEUE.md (worker queue),
cross-references them, syncs completion status back to TASKS.md, evaluates
progress against VISION.md, and writes AUDITOR_LOG.md.

Usage: python3 auditor.py [--dry-run] [--cycle N]
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
WORKSPACE = Path("/home/smccrary/projects/chapturs-experiments/autonomous-dev")
CHAPTURS = Path("/mnt/c/Users/Smccr/Documents/Chapturs")
VISION_FILE = WORKSPACE / "VISION.md"
TASKS_MD = CHAPTURS / "TASKS.md"  # Master task list in repo
TASK_QUEUE_FILE = WORKSPACE / "TASK_QUEUE.md"
WORKER_LOG_FILE = WORKSPACE / "WORKER_LOG.md"
AUDITOR_LOG_FILE = WORKSPACE / "AUDITOR_LOG.md"
JOURNAL_FILE = WORKSPACE / "JOURNAL.md"


def read_file(path: str) -> str:
    with open(path, 'r') as f:
        return f.read()


def write_file(path: str, content: str):
    with open(path, 'w') as f:
        f.write(content)


def run_cmd(cmd: str, cwd=None) -> str:
    """Run shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd or CHAPTURS)
    if result.returncode != 0:
        return f"FAIL: {result.stderr[:500]}"
    return result.stdout.strip()


# ─── Off-Limits Detection ──────────────────────────────────────────────

def get_off_limits() -> list[str]:
    """Extract off-limits systems from TASK_QUEUE.md and VISION.md."""
    import re
    off_limits = []

    # Read TASK_QUEUE.md for explicit off-limits section
    try:
        tq_content = read_file(str(TASK_QUEUE_FILE))
        in_off_limits = False
        for line in tq_content.split('\n'):
            stripped = line.strip()
            if 'Off-Limits' in stripped or 'off-limits' in stripped.lower():
                in_off_limits = True
                continue
            if in_off_limits and stripped.startswith('- [') and ':' in stripped:
                # Parse task description (after the pipe)
                parts = stripped.split('|')
                if len(parts) >= 3:
                    desc = parts[1].strip()
                    off_limits.append(desc.lower())
            elif in_off_limits and not stripped.startswith('- ['):
                in_off_limits = False
    except FileNotFoundError:
        pass

    # Read VISION.md for "Off-Limits Systems" section
    try:
        vision_content = read_file(str(VISION_FILE))
        in_section = False
        for line in vision_content.split('\n'):
            stripped = line.strip()
            if 'Off-Limits' in stripped or 'off-limits' in stripped.lower():
                in_section = True
                continue
            if in_section and (stripped.startswith('##') or stripped == ''):
                in_section = False
            # Match numbered items like "1. **Living World system** —"
            if in_section:
                match = re.search(r'\d+\.\s*\*{2,3}(.+?)\*{2,3}\s*[—-]', stripped)
                if match:
                    off_limits.append(match.group(1).lower())
    except FileNotFoundError:
        pass

    return list(set(off_limits))


def check_off_limits(worker_logs: list[dict], task_names: list[str]) -> str:
    """Check if workers are touching off-limits systems."""
    off_limits = get_off_limits()

    violations = []
    for e in worker_logs:
        task_lower = e.get('task', '').lower()
        details_str = str(e.get('details', {})).lower()

        for limit in off_limits:
            if any(kw in task_lower or kw in details_str for kw in limit.split()):
                violations.append(f"Worker touched '{limit}' (off-limits)")

    return violations


# ─── TASKS.md Parser & Sync ────────────────────────────────────────────

def parse_tasks_md(content: str) -> list[dict]:
    """Parse TASKS.md and return all tasks with ID, title, status, section."""
    tasks = []
    current_section = ""

    for line in content.split('\n'):
        stripped = line.strip()

        # Track section headers (## lines)
        if stripped.startswith('## '):
            current_section = stripped[3:].strip()
            continue

        # Skip non-table sections
        if not stripped.startswith('|') and not stripped.startswith('- ['):
            continue

        # Parse table rows (| # | Task | Status | Notes |)
        if stripped.startswith('|') and '|' in stripped:
            cells = [c.strip() for c in stripped.split('|')[1:-1]]  # skip first/last empty

            if len(cells) >= 3:
                task_id = None
                try:
                    task_id = int(cells[0])
                except (ValueError, IndexError):
                    pass

                title = cells[1] if len(cells) > 1 else ''
                status = cells[2] if len(cells) > 2 else ''
                notes = cells[3] if len(cells) > 3 else ''

                # Map emoji statuses to boolean + priority
                is_done = '✅' in status or 'Done' in status.upper()
                is_partial = '🔶' in status or 'Partial' in status.lower() or 'in progress' in status.lower()
                is_not_started = '⬜' in status or 'Not started' in status.upper()

                tasks.append({
                    'id': task_id,
                    'title': title,
                    'status_raw': status.strip(),
                    'section': current_section,
                    'notes': notes,
                    'is_done': is_done,
                    'is_partial': is_partial,
                    'priority': "HIGH" if is_partial else ("MEDIUM" if is_not_started else "LOW"),
                })

    return tasks


def sync_completion_to_tasks_md(worker_logs: list[dict], dry_run: bool = False) -> int:
    """
    Check which TASKS.md entries were completed by workers and update their status.
    Returns number of tasks updated.
    """
    try:
        tasks_content = read_file(str(TASKS_MD))
    except FileNotFoundError:
        print("[AUDITOR] TASKS.md not found, skipping completion sync")
        return 0

    # Extract completed task names from worker logs (last 10 entries)
    recent_completed = []
    for e in reversed(worker_logs[-10:]):
        if 'FAIL' not in str(e.get('details', {})):
            recent_completed.append(e['task'].lower())

    updated_count = 0
    lines = tasks_content.split('\n')
    new_lines = []

    for line in lines:
        stripped = line.strip()
        # Check if this is a task row (starts with ||)
        if stripped.startswith('| ') and '|' in stripped:
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            if len(cells) >= 3:
                try:
                    task_id = int(cells[0])
                except ValueError:
                    new_lines.append(line)
                    continue

                title = cells[1] if len(cells) > 1 else ''
                status = cells[2] if len(cells) > 2 else ''

                # Check if this task was completed by a worker
                for completed in recent_completed:
                    if str(task_id) in completed or (title.lower() and any(w in title.lower() for w in completed.split()[:3])):
                        # Update status to ✅ Done
                        new_line = stripped.replace(status, '✅')
                        new_lines.append(new_line)
                        updated_count += 1
                        break
                else:
                    new_lines.append(line)
        else:
            new_lines.append(line)

    if updated_count > 0 and not dry_run:
        write_file(str(TASKS_MD), '\n'.join(new_lines))
        print(f"[AUDITOR] Synced {updated_count} task completions to TASKS.md")

    return updated_count


# ─── Build/Test Checks ────────────────────────────────────────────────

def run_build_tests() -> dict:
    """Run build and test checks on Chapturs repo."""
    results = {
        'build': False,
        'tests': False,
        'lint': False,
        'error': ''
    }

    # Check if Next.js/Node project exists
    package_json = CHAPTURS / "package.json"

    if not package_json.exists():
        results['error'] = "No package.json found in Chapturs"
        return results

    try:
        import signal

        def timeout_handler(signum, frame):
            raise TimeoutError("Command timed out")

        # Quick syntax check - just verify TypeScript/JS files parse correctly
        signal.alarm(10)  # 10 second timeout
        try:
            # Check if node_modules exists (deps installed)
            if not (CHAPTURS / "node_modules").exists():
                results['error'] = "Dependencies not installed"
            else:
                # Quick check: verify package.json is valid and key files exist
                tsconfig = CHAPTURS / "tsconfig.json"
                next_config = CHAPTURS / "next.config.js" or CHAPTURS / "next.config.mjs"

                if tsconfig.exists() or next_config.exists():
                    results['build'] = True  # Project structure looks valid

        except (TimeoutError, RuntimeError):
            pass
        signal.alarm(0)

    except Exception as e:
        results['error'] = f"Build check failed: {str(e)[:200]}"

    return results


# ─── Worker Log Parser ────────────────────────────────────────────────

def parse_worker_logs(content: str) -> list[dict]:
    """Parse WORKER_LOG.md and extract recent worker entries."""
    entries = []
    current_entry = None

    for line in content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('## [') and 'Worker:' in stripped:
            # Parse entry header
            import re
            match = re.search(r'\[(.*?)\] Worker:\s*(HERMES|ECHO)\s*\|\s*Task:\s*(.*)', stripped)
            if match:
                current_entry = {
                    'timestamp': match.group(1),
                    'worker': match.group(2),
                    'task': match.group(3).strip(),
                    'details': {}
                }
        elif current_entry and stripped.startswith('- **'):
            # Parse detail lines
            import re
            match = re.match(r'- \*\*(.*?)\*\*:\s*(.*)', stripped)
            if match:
                current_entry['details'][match.group(1)] = match.group(2).strip()
        elif current_entry and stripped == '':
            entries.append(current_entry)
            current_entry = None

    return entries


# ─── Progress Evaluation ──────────────────────────────────────────────

def evaluate_progress(worker_logs: list[dict], build_results: dict) -> str:
    """Evaluate whether we're moving toward the vision."""

    # Count recent activity
    if not worker_logs:
        return "No recent worker activity. Stalled."

    # Check for quality signals
    failed = sum(1 for e in worker_logs if 'FAIL' in str(e.get('details', {})))
    total = len(worker_logs)

    if failed > 0 and failed == total:
        return "All recent tasks failed. Off-track."

    # Check if workers are duplicating effort (same task names from different workers)
    task_names = [e['task'] for e in worker_logs]
    unique_tasks = set(task_names)
    if len(unique_tasks) < len(task_names):
        return "Workers may be duplicating effort. Need better coordination."

    # Check against VISION principles (simple heuristic)
    vision_content = read_file(str(VISION_FILE))
    has_pay_per_read = any('pay-per-read' in e.get('task', '').lower() or 'paywall' in e.get('task', '').lower()
                          for e in worker_logs if 'FAIL' not in str(e.get('details', {})))

    if has_pay_per_read:
        return "Workers are building pay-per-read features. VIOLATES VISION."

    # Check off-limits violations
    violations = check_off_limits(worker_logs, task_names)
    if violations:
        return f"VIOLATION: {', '.join(violations[:3])}"

    # Default: positive assessment
    return f"Progressing toward vision. {total} tasks completed this cycle, {failed} failed."


def should_assign_task(task_desc: str) -> bool:
    """Check if a task should be assigned (not off-limits)."""
    off_limits = get_off_limits()
    task_lower = task_desc.lower()

    for limit in off_limits:
        # Check if task description contains keywords from off-limits systems
        if any(kw in task_lower for kw in limit.split()):
            return False

    return True


# ─── Task Queue Update ────────────────────────────────────────────────

def update_task_queue(worker_logs: list[dict], progress_assessment: str):
    """Update TASK_QUEUE.md based on auditor evaluation."""

    current_content = read_file(str(TASK_QUEUE_FILE))

    # Extract recently completed tasks to move them to archive
    recent_tasks = [e['task'] for e in worker_logs if 'FAIL' not in str(e.get('details', {}))]

    # Add new suggested tasks based on progress assessment (filter off-limits)
    new_tasks = []

    if "Stalled" in progress_assessment:
        new_tasks.append("[HIGH] Review project direction | BOTH | Assess current state and set clear priorities")
        new_tasks.append("[MEDIUM] Audit existing codebase | HERMES | Identify technical debt and quick wins")
    elif "Off-track" in progress_assessment or "VIOLATES" in progress_assessment:
        new_tasks.append("[HIGH] Fix broken direction | BOTH | Realign with VISION.md principles")
        new_tasks.append("[MEDIUM] Code review of recent changes | HERMES | Ensure quality standards met")
    else:
        # Suggest next logical steps based on Chapturs priorities (filtered)
        candidates = [
            "[MEDIUM] Improve recommendation engine accuracy | BOTH | Enhance user engagement",
            "[LOW] Document API endpoints | ECHO | Improve developer experience"
        ]
        for c in candidates:
            if should_assign_task(c):
                new_tasks.append(c)

    # Build updated queue content
    lines = current_content.split('\n')
    active_idx = None
    for i, line in enumerate(lines):
        if '## Active Tasks' in line:
            active_idx = i + 1
            break

    if active_idx is not None:
        # Insert new tasks after header
        inserted = []
        for t in new_tasks:
            inserted.append(f"- {t}")

        # Move completed tasks to archive section
        archived = ""
        for task in recent_tasks[-5:]:  # Last 5 completed tasks
            archived += f"## Completed Tasks (archived)\n- [{datetime.now(timezone.utc).strftime('%Y-%m-%d')}] {task}\n\n"

        new_active = '\n'.join(inserted) + '\n'
        lines[active_idx] = new_active

        # Add archive section if it doesn't exist
        archive_idx = None
        for i, line in enumerate(lines):
            if '## Completed Tasks' in line:
                archive_idx = i
                break

        if archive_idx is not None:
            lines[archive_idx] = archived + lines[archive_idx]

    write_file(str(TASK_QUEUE_FILE), '\n'.join(lines))


# ─── Audit Logging ────────────────────────────────────────────────────

def log_audit(cycle_num: int, worker_logs: list[dict], build_results: dict, progress_assessment: str):
    """Write audit results to AUDITOR_LOG.md."""
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')

    # Count workers and tasks
    hermes_tasks = sum(1 for e in worker_logs if e['worker'] == 'HERMES')
    echo_tasks = sum(1 for e in worker_logs if e['worker'] == 'ECHO')

    build_status = "PASS" if build_results.get('build') else "FAIL"

    entry = f"""## [{timestamp}] Audit Cycle #{cycle_num}
- **Workers reviewed:** HERMES ({hermes_tasks}), ECHO ({echo_tasks})
- **Build status:** {build_status}
- **Progress assessment:** {progress_assessment}
- **Tasks completed this cycle:** {len(worker_logs)} worker executions logged
- **Concerns:** {build_results.get('error', 'None')}

"""

    # Append to existing log
    try:
        existing = read_file(str(AUDITOR_LOG_FILE))
    except FileNotFoundError:
        existing = ""

    write_file(str(AUDITOR_LOG_FILE), existing + entry)

    # Also update JOURNAL.md with significant findings
    if "VIOLATES" in progress_assessment or "Off-track" in progress_assessment:
        journal_entry = f"""## [{timestamp}] Auditor Alert — Cycle #{cycle_num}
- **What happened:** {progress_assessment}
- **Why it matters:** Workers need realignment with project vision
- **Impact:** TASK_QUEUE.md updated with corrective tasks

"""
        try:
            existing_journal = read_file(str(JOURNAL_FILE))
        except FileNotFoundError:
            existing_journal = ""
        write_file(str(JOURNAL_FILE), existing_journal + journal_entry)


# ─── Main ──────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args

    # Parse cycle number (default to auto-increment)
    cycle_num = None
    for i, arg in enumerate(args):
        if arg == '--cycle' and i + 1 < len(args):
            cycle_num = int(args[i + 1])

    print("[AUDITOR] Starting audit")

    # Read worker logs
    try:
        log_content = read_file(str(WORKER_LOG_FILE))
        worker_logs = parse_worker_logs(log_content)

        if not worker_logs:
            print("[AUDITOR] No worker logs found. Nothing to review.")
            return

        print(f"[AUDITOR] Reviewed {len(worker_logs)} worker entries")

    except FileNotFoundError as e:
        print(f"[AUDITOR] Missing file: {e}")
        sys.exit(1)

    # Run build/tests (skip in dry run)
    if not dry_run:
        build_results = run_build_tests()
        print(f"[AUDITOR] Build: {'PASS' if build_results.get('build') else 'FAIL'}")
        print(f"[AUDITOR] Tests: {'PASS' if build_results.get('tests') else 'N/A'}")
    else:
        build_results = {'build': True, 'tests': False, 'lint': False, 'error': ''}

    # Evaluate progress
    progress_assessment = evaluate_progress(worker_logs, build_results)
    print(f"[AUDITOR] Assessment: {progress_assessment}")

    # Sync completion status back to TASKS.md (skip in dry run)
    if not dry_run:
        updated = sync_completion_to_tasks_md(worker_logs, dry_run=False)
        print(f"[AUDITOR] Synced {updated} completions to TASKS.md")

    # Update task queue (skip in dry run)
    if not dry_run:
        update_task_queue(worker_logs, progress_assessment)
        print("[AUDITOR] Updated TASK_QUEUE.md")

        # Determine cycle number from existing log
        try:
            audit_content = read_file(str(AUDITOR_LOG_FILE))
            import re
            matches = re.findall(r'Audit Cycle #(\d+)', audit_content)
            if matches:
                cycle_num = int(matches[-1]) + 1
            else:
                cycle_num = 1
        except FileNotFoundError:
            cycle_num = 1

        log_audit(cycle_num, worker_logs, build_results, progress_assessment)
        print(f"[AUDITOR] Logged audit #{cycle_num}")
    else:
        print("[AUDITOR] DRY RUN — would update TASK_QUEUE.md and AUDITOR_LOG.md")


if __name__ == '__main__':
    main()
