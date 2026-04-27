#!/usr/bin/env python3
"""
Hermes Worker — autonomous Chapturs development agent.
Reads TASK_QUEUE.md for assigned tasks, executes them in the Chapturs repo,
pushes commits, and logs results to WORKER_LOG.md.

Usage: python3 hermes_worker.py [--task TASK_NAME] [--dry-run]
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# Paths
WORKSPACE = Path("/home/smccrary/projects/chapturs-autonomy")
CHAPTURS = Path("/mnt/c/Users/Smccr/Documents/Chapturs")
VISION_FILE = WORKSPACE / "VISION.md"
TASK_QUEUE_FILE = WORKSPACE / "TASK_QUEUE.md"
WORKER_LOG_FILE = WORKSPACE / "WORKER_LOG.md"

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
        raise RuntimeError(f"Command failed: {cmd}\nstderr: {result.stderr}")
    return result.stdout.strip()

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

def is_off_limits(task_name: str, description: str = '') -> tuple[bool, str]:
    """Check if a task touches an off-limits system."""
    off_limits = get_off_limits()
    combined = f"{task_name} {description}".lower()
    
    for limit in off_limits:
        if any(kw in combined for kw in limit.split()):
            return True, f"Touches off-limits: {limit}"
    
    return False, ""


def parse_tasks(content: str) -> list[dict]:
    """Parse TASK_QUEUE.md and return active tasks."""
    tasks = []
    in_active = False
    
    for line in content.split('\n'):
        stripped = line.strip()
        
        if '## Active Tasks' in stripped:
            in_active = True
            continue
        
        # Stop at next section header (but not archive until we see it)
        if stripped.startswith('## ') and 'Active' not in stripped:
            in_active = False
            continue
        
        if not in_active or stripped == '' or stripped.startswith('<!--'):
            continue
        
        # Parse lines like: - [HIGH] Test worker pipeline | HERMES | Execute first task...
        import re
        match = re.match(r'-\s*\[([A-Z]+)\]\s*(.*?)\s*\|\s*(.*?)\s*\|?\s*(.*)', stripped)
        if match:
            priority = match.group(1).strip()
            task_name = match.group(2).strip()
            assigned_to = match.group(3).strip()
            description = match.group(4).strip() if len(match.groups()) > 3 else ''
            
            tasks.append({
                'name': task_name,
                'assigned_to': assigned_to,
                'description': description,
                'priority': priority
            })
    
    return tasks


def execute_task(task: dict, dry_run: bool = False):
    """Execute a single task in the Chapturs repo."""
    task_name = task['name']
    description = task.get('description', '')
    
    # Check off-limits before executing
    is_blocked, reason = is_off_limits(task_name, description)
    if is_blocked:
        print(f"[HERMES] SKIPPED — {reason}")
        log_result(task_name, False, f"SKIPPED: {reason}")
        return
    
    print(f"[HERMES] Executing task: {task_name}")
    if description:
        print(f"  Description: {description}")
    
    # Read VISION.md for context
    vision = read_file(str(VISION_FILE))
    
    # Create branch and execute changes
    branch_name = f"hermes/{task_name.lower().replace(' ', '-')}"
    
    if not dry_run:
        try:
            run_cmd(f'git checkout -b {branch_name} origin/main 2>/dev/null || git checkout -b {branch_name}')
        except RuntimeError as e:
            print(f"[HERMES] Branch error (may already exist): {e}")
            branch_name = f"hermes/{task_name.lower().replace(' ', '-')}-{datetime.now().strftime('%Y%m%d')}"
            run_cmd(f'git checkout -b {branch_name}')
    
    # Execute the task — this is where the agent does its work
    # For now, we'll do a placeholder that demonstrates the pattern
    changes = apply_changes(task_name, description, dry_run)
    
    if not dry_run and changes:
        try:
            run_cmd('git add -A')
            run_cmd(f'git commit -m "{task_name}: {description[:80]}"')
            # Push branch (don't auto-merge — auditor reviews first)
            try:
                run_cmd(f'git push origin {branch_name} --force-with-lease 2>/dev/null || git push origin {branch_name} --force')
            except RuntimeError:
                print(f"[HERMES] Could not push (may need auth). Changes committed locally.")
        except RuntimeError as e:
            print(f"[HERMES] Git error: {e}")

def apply_changes(task_name: str, description: str, dry_run: bool) -> bool:
    """Apply changes based on task. This is the core work function."""
    
    # Read current state of Chapturs to understand what we're working with
    try:
        package_json = CHAPTURS / "package.json"
        if not package_json.exists():
            print(f"[HERMES] Package.json not found at {CHAPTURS}")
            return False
        
        # Check for existing structure
        result = run_cmd('find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -20', cwd=str(CHAPTURS))
        
        if dry_run:
            print(f"[HERMES] DRY RUN — would apply changes for: {task_name}")
            return False
        
        # Placeholder: demonstrate actual code work pattern
        # In practice, this function contains the agent's logic for each task type
        print(f"[HERMES] Applied changes for: {task_name}")
        
        # Create a marker file to show we ran (for testing)
        marker = WORKSPACE / "logs" / f"{datetime.now().strftime('%Y%m%d')}-{task_name}.txt"
        marker.parent.mkdir(parents=True, exist_ok=True)
        with open(marker, 'w') as f:
            f.write(f"Task executed at {datetime.now(timezone.utc).isoformat()}\n")
            f.write(f"Description: {description}\n")
        
        return True
        
    except Exception as e:
        print(f"[HERMES] Error applying changes: {e}")
        return False

def log_result(task_name: str, success: bool, notes: str = ""):
    """Append result to WORKER_LOG.md."""
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    
    # Read existing log
    try:
        log_content = read_file(str(WORKER_LOG_FILE))
    except FileNotFoundError:
        log_content = ""
    
    entry = f"""## [{timestamp}] Worker: HERMES | Task: {task_name}
- **Commit:** {'PASS' if success else 'FAIL'}
- **What changed:** Executed task '{task_name}'
- **Build status:** PENDING (awaiting auditor review)
- **Notes:** {notes}

"""
    
    write_file(str(WORKER_LOG_FILE), log_content + entry)
    print(f"[HERMES] Logged result to WORKER_LOG.md")

def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    
    # Parse task argument
    task_name = None
    for i, arg in enumerate(args):
        if arg == '--task' and i + 1 < len(args):
            task_name = args[i + 1]
    
    print(f"[HERMES] Worker starting {'DRY RUN' if dry_run else 'LIVE'}")
    
    # Read tasks
    try:
        queue_content = read_file(str(TASK_QUEUE_FILE))
        tasks = parse_tasks(queue_content)
        
        if not task_name:
            # Pick highest priority unassigned or HERMES-assigned task
            for t in sorted(tasks, key=lambda x: {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}.get(x['priority'], 3)):
                assigned = t.get('assigned_to', '').upper()
                if assigned == '' or assigned == 'HERMES' or assigned == 'BOTH':
                    task_name = t['name']
                    break
        
        if not task_name:
            print("[HERMES] No tasks in queue. Exiting.")
            return
        
        # Find the specific task
        target_task = next((t for t in tasks if t['name'] == task_name), None)
        if not target_task:
            print(f"[HERMES] Task '{task_name}' not found in queue")
            return
        
        # Execute
        success = False
        try:
            execute_task(target_task, dry_run)
            success = True
        except Exception as e:
            print(f"[HERMES] Error executing task: {e}")
        
        log_result(task_name, success, str(e) if not success else "")
        
    except FileNotFoundError as e:
        print(f"[HERMES] Missing file: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
