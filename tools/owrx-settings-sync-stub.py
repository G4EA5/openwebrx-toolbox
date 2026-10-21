#!/usr/bin/env python3
"""Minimal HTTP stub for Toolbox Settings → Settings sync URL (Push / Pull).

GET  — returns last pushed settings JSON (same shape as Export settings).
POST — replaces store with request JSON body; returns {ok: true}.

Homelab (user systemd):
  python3 tools/owrx-settings-sync-stub.py --host 0.0.0.0 --port 8787

Toolbox URL example:
  http://192.168.3.54:8787/toolbox-settings
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

LOG = logging.getLogger("owrx-settings-sync-stub")
STORE: dict[str, Any] = {}
STORE_PATH: Path | None = None


def load_store() -> None:
    global STORE
    if not STORE_PATH or not STORE_PATH.is_file():
        return
    try:
        raw = json.loads(STORE_PATH.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            STORE = raw
            LOG.info("loaded %s keys from %s", len(STORE), STORE_PATH)
    except (OSError, json.JSONDecodeError) as exc:
        LOG.warning("could not load store %s: %s", STORE_PATH, exc)


def save_store() -> None:
    if not STORE_PATH:
        return
    try:
        STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STORE_PATH.write_text(json.dumps(STORE, indent=2), encoding="utf-8")
    except OSError as exc:
        LOG.warning("could not save store %s: %s", STORE_PATH, exc)


class Handler(BaseHTTPRequestHandler):
    server_version = "OWRXSettingsSyncStub/1.0"

    def log_message(self, fmt: str, *args) -> None:
        LOG.info("%s - %s", self.address_string(), fmt % args)

    def _cors_origin(self) -> str:
        origin = self.headers.get("Origin", "")
        return origin if origin else "*"

    def _send_json(self, code: int, obj: dict[str, Any] | list[Any]) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", self._cors_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", self._cors_origin())
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if path in ("/", "/health", "/toolbox-settings"):
            if path == "/health":
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "service": "owrx-settings-sync-stub",
                        "keys": len(STORE),
                        "file": str(STORE_PATH) if STORE_PATH else None,
                    },
                )
                return
            self._send_json(200, STORE if STORE else {})
            return
        self._send_json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json(400, {"ok": False, "error": "invalid JSON"})
            return
        if not isinstance(payload, dict):
            self._send_json(400, {"ok": False, "error": "JSON object required"})
            return
        global STORE
        STORE = payload
        save_store()
        LOG.info("stored settings push keys=%s bytes=%s", len(STORE), len(raw))
        self._send_json(
            200,
            {
                "ok": True,
                "keys": len(STORE),
                "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            },
        )


def main() -> None:
    global STORE_PATH
    ap = argparse.ArgumentParser(description="OWRX Settings sync URL test stub")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8787)
    ap.add_argument(
        "--file",
        default=os.environ.get("OWRX_SETTINGS_SYNC_FILE", ""),
        help="Optional JSON file to persist pushes (default: in-memory only)",
    )
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    if args.file:
        STORE_PATH = Path(args.file).expanduser()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    load_store()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    LOG.info(
        "listening on http://%s:%s/toolbox-settings (GET pull / POST push)",
        args.host,
        args.port,
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        LOG.info("stopped")


if __name__ == "__main__":
    main()
