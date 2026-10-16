#!/usr/bin/env python3
"""Minimal HTTP stub for Toolbox Identify → LLM URL testing.

POST /classify with Toolbox JSON; returns { "guesses": [...] }.
Handles CORS preflight for browser fetch from the OpenWebRX origin.
"""
from __future__ import annotations

import argparse
import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

LOG = logging.getLogger("owrx-identify-stub")


def build_guesses(payload: dict[str, Any]) -> list[dict[str, Any]]:
    hz = int(payload.get("frequencyHz") or 0)
    fp = payload.get("fingerprint") if isinstance(payload.get("fingerprint"), dict) else {}
    mhz = hz / 1e6 if hz else 0.0
    w = float(fp.get("widthHz") or 0)
    snr = float(fp.get("snr") or 0)
    guesses: list[dict[str, Any]] = [
        {
            "id": "stub_ok",
            "label": "Stub classifier reached",
            "score": 96,
            "detail": "Toolbox Identify now POST succeeded — replace this stub with your LLM/service.",
            "mode": "",
        }
    ]
    if 87.0 <= mhz <= 108.0 and w >= 50000:
        guesses.append(
            {
                "id": "wfm",
                "label": "FM broadcast (stub rule)",
                "score": 78,
                "detail": f"~{mhz:.2f} MHz, width ~{w/1000:.0f} kHz",
                "mode": "wfm",
            }
        )
    elif 118.0 <= mhz <= 137.0:
        guesses.append(
            {
                "id": "airband",
                "label": "Airband voice (stub rule)",
                "score": 74,
                "detail": f"VHF airband dial {mhz:.3f} MHz",
                "mode": "am",
            }
        )
    elif 144.0 <= mhz <= 148.0:
        guesses.append(
            {
                "id": "ham2m",
                "label": "2m ham (stub rule)",
                "score": 72,
                "detail": f"2m band {mhz:.3f} MHz",
                "mode": "nfm",
            }
        )
    elif snr >= 8 and 0 < w < 500:
        guesses.append(
            {
                "id": "cw",
                "label": "Narrow carrier (stub rule)",
                "score": 65,
                "detail": f"width ~{w:.0f} Hz, SNR ~{snr:.1f} dB",
                "mode": "cw",
            }
        )
    guesses.sort(key=lambda g: g.get("score", 0), reverse=True)
    return guesses[:5]


class Handler(BaseHTTPRequestHandler):
    server_version = "OWRXIdentifyStub/1.0"

    def log_message(self, fmt: str, *args) -> None:
        LOG.info("%s - %s", self.address_string(), fmt % args)

    def _cors_origin(self) -> str:
        origin = self.headers.get("Origin", "")
        if origin:
            return origin
        return "*"

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
        if self.path.rstrip("/") in ("", "/classify", "/health"):
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "owrx-identify-classifier-stub",
                    "classify": "POST /classify with Toolbox JSON",
                },
            )
            return
        self._send_json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in ("/classify", ""):
            self._send_json(404, {"ok": False, "error": "POST /classify only"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json(400, {"ok": False, "error": "invalid JSON"})
            return
        guesses = build_guesses(payload if isinstance(payload, dict) else {})
        LOG.info(
            "classify freqHz=%s guesses=%s",
            payload.get("frequencyHz") if isinstance(payload, dict) else None,
            [g.get("label") for g in guesses],
        )
        self._send_json(200, {"ok": True, "guesses": guesses})


def main() -> None:
    ap = argparse.ArgumentParser(description="OWRX Identify classifier test stub")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=5055)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    LOG.info("listening on http://%s:%s/classify", args.host, args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        LOG.info("stopped")


if __name__ == "__main__":
    main()
