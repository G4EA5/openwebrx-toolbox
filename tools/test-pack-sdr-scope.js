#!/usr/bin/env node
"use strict";

/**
 * Unit checks for band-pack SDR scoping (mirrors toolbox.js logic).
 * Run: node tools/test-pack-sdr-scope.js
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

function profilesForPackSdrKind(profiles, kind) {
  kind = packTargetSdrKind(kind);
  return profiles.filter(function (p) {
    return profileMatchesPackSdrKind(p.value, kind);
  });
}

function packCoverage(def, profiles, kind) {
  var list = profilesForPackSdrKind(profiles, kind);
  var covered = 0;
  var hits = 0;
  var span = Math.max(1, def.hi - def.lo);
  list.forEach(function (p) {
    var m = String(p.label || "").match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*MHz/i);
    if (!m) return;
    var lo = Number(m[1]) * 1e6;
    var hi = Number(m[2]) * 1e6;
    var olo = Math.max(def.lo, lo);
    var ohi = Math.min(def.hi, hi);
    if (ohi > olo) {
      hits++;
      covered += ohi - olo;
    }
  });
  var frac = Math.min(1, covered / span);
  return { present: frac >= 0.55 || hits >= 3, frac: frac };
}

var ham20m = { id: "ham_20m", lo: 14000000, hi: 14350000 };

var rtlMany = [];
for (var i = 0; i < 87; i++) {
  rtlMany.push({
    value: "rtl_sdr|p" + i,
    id: "p" + i,
    label: "Ham 20m 14.0-14.35 MHz"
  });
}

var mixed = rtlMany.concat([
  { value: "hackrf|h1", id: "h1", label: "Other 100-200 MHz" },
  { value: "airspy|a1", id: "a1", label: "Ham 20m 14.0-14.35 MHz" }
]);

var kinds = [
  "rtl_sdr",
  "rtl_sdr_soapy",
  "rtl_tcp",
  "airspy",
  "airspyhf",
  "hackrf",
  "sdrplay",
  "lime_soapy",
  "soapy_connector"
];

var failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  }
}

assert(
  profilesForPackSdrKind(rtlMany, "hackrf").length === 0,
  "87 RTL profiles must not count as HackRF"
);
assert(
  !packCoverage(ham20m, rtlMany, "hackrf").present,
  "ham_20m must be missing on HackRF when only RTL tiles exist"
);
assert(
  packCoverage(ham20m, rtlMany, "rtl_sdr").present,
  "ham_20m must be present on RTL when RTL tiles cover it"
);
assert(
  profilesForPackSdrKind(mixed, "hackrf").length === 1,
  "HackRF filter keeps only hackrf device profiles"
);
assert(
  profilesForPackSdrKind(mixed, "airspy").length === 1,
  "Airspy filter keeps only airspy device profiles"
);
assert(
  !packCoverage(ham20m, mixed, "hackrf").present,
  "Airspy 20m label must not satisfy HackRF pack coverage"
);

assert(
  profileMatchesPackSdrKind("rtl_sdr_soapy|x", "rtl_sdr_soapy"),
  "exact device id match"
);
assert(
  profileMatchesPackSdrKind("my-hackrf-stick|x", "hackrf"),
  "device id containing hackrf maps to hackrf kind"
);
assert(
  !profileMatchesPackSdrKind("rtl_sdr|x", "hackrf"),
  "rtl_sdr must not match hackrf"
);
assert(
  profileMatchesPackSdrKind("rtltcp-server|x", "rtl_tcp"),
  "rtl_tcp device id mapping"
);

kinds.forEach(function (k) {
  var row = { value: k + "|only", id: "only", label: "test" };
  assert(
    profilesForPackSdrKind([row], k).length === 1,
    "self-filter for kind " + k
  );
  kinds.forEach(function (other) {
    if (other === k) return;
    if (k === "rtl_sdr" && other === "rtl_tcp") return;
    if (k === "rtl_tcp" && other === "rtl_sdr") return;
    assert(
      profilesForPackSdrKind([row], other).length === 0,
      k + " profile must not match kind " + other
    );
  });
});

if (failed) {
  console.error(failed + " test(s) failed");
  process.exit(1);
}
function bandPackProfileSpanHz(p) {
  var m = String(p.label || "").match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*MHz/i);
  if (!m) return 0;
  return Math.max(1, (Number(m[2]) - Number(m[1])) * 1e6);
}
function bandPackOverlapCountsForCoverage(p, def) {
  var packSpan = Math.max(1, def.hi - def.lo);
  var ov = 0;
  var m = String(p.label || "").match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*MHz/i);
  if (m) {
    var lo = Number(m[1]) * 1e6;
    var hi = Number(m[2]) * 1e6;
    var olo = Math.max(def.lo, lo);
    var ohi = Math.min(def.hi, hi);
    if (ohi > olo) ov = ohi - olo;
  }
  if (!ov) return { overlap: 0 };
  if (bandPackProfileSpanHz(p) > packSpan * 4) return { overlap: 0 };
  return { overlap: ov };
}
function packPresent(def, profiles) {
  var span = Math.max(1, def.hi - def.lo);
  var covered = 0;
  var hits = 0;
  profiles.forEach(function (p) {
    var row = bandPackOverlapCountsForCoverage(p, def);
    if (row.overlap > 0) {
      hits++;
      covered += row.overlap;
    }
  });
  var frac = Math.min(1, covered / span);
  return frac >= 0.55 || hits >= 3;
}
var pmr = { id: "pmr446", lo: 446000000, hi: 446200000 };
var wide70 = [{ value: "hackrf|w1", id: "w1", label: "Ham 70cm 420-450 MHz" }];
assert(!packPresent(pmr, wide70), "wide 70cm must not mark PMR446 present");
var narrowPmr = [{ value: "hackrf|p1", id: "p1", label: "PMR446 446.0-446.2 MHz" }];
assert(packPresent(pmr, narrowPmr), "dedicated PMR span should mark present");

console.log("OK: band-pack SDR scope (" + kinds.length + " kinds, RTL/HackRF isolation)");
