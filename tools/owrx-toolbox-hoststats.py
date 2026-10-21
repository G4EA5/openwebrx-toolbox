#!/usr/bin/env python3
"""Write hoststats.json beside toolbox.js for Settings → System.

Cron example (every minute):
  * * * * * /usr/bin/python3 /path/to/owrx-toolbox-hoststats.py

Env: OWRX_TOOLBOX_HOSTSTATS, OWRX_HTTP_PORTS (comma ports for listener peer scan, default 8073,18073,8074)
"""
from __future__ import annotations

import json
import os
import platform
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_OUT = Path(
    "/usr/lib/python3/dist-packages/htdocs/plugins/receiver/toolbox/hoststats.json"
)
DEFAULT_PORTS = (8073, 18073, 8074, 443, 80)


def mem_info_linux() -> tuple[int | None, int | None, int | None]:
    swap_total = swap_free = None
    try:
        with open("/proc/meminfo", encoding="utf-8") as f:
            lines = {k: int(v.split()[0]) for k, v in (ln.split(":", 1) for ln in f if ":" in ln)}
        total = lines.get("MemTotal")
        avail = lines.get("MemAvailable") or lines.get("MemFree")
        swap_total = lines.get("SwapTotal")
        swap_free = lines.get("SwapFree")
        if total is None or avail is None:
            return None, None, None
        st = (swap_total // 1024) if swap_total else None
        sf = (swap_free // 1024) if swap_free is not None else None
        swap_used = (st - sf) if st is not None and sf is not None else None
        return total // 1024, avail // 1024, swap_used
    except OSError:
        return None, None, None


def cpu_details() -> dict:
    model = ""
    cores = 0
    mhz = None
    try:
        with open("/proc/cpuinfo", encoding="utf-8") as f:
            for line in f:
                if not model and line.lower().startswith("model name"):
                    model = line.split(":", 1)[1].strip()
                if line.lower().startswith("processor"):
                    cores += 1
                if mhz is None and line.lower().startswith("cpu mhz"):
                    try:
                        mhz = round(float(line.split(":", 1)[1].strip()), 0)
                    except ValueError:
                        pass
    except OSError:
        pass
    if not cores:
        cores = os.cpu_count() or 0
    if not model:
        model = platform.processor() or platform.machine() or "CPU"
    return {"model": model, "cores": cores, "mhz": mhz}


def uptime_sec() -> int | None:
    try:
        with open("/proc/uptime", encoding="utf-8") as f:
            return int(float(f.read().split()[0]))
    except (OSError, ValueError, IndexError):
        return None


def disk_usage(path: str = "/") -> dict | None:
    try:
        st = os.statvfs(path)
        total = st.f_frsize * st.f_blocks
        free = st.f_frsize * st.f_bavail
        used = total - free
        pct = round(used * 100.0 / total, 1) if total else 0
        return {
            "path": path,
            "total_gb": round(total / (1024 ** 3), 2),
            "used_gb": round(used / (1024 ** 3), 2),
            "free_gb": round(free / (1024 ** 3), 2),
            "pct": pct,
        }
    except OSError:
        return None


def host_ips() -> list[dict]:
    out: list[dict] = []
    try:
        import socket

        host = platform.node()
        try:
            for info in socket.getaddrinfo(host, None, socket.AF_UNSPEC, socket.SOCK_STREAM):
                fam, _, _, _, sockaddr = info
                addr = sockaddr[0]
                if addr.startswith("fe80") or addr == "::1":
                    continue
                kind = "IPv6" if fam == socket.AF_INET6 else "IPv4"
                if any(x["addr"] == addr for x in out):
                    continue
                out.append({"addr": addr, "kind": kind, "iface": "hostname"})
        except OSError:
            pass
    except Exception:
        pass
    try:
        raw = subprocess.check_output(["hostname", "-I"], text=True, timeout=2).strip()
        for addr in raw.split():
            if not addr or addr.startswith("fe80"):
                continue
            kind = "IPv6" if ":" in addr else "IPv4"
            if any(x["addr"] == addr for x in out):
                continue
            out.append({"addr": addr, "kind": kind, "iface": "lan"})
    except (OSError, subprocess.SubprocessError):
        pass
    return out[:12]


def list_ws_peers(ports: tuple[int, ...]) -> list[dict]:
    peers: dict[str, dict] = {}
    port_set = set(ports)
    try:
        out = subprocess.check_output(["ss", "-tn", "state", "established"], text=True, timeout=4)
    except (OSError, subprocess.SubprocessError):
        return []
    now = time.time()
    for line in out.splitlines():
        m = re.search(r"(\S+:\d+)\s+(\S+:\d+)\s*$", line.strip())
        if not m:
            continue
        local, remote = m.group(1), m.group(2)
        lm = re.match(r"(?P<ip>[\d.]+|\[[^\]]+\]):(?P<port>\d+)$", local)
        rm = re.match(r"(?P<ip>[\d.]+|\[[^\]]+\]):(?P<port>\d+)$", remote)
        if not lm or not rm:
            continue
        try:
            lport = int(lm.group("port"))
        except ValueError:
            continue
        if lport not in port_set:
            continue
        ip = rm.group("ip").strip("[]")
        if "127.0.0.1" in ip or ip.startswith("127.") or ip == "::1":
            continue
        if ip not in peers:
            peers[ip] = {"ip": ip, "connections": 0, "local_ports": []}
        peers[ip]["connections"] += 1
        if lport not in peers[ip]["local_ports"]:
            peers[ip]["local_ports"].append(lport)
    return sorted(peers.values(), key=lambda x: (-x["connections"], x["ip"]))


def owrx_pids() -> list[int]:
    pids: list[int] = []
    proc = Path("/proc")
    if not proc.is_dir():
        return pids
    for ent in proc.iterdir():
        if not ent.name.isdigit():
            continue
        try:
            raw = (ent / "cmdline").read_bytes().replace(b"\x00", b" ").decode("utf-8", "replace").lower()
        except OSError:
            continue
        if not raw.strip():
            continue
        if "owrx-toolbox-hoststats" in raw:
            continue
        if "stub.py" in raw or "owrx-audio-stt" in raw or "owrx-identify" in raw:
            continue
        if "/openwebrx" in raw or raw.strip().endswith(" openwebrx") or " nmux" in raw:
            pids.append(int(ent.name))
    return sorted(set(pids))


def pid_cmdline(pid: int, max_len: int = 96) -> str:
    try:
        raw = (Path(f"/proc/{pid}/cmdline").read_bytes().replace(b"\x00", b" ").decode("utf-8", "replace").strip())
        if len(raw) > max_len:
            return raw[: max_len - 1] + "…"
        return raw
    except OSError:
        return ""


def pid_rss_kb(pid: int) -> int:
    try:
        with open(f"/proc/{pid}/status", encoding="utf-8") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1])
    except (OSError, ValueError, IndexError):
        pass
    return 0


