#!/usr/bin/env python3
"""Inject callsign-allocations.json into toolbox.js (single-file deploy)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent
JSON_PATH = TOOLS / "callsign-allocations.json"
JS_PATH = ROOT / "toolbox.js"
BEGIN = "/*@@CALLSIGN_ALLOC_EMBED_BEGIN@@*/"
END = "/*@@CALLSIGN_ALLOC_EMBED_END@@*/"


def js_string_literal(s: str) -> str:
    return json.dumps(s, ensure_ascii=True)


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    compact = json.dumps(data, ensure_ascii=True, separators=(",", ":"))
    inner = f"  var CALLSIGN_ALLOC_EMBED_STR = {js_string_literal(compact)};\n"
    js = JS_PATH.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(BEGIN) + r".*?" + re.escape(END),
        re.DOTALL,
    )
    if not pattern.search(js):
        raise SystemExit(f"Markers not found in {JS_PATH}")
    js = pattern.sub(BEGIN + "\n" + inner + "  " + END, js, count=1)
    JS_PATH.write_text(js, encoding="utf-8")
    print(f"Embedded callsign data ({len(compact)} bytes JSON) into {JS_PATH}")


if __name__ == "__main__":
    main()
