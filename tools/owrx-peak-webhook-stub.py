#!/usr/bin/env python3
"""Minimal HTTP stub for Toolbox Settings → Peak webhook testing.

Toolbox POSTs JSON {freq, name, db, band} when a band/range survey finds a new peak.
This stub logs payloads and returns 200. CORS reflects the browser Origin (OpenWebRX).

Homelab (user systemd):
  python3 tools/owrx-peak-webhook-stub.py --host 0.0.0.0 --port 5057

Toolbox Notify URL example:
  http://192.168.3.54:5057/peak
"""
from __future__ import annotations

import argparse
import json
import logging
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

LOG = logging.getLogger("owrx-peak-webhook-stub")
RECENT: deque[dict[str, Any]] = deque(maxlen=50)


def fmt_mhz(freq_hz: Any) -> str:
    try:
        hz = float(freq_hz)
    except (TypeError, ValueError):
        return "?"
    if hz >= 1e6:
        return f"{hz / 1e6:.6f}".rstrip("0").rstrip(".") + " MHz"
    return f"{hz:.0f} Hz"


class Handler(BaseHTTPRequestHandler):
    server_version = "OWRXPeakWebhookStub/1.0"

    def log_message(self, fmt: str, *args) -> None:
        LOG.info("%s - %s", self.address_string(), fmt % args)

    def _cors_origin(self) -> str:
        origin = self.headers.get("Origin", "")
        return origin if origin else "*"

    def _send_json(self, code: int, obj: dict[str, Any]) -> None:
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
        path = self.path.rstrip("/") or "/"
        if path in ("/", "/health", "/peak"):
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "owrx-peak-webhook-stub",
                    "post": "POST /peak with Toolbox {freq, name, db, band}",
                    "recent_count": len(RECENT),
                    "recent": list(RECENT)[-5:],
                },
            )
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
            payload = {}
        entry = {
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "freq_hz": payload.get("freq"),
            "mhz": fmt_mhz(payload.get("freq")),
            "name": payload.get("name") or "",
            "db": payload.get("db"),
            "band": payload.get("band") or "",
            "remote": self.address_string(),
        }
        RECENT.append(entry)
        LOG.info(
            "peak webhook freq=%s name=%s db=%s band=%s",
            entry["freq_hz"],
            entry["name"] or "-",
            entry["db"],
            entry["band"] or "-",
        )
        self._send_json(200, {"ok": True, "received": entry})


def main() -> None:
    ap = argparse.ArgumentParser(description="OWRX Peak webhook test stub")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=5057)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    LOG.info("listening on http://%s:%s/peak (GET /health for status)", args.host, args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        LOG.info("stopped")


if __name__ == "__main__":
    main()
