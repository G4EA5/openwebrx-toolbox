"""Same-origin OpenWebRX proxies for Toolbox DIY HTTP hooks → local stubs.

Install via server_deploy/sdr-watchdog/apply-owrx-toolbox-proxies.sh (homelab).

Routes:
  /owrx-toolbox-classify      → 127.0.0.1:5055/classify
  /owrx-toolbox-transcribe    → 127.0.0.1:5056/transcribe
  /owrx-toolbox-settings-sync → 127.0.0.1:8787/toolbox-settings
  /owrx-toolbox-peak-webhook  → 127.0.0.1:5057/peak
  /owrx-toolbox-rss           → fetch https RSS/Atom (Toolbox News / Feeds)
"""
from __future__ import annotations

import ipaddress
import json
import logging
import re
import socket
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from owrx.controllers import Controller

logger = logging.getLogger(__name__)

UPSTREAM = {
    "classify": "http://127.0.0.1:5055/classify",
    "transcribe": "http://127.0.0.1:5056/transcribe",
    "settings": "http://127.0.0.1:8787/toolbox-settings",
    "peak": "http://127.0.0.1:5057/peak",
}


class _ToolboxHookProxy(Controller):
    hook_id = "toolbox"
    upstream = ""
    allow_get = True

    def optionsAction(self) -> None:
        origin = self.handler.headers.get("Origin", "*")
        self.send_response(
            b"",
            code=204,
            content_type=None,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Accept",
                "Access-Control-Max-Age": "86400",
                "Vary": "Origin",
            },
        )

    def healthAction(self) -> None:
        self.send_response(
            json.dumps(
                {
                    "ok": True,
                    "proxy": self.hook_id,
                    "upstream": self.upstream,
                }
            ),
            content_type="application/json",
        )

    def postAction(self) -> None:
        self._forward("POST", max_size=8 * 1024 * 1024)

    def getAction(self) -> None:
        if not self.allow_get:
            self.send_response(b'{"ok":false,"error":"GET not allowed"}', code=405, content_type="application/json")
            return
        self._forward("GET", max_size=0)

    def _forward(self, method: str, max_size: int) -> None:
        body = b""
        if method == "POST":
            body = self.get_body(max_size=max_size) or b"{}"
        req = urllib.request.Request(
            self.upstream,
            data=body if method == "POST" else None,
            method=method,
            headers={
                "Content-Type": self.handler.headers.get("Content-Type", "application/json"),
                "Accept": self.handler.headers.get("Accept", "application/json"),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=45 if "transcribe" in self.upstream else 8) as resp:
                out = resp.read()
                code = resp.getcode()
        except urllib.error.HTTPError as exc:
            out = exc.read()
            code = exc.code
        except Exception as exc:
            logger.warning("%s proxy failed: %s", self.hook_id, exc)
            out = json.dumps({"ok": False, "error": "upstream unreachable", "proxy": self.hook_id}).encode()
            code = 502
        headers = {}
        origin = self.handler.headers.get("Origin")
        if origin:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Vary"] = "Origin"
        ctype = "application/json"
        self.send_response(out, code=code, content_type=ctype, headers=headers)


class ToolboxClassifyProxyController(_ToolboxHookProxy):
    hook_id = "owrx-toolbox-classify"
    upstream = UPSTREAM["classify"]


class ToolboxTranscribeProxyController(_ToolboxHookProxy):
    hook_id = "owrx-toolbox-transcribe"
    upstream = UPSTREAM["transcribe"]


class ToolboxSettingsSyncProxyController(_ToolboxHookProxy):
    hook_id = "owrx-toolbox-settings-sync"
    upstream = UPSTREAM["settings"]


class ToolboxPeakWebhookProxyController(_ToolboxHookProxy):
    hook_id = "owrx-toolbox-peak-webhook"
    upstream = UPSTREAM["peak"]
    allow_get = True


RSS_MAX_BYTES = 2 * 1024 * 1024
RSS_FETCH_TIMEOUT = 20


def _xml_local(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _xml_text(node: ET.Element | None) -> str:
    if node is None:
        return ""
    return re.sub(r"\s+", " ", (node.text or "") + "".join(node.itertext())).strip()


def _rss_items_from_xml(data: bytes) -> list[dict]:
    items: list[dict] = []
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return items
    for node in root.iter():
        if _xml_local(node.tag) != "item":
            continue
        title = _xml_text(node.find("title"))
        link = _xml_text(node.find("link"))
        if not link:
            guid = node.find("guid")
            link = _xml_text(guid)
        pub = _xml_text(node.find("pubDate")) or _xml_text(node.find("date"))
        if title:
            items.append({"title": title, "link": link, "pubDate": pub})
    if items:
        return items
    for node in root.iter():
        if _xml_local(node.tag) != "entry":
            continue
        title = _xml_text(node.find("{*}title")) or _xml_text(node.find("title"))
        link = ""
        for ln in node.findall("{*}link") + node.findall("link"):
            href = ln.get("href") or ""
            rel = (ln.get("rel") or "alternate").lower()
            if href and (rel in ("alternate", "") or not link):
                link = href
        if not link:
            link = _xml_text(node.find("{*}id")) or _xml_text(node.find("id"))
        pub = (
            _xml_text(node.find("{*}published"))
            or _xml_text(node.find("published"))
            or _xml_text(node.find("{*}updated"))
            or _xml_text(node.find("updated"))
        )
        if title:
            items.append({"title": title, "link": link, "pubDate": pub})
    return items


def _rss_url_allowed(url: str) -> bool:
    try:
        p = urllib.parse.urlparse(url.strip())
    except Exception:
        return False
    if p.scheme not in ("http", "https"):
        return False
    host = (p.hostname or "").lower().strip(".")
    if not host or host == "localhost":
        return False
    if host.endswith(".local") or host.endswith(".internal"):
        return False
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return True
    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            continue
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            return False
    return True


class ToolboxRssProxyController(Controller):
    """GET /owrx-toolbox-rss?url=https://… — RSS/Atom → JSON for Toolbox News."""

    def optionsAction(self) -> None:
        origin = self.handler.headers.get("Origin", "*")
        self.send_response(
            b"",
            code=204,
            content_type=None,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Accept",
                "Access-Control-Max-Age": "86400",
                "Vary": "Origin",
            },
        )

    def getAction(self) -> None:
        raw = self.handler.request.query_arguments.get("url", [b""])[0]
        try:
            feed_url = urllib.parse.unquote(raw.decode("utf-8", errors="replace")).strip()
        except Exception:
            feed_url = ""
        if not feed_url or not _rss_url_allowed(feed_url):
            self._json({"status": "error", "message": "bad url"}, 400)
            return
        req = urllib.request.Request(
            feed_url,
            method="GET",
            headers={
                "User-Agent": "OpenWebRX-Toolbox-RSS/1.0",
                "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=RSS_FETCH_TIMEOUT) as resp:
                body = resp.read(RSS_MAX_BYTES + 1)
        except urllib.error.HTTPError as exc:
            self._json({"status": "error", "message": "http " + str(exc.code)}, 502)
            return
        except Exception as exc:
            logger.warning("rss fetch failed: %s", exc)
            self._json({"status": "error", "message": "fetch failed"}, 502)
            return
        if len(body) > RSS_MAX_BYTES:
            self._json({"status": "error", "message": "feed too large"}, 413)
            return
        items = _rss_items_from_xml(body)
        self._json({"status": "ok", "items": items[:24]})

    def _json(self, payload: dict, code: int = 200) -> None:
        headers = {}
        origin = self.handler.headers.get("Origin")
        if origin:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Vary"] = "Origin"
        self.send_response(json.dumps(payload), code=code, content_type="application/json", headers=headers)
