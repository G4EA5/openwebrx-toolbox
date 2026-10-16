#!/usr/bin/env python3
"""Minimal HTTP stub for Toolbox Audio → STT webhook testing.

POST /transcribe with Toolbox JSON; returns { "transcript", "summary?" }.
Handles CORS preflight for browser fetch from the OpenWebRX origin.
"""
from __future__ import annotations

import argparse
import base64
import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

LOG = logging.getLogger("owrx-audio-stt-stub")


def _clip_info(payload: dict[str, Any]) -> dict[str, Any]:
    clip = payload.get("clip") if isinstance(payload.get("clip"), dict) else {}
    b64 = clip.get("audioBase64") or ""
    audio_len = 0
    if isinstance(b64, str) and b64:
        try:
            audio_len = len(base64.b64decode(b64, validate=False))
        except (ValueError, TypeError):
            audio_len = len(b64) * 3 // 4
    freq_hz = int(clip.get("freqHz") or 0)
    mhz = freq_hz / 1e6 if freq_hz else 0.0
    return {
        "clip_id": str(clip.get("id") or ""),
        "freq_hz": freq_hz,
        "mhz": mhz,
        "mode": str(clip.get("mode") or ""),
        "name": str(clip.get("name") or clip.get("label") or ""),
        "duration_ms": int(clip.get("durationMs") or 0),
        "audio_bytes": audio_len,
        "voice_likely": bool(clip.get("voiceLikely")),
    }


def build_transcript(payload: dict[str, Any]) -> tuple[str, str]:
    info = _clip_info(payload)
    mhz_s = f"{info['mhz']:.3f} MHz" if info["mhz"] else "unknown frequency"
    mode_s = info["mode"] or "unknown mode"
    dur_s = f"{info['duration_ms'] / 1000:.1f}s" if info["duration_ms"] else "unknown length"
    kb = info["audio_bytes"] / 1024 if info["audio_bytes"] else 0
    transcript = (
        "[STT stub] POST OK — replace this service with Whisper/faster-whisper or your LLM pipeline. "
        f"Received ~{kb:.1f} KiB WAV at {mhz_s}, mode {mode_s}, duration {dur_s}."
    )
    summary = (
        "Stub only — no speech was transcribed. "
        f"Clip id {info['clip_id'] or 'n/a'}; voiceLikely={info['voice_likely']}."
    )
    return transcript, summary


class Handler(BaseHTTPRequestHandler):
    server_version = "OWRXAudioSttStub/1.0"

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
        if self.path.rstrip("/") in ("", "/transcribe", "/health"):
            self._send_json(
                200,
                {
                    "ok": True,
                    "service": "owrx-audio-stt-stub",
                    "transcribe": "POST /transcribe with Toolbox clip JSON",
                },
            )
            return
        self._send_json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in ("/transcribe", ""):
            self._send_json(404, {"ok": False, "error": "POST /transcribe only"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send_json(400, {"ok": False, "error": "invalid JSON"})
            return
        if not isinstance(payload, dict):
            payload = {}
        transcript, summary = build_transcript(payload)
        info = _clip_info(payload)
        LOG.info(
            "transcribe clip=%s freqHz=%s audioBytes=%s durationMs=%s",
            info["clip_id"] or None,
            info["freq_hz"] or None,
            info["audio_bytes"],
            info["duration_ms"],
        )
        self._send_json(
            200,
            {
                "ok": True,
                "transcript": transcript,
                "summary": summary,
            },
        )


def main() -> None:
    ap = argparse.ArgumentParser(description="OWRX Audio STT webhook test stub")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=5056)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    LOG.info("listening on http://%s:%s/transcribe", args.host, args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        LOG.info("stopped")


if __name__ == "__main__":
    main()
