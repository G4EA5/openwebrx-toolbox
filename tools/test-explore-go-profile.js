#!/usr/bin/env node
"use strict";

/**
 * Explore Go profile pick — mirrors toolbox.js (device scope + nearest band).
 * Run: node tools/test-explore-go-profile.js
 */

function profileSdrKind(value) {
  value = String(value || "");
  var ix = value.indexOf("|");
  return ix >= 0 ? value.slice(0, ix) : value;
}

function smeterCalKindFromDeviceId(deviceId) {
  var id = String(deviceId || "").toLowerCase();
  if (/rtl.?tcp|rtltcp/.test(id)) return "rtl_tcp";
  if (/rtl.?sdr.?soapy|rtlsdr.?soapy/.test(id)) return "rtl_sdr_soapy";
  if (/airspyhf|hf\+/.test(id)) return "airspyhf";
  if (/airspy/.test(id)) return "airspy";
  if (/hackrf/.test(id)) return "hackrf";
  if (/sdrplay|rsp/.test(id)) return "sdrplay";
  if (/lime/.test(id)) return "lime_soapy";
  if (/pluto|blade|usrp/.test(id)) return "soapy_connector";
  if (/rtl/.test(id)) return "rtl_sdr";
  if (/soapy/.test(id)) return "soapy_connector";
  return "generic";
}

function packTargetSdrKind(kind) {
  if (kind && kind !== "auto") return kind;
  return "rtl_sdr";
}

function profileMatchesPackSdrKind(profileValue, kind) {
  kind = packTargetSdrKind(kind);
  if (!kind) return false;
  var devId = profileSdrKind(profileValue);
  if (!devId) return false;
  if (devId === kind) return true;
  return smeterCalKindFromDeviceId(devId) === kind;
}

function parseMhzRange(label) {
  var s = String(label || "").replace(/[–—−]/g, "-").trim();
  var m = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?:\s*(GHz|MHz|kHz))?/i.exec(s);
  if (!m) return null;
  var a = parseFloat(m[1]);
  var b = parseFloat(m[2]);
  var unit = m[3] || "";
  var mul = /ghz/i.test(unit) ? 1000 : /khz/i.test(unit) ? 0.001 : 1;
  return { lo: Math.min(a, b) * mul, hi: Math.max(a, b) * mul };
}

function profileFreqRange(p) {
  return parseMhzRange(p.label) || parseMhzRange(p.id);
}

function profileMatchesExploreScope(profileValue, scope) {
  scope = scope || {};
  var deviceId = String(scope.deviceId || "").trim();
  var kind = String(scope.kind || "").trim();
  profileValue = String(profileValue || "");
  if (deviceId) return profileValue.indexOf(deviceId + "|") === 0;
  if (!kind) return true;
  if (profileMatchesPackSdrKind(profileValue, kind)) return true;
  if (profileSdrKind(profileValue) === kind) return true;
  return false;
}

function profileForFreq(freqHz, scope) {
  if (typeof scope === "string") scope = { kind: scope, deviceId: "" };
  scope = scope || {};
  var list = arguments.length >= 3 ? arguments[2] : [];
  var best = null;
  var bestSpan = Infinity;
  var near = null;
  var nearDist = Infinity;
  var i, p, r, lo, hi, span, mid, d;
  for (i = 0; i < list.length; i++) {
    p = list[i];
    if (!profileMatchesExploreScope(p.value, scope)) continue;
    r = profileFreqRange(p);
    if (!r) continue;
    lo = r.lo * 1e6;
    hi = r.hi * 1e6;
    mid = (lo + hi) / 2;
    d = Math.abs(freqHz - mid);
    if (d < nearDist) {
      nearDist = d;
      near = p;
    }
    if (freqHz < lo || freqHz > hi) continue;
    span = hi - lo;
    if (span < bestSpan) {
      bestSpan = span;
      best = p;
    }
  }
  return best || near;
}

var profiles = [
  { value: "rtl_sdr|mw", label: "AM MW 0.531-1.701 MHz" },
  { value: "rtl_sdr|70", label: "70cm 430–440 MHz" },
  { value: "hackrf|mw", label: "AM MW broadcast 0.531-1.701" },
  { value: "hackrf|70", label: "70cm 430–440" },
  { value: "airspy|2m", label: "2m 144–146" },
  { value: "my_pluto|wf", label: "Wide 400-500 MHz" }
];

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
}

var hz555 = 555e6;
var pRtl = profileForFreq(hz555, { deviceId: "rtl_sdr" }, profiles);
assert(pRtl && pRtl.value === "rtl_sdr|70", "RTL 555 → 70cm on rtl_sdr device");

var pHrf = profileForFreq(hz555, { deviceId: "hackrf" }, profiles);
assert(pHrf && pHrf.value === "hackrf|70", "HackRF 555 → 70cm on hackrf device");

var pKind = profileForFreq(hz555, { kind: "airspy", deviceId: "" }, profiles);
assert(pKind && pKind.value === "airspy|2m", "Airspy kind scope picks airspy profile");

var pPluto = profileForFreq(450e6, { deviceId: "my_pluto" }, profiles);
assert(pPluto && pPluto.value === "my_pluto|wf", "Custom Soapy device id scope");

var pGlobal = profileForFreq(hz555, {}, profiles);
assert(pGlobal && pGlobal.value === "my_pluto|wf", "No scope → nearest band centre (Pluto 450 vs 70cm 435)");

assert(
  !profileForFreq(hz555, { deviceId: "hackrf" }, [{ value: "rtl_sdr|70", label: "70cm 430–440 MHz" }]),
  "Device scope excludes other stick"
);

console.log("OK: Explore Go profile scope (RTL/HackRF/Airspy/custom device)");