def pid_cpu_pct(pid: int, sample_s: float = 0.35) -> float | None:
    try:
        hz = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
    except (AttributeError, ValueError, OSError):
        hz = 100
    try:
        with open(f"/proc/{pid}/stat", encoding="utf-8") as f:
            parts = f.read().split()
        t0 = int(parts[13]) + int(parts[14])
        time.sleep(sample_s)
        with open(f"/proc/{pid}/stat", encoding="utf-8") as f:
            parts = f.read().split()
        t1 = int(parts[13]) + int(parts[14])
        delta = (t1 - t0) / hz
        return max(0.0, min(100.0, (delta / sample_s) * 100.0))
    except (OSError, ValueError, IndexError):
        return None


def toolbox_disk_kb(toolbox_dir: Path) -> int | None:
    total = 0
    for name in ("toolbox.js", "toolbox.css"):
        p = toolbox_dir / name
        try:
            total += p.stat().st_size
        except OSError:
            pass
    return total // 1024 if total else None


def parse_ports() -> tuple[int, ...]:
    raw = os.environ.get("OWRX_HTTP_PORTS", "")
    if not raw.strip():
        return DEFAULT_PORTS
    ports = []
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit():
            ports.append(int(part))
    return tuple(ports) if ports else DEFAULT_PORTS


def main() -> int:
    out = Path(os.environ.get("OWRX_TOOLBOX_HOSTSTATS", str(DEFAULT_OUT)))
    toolbox_dir = out.parent
    mem_total, mem_avail, swap_used_mb = mem_info_linux()
    cpu = cpu_details()
    pids = owrx_pids()
    rss_kb = sum(pid_rss_kb(p) for p in pids)
    cpu_vals = [pid_cpu_pct(p) for p in pids[:2]]
    cpu_vals = [c for c in cpu_vals if c is not None]
    cpu_pct = sum(cpu_vals) / len(cpu_vals) if cpu_vals else None
    processes = []
    for p in pids[:8]:
        rss = pid_rss_kb(p)
        proc_cpu = pid_cpu_pct(p) if len(processes) < 2 else None
        processes.append(
            {
                "pid": p,
                "rss_mb": round(rss / 1024.0, 1) if rss else 0.0,
                "cpu_pct": round(proc_cpu, 1) if proc_cpu is not None else None,
                "cmd": pid_cmdline(p),
            }
        )
    load = None
    try:
        load = [round(x, 2) for x in os.getloadavg()]
    except OSError:
        pass
    disk = disk_usage("/")
    payload = {
        "at": int(time.time()),
        "at_iso": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hostname": platform.node(),
        "platform": f"{platform.system()} {platform.release()}",
        "machine": platform.machine(),
        "kernel": platform.release(),
        "python": platform.python_version(),
        "cpu": cpu,
        "load": load,
        "uptime_sec": uptime_sec(),
        "mem_total_mb": mem_total,
        "mem_avail_mb": mem_avail,
        "mem_used_mb": (mem_total - mem_avail) if mem_total and mem_avail is not None else None,
        "swap_used_mb": swap_used_mb,
        "disk": disk,
        "ips": host_ips(),
        "ws_peers": list_ws_peers(parse_ports()),
        "owrx": {
            "pids": pids,
            "rss_mb": round(rss_kb / 1024.0, 1) if rss_kb else None,
            "cpu_pct": round(cpu_pct, 1) if cpu_pct is not None else None,
            "processes": processes,
        },
        "toolbox_on_disk_kb": toolbox_disk_kb(toolbox_dir),
        "toolbox_version": None,
    }
    try:
        ver_m = re.search(r'_version\s*=\s*"([^"]+)"', (toolbox_dir / "toolbox.js").read_text(encoding="utf-8", errors="ignore")[:800])
        if ver_m:
            payload["toolbox_version"] = ver_m.group(1)
    except OSError:
        pass
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
