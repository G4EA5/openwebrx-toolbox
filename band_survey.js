// Band survey — standalone OpenWebRX+ receiver plugin.
// Does not need freq_scanner, scan_hunt, uikit, or notify.
// Optional: uses notify/freq_scanner if they are already loaded.
//
// Install (preferred): run ./install.sh from this folder — it backs up
// init.js, bookmarks, and any previous copy, then loads the plugin.
// Manual: see README.md. Orange SV button is on the right-hand panel.
// Help is always available from the panel (and on first run).
//
// Public shared OpenWebRX: set the next line to false (or run ./install.sh --public)
// so visitors cannot tick "Own radio — fast hops". Personal / own-PC installs leave true.

var BAND_SURVEY_ALLOW_OWNER_OVERRIDE = true;

Plugins.band_survey = {};
Plugins.band_survey._version = 16;

Plugins.band_survey.init = function () {
  var LS = "owrx_band_survey_v1";
  var LS_HITS = "owrx_band_survey_hits_v1";
  var SAMPLE_MS = 400;
  var CENTER_GUARD_HZ = 25000;
  var EDGE_FRAC = 0.06;
  var OFFSET_BUCKET_HZ = 8000;
  var S = loadSettings();
  var hits = [];
  var tileLooks = {};
  var running = false;
  var stopFlag = false;
  var sortKey = "seen";
  var mutedHold = false;
  var savedVol = null;
  var lastCreated = [];
  var listenCmd = "";
  var listenPaused = false;
  var listenFreq = 0;
  var lastProfileSwitchAt = 0;
  var PROFILE_GAP_MS = 11000;
  var PROFILE_GAP_OWN_MS = 1200;
  var HOP_SETTLE_MS = 700;
  var schedTimer = null;
  var LS_LOCK = "owrx_band_survey_lock_v1";
  var LS_SNAP = "owrx_band_survey_snap_v1";
  var LS_BM_FIRST = "owrx_band_survey_bm_backup_v1";
  var LS_BM_LAST = "owrx_band_survey_bm_backup_last_v1";
  var LS_LOADED_BM = "owrx_band_survey_loaded_bm_v1";
  var loadedBookmarks = [];

  function loadSettings() {
    var d = {
      selected: null,
      passes: 2,
      dwell: 2.5,
      minHits: 3,
      threshDb: 7,
      autoBm: true,
      hideAuto: false,
      mute: true,
      hideSpurs: true,
      ignoredFreqs: [],
      scanAfter: false,
      listenSec: 4,
      holdBusy: true,
      recordBusy: false,
      notifyNew: true,
      aloneOnly: true,
      lockoutMin: 30,
      scheduleHrs: 0,
      priority: "121.5",
      ownRadio: false,
      seenHelp: false,
      panelW: 720,
      panelH: 520,
      splitPct: 62,
      leftSplitPct: 42,
      rightSplit1: 38,
      rightSplit2: 56,
      rightSplit3: 78
    };
    try {
      var raw = window.localStorage.getItem(LS);
      if (raw) {
        var o = JSON.parse(raw);
        Object.keys(d).forEach(function (k) {
          if (typeof o[k] !== "undefined") d[k] = o[k];
        });
      }
    } catch (e) {}
    return d;
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(LS, JSON.stringify(S));
    } catch (e) {}
  }

  function loadHits() {
    try {
      var raw = window.localStorage.getItem(LS_HITS);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && Array.isArray(o.hits)) hits = o.hits;
      if (o && o.tileLooks && typeof o.tileLooks === "object") tileLooks = o.tileLooks;
    } catch (e) {}
  }

  function saveHits() {
    try {
      hits.forEach(function (h) {
        if (h.samples && h.samples.length > 48) h.samples = h.samples.slice(-48);
      });
      window.localStorage.setItem(LS_HITS, JSON.stringify({ hits: hits, tileLooks: tileLooks }));
    } catch (e) {}
  }

  function alwaysOnBand(pid) {
    return /^(fm_|dab_|ais|adsb|vdl2|pocsag|tetra|ism)/.test(pid || "");
  }

  function stddev(arr) {
    if (!arr || arr.length < 4) return 99;
    var m = 0;
    var i;
    for (i = 0; i < arr.length; i++) m += arr[i];
    m /= arr.length;
    var s = 0;
    for (i = 0; i < arr.length; i++) s += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(s / arr.length);
  }

  function offsetBucket(hz) {
    return Math.round(hz / OFFSET_BUCKET_HZ) * OFFSET_BUCKET_HZ;
  }

  function isIgnoredFreq(freq) {
    var list = S.ignoredFreqs || [];
    for (var i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - freq) < 4000) return true;
    }
    return false;
  }

  function shouldSkipTune(freq) {
    return isLocked(freq) || isIgnoredFreq(freq);
  }

  function isSpur(h) {
    return !!(h && (h.spur || h.ignored || isIgnoredFreq(h.freq)));
  }

  function icao833(hz) {
    if (!hz || hz < 118e6 || hz > 137e6) return "";
    var step = 25000 / 3;
    var n = Math.round(hz / step);
    var rem = ((n % 3) + 3) % 3;
    var block = Math.floor(n / 3) * 25000;
    var suffix = rem === 0 ? 0 : rem === 1 ? 5 : 10;
    var mhz = Math.floor(block / 1e6);
    var frac = Math.round((block % 1e6) / 1000) + suffix;
    return mhz + "." + String(frac).padStart(3, "0");
  }

  function freqKey(hz) {
    return String(Math.round(Number(hz) / 1000));
  }

  function loadSnap() {
    try { return JSON.parse(window.localStorage.getItem(LS_SNAP) || "{}"); } catch (e) { return {}; }
  }

  function saveSnap() {
    var o = loadSnap();
    hits.forEach(function (h) {
      if (!isSpur(h)) o[freqKey(h.freq)] = Date.now();
    });
    try { window.localStorage.setItem(LS_SNAP, JSON.stringify(o)); } catch (e) {}
  }

  function markNewFlags(prev) {
    prev = prev || loadSnap();
    hits.forEach(function (h) {
      h.isNew = !isSpur(h) && !prev[freqKey(h.freq)];
    });
  }

  function loadLockouts() {
    try { return JSON.parse(window.localStorage.getItem(LS_LOCK) || "[]"); } catch (e) { return []; }
  }

  function saveLockouts(list) {
    try { window.localStorage.setItem(LS_LOCK, JSON.stringify(list || [])); } catch (e) {}
  }

  function pruneLockouts() {
    var now = Date.now();
    var list = loadLockouts().filter(function (l) { return l && l.until > now; });
    saveLockouts(list);
    return list;
  }

  function isLocked(freq) {
    return pruneLockouts().some(function (l) { return Math.abs(l.freq - freq) < 4000; });
  }

  function lockout(freq) {
    var minutes = Math.max(1, Number(S.lockoutMin) || 30);
    var list = pruneLockouts().filter(function (l) { return Math.abs(l.freq - freq) >= 4000; });
    list.push({ freq: Math.round(freq), until: Date.now() + minutes * 60 * 1000 });
    saveLockouts(list);
  }

  function parseHzList(s) {
    var out = [];
    String(s || "").split(/[\s,;]+/).forEach(function (p) {
      p = String(p || "").trim();
      if (!p) return;
      var n = parseFloat(p);
      if (!isFinite(n) || n <= 0) return;
      if (n < 2000) n *= 1e6;
      else if (n < 1e6) n *= 1e3;
      out.push(n);
    });
    return out;
  }

  function priorityFreqs() {
    var out = parseHzList(S.priority);
    allBookmarks().forEach(function (b) {
      if (b && b.frequency && b.name && /guard|tower|twr|atis/i.test(b.name)) {
        out.push(b.frequency);
      }
    });
    return out;
  }

  function isPriority(freq) {
    return priorityFreqs().some(function (p) { return Math.abs(p - freq) < 4000; });
  }

  function sortListenPriority(items) {
    var scored = (items || []).map(function (row, idx) {
      var it = row.hit || row;
      var freq = it.freq || it.frequency || row.frequency;
      return {
        row: row,
        idx: idx,
        pri: isPriority(freq) ? 0 : 1,
        pid: String(it.pid || ""),
        seen: (row.hit && row.hit.seen) || row.seen || 0
      };
    });
    var pidPri = {};
    scored.forEach(function (s) {
      if (s.pri === 0 && typeof pidPri[s.pid] === "undefined") pidPri[s.pid] = s.idx;
    });
    scored.sort(function (a, b) {
      var ap = typeof pidPri[a.pid] !== "undefined" ? 0 : 1;
      var bp = typeof pidPri[b.pid] !== "undefined" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      if (a.pid !== b.pid) {
        if (ap === 0) return pidPri[a.pid] - pidPri[b.pid];
        return a.pid < b.pid ? -1 : a.pid > b.pid ? 1 : 0;
      }
      if (a.pri !== b.pri) return a.pri - b.pri;
      if (b.seen !== a.seen) return b.seen - a.seen;
      return a.idx - b.idx;
    });
    return scored.map(function (s) { return s.row; });
  }

  function setListenPaused(on) {
    listenPaused = !!on;
    var cont = $("bs-contscan");
    if (cont) {
      cont.classList.toggle("bs-on", listenPaused);
      cont.classList.toggle("bs-primary", listenPaused);
    }
    var start = $("bs-start");
    if (start) {
      start.textContent = listenPaused ? "Continue scan" : "Scan bands";
      start.classList.toggle("bs-on", listenPaused);
      start.title = listenPaused
        ? "Leave this busy channel and keep scanning bookmarks."
        : "Walk ticked bands and add to Seen counts.";
    }
  }

  function resumeListenScan() {
    listenCmd = "continue";
  }

  function sameListenFreq(freq) {
    return !!(listenFreq && freq && Math.abs(Number(freq) - listenFreq) < 4000);
  }

  function alwaysSkipAndContinue(freq) {
    freq = Number(freq) || currentTuneHz();
    if (freq) ignoreFreq(freq);
    listenCmd = "skip";
    if (listenPaused) resumeListenScan();
    if (freq) {
      setStatus("Always skip " + fmtMhz(freq) + (listenPaused ? " — continuing scan." : " — next scan will not land here."));
    }
  }

  function continueIfPausedOn(freq) {
    if (!sameListenFreq(freq)) return false;
    listenCmd = "skip";
    if (listenPaused) resumeListenScan();
    return listenPaused;
  }

  function ownerOverrideAllowed() {
    return BAND_SURVEY_ALLOW_OWNER_OVERRIDE !== false;
  }

  function ownerHopsOn() {
    return ownerOverrideAllowed() && !!S.ownRadio;
  }

  function profileGapMs() {
    return ownerHopsOn() ? PROFILE_GAP_OWN_MS : PROFILE_GAP_MS;
  }

  function freqInVisibleRange(freq, center, bw) {
    center = center || window.center_freq;
    bw = bw || window.bandwidth;
    if (!freq || !center || !bw) return false;
    var pad = bw * EDGE_FRAC;
    return freq >= (center - bw / 2 + pad) && freq <= (center + bw / 2 - pad);
  }

  function currentProfileValue() {
    var sel = $("openwebrx-sdr-profiles-listbox");
    return (sel && sel.value) ? sel.value : "";
  }

  async function waitProfileGap(label) {
    if (!lastProfileSwitchAt) return;
    var waitMore = profileGapMs() - (Date.now() - lastProfileSwitchAt);
    if (waitMore > 0) {
      var why = ownerHopsOn() ? "fast hops (own radio)" : "anti-ban, profile change";
      setStatus((label || "waiting") + " " + Math.ceil(waitMore / 1000) + "s (" + why + ")");
      await sleep(waitMore);
    }
  }

  function clientCount() {
    var el = $("openwebrx-bar-clients");
    if (el) {
      var m = String(el.textContent || "").match(/(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
    try {
      if (window.jQuery) {
        var $el = jQuery("#openwebrx-bar-clients");
        var pb = $el.data("ui-progressbar") || $el.data("progressbar");
        if (pb && typeof pb.clients === "number") return pb.clients;
      }
    } catch (e) {}
    return 1;
  }

  function courtesyBlocked(action) {
    if (!S.aloneOnly) return false;
    var n = clientCount();
    if (n <= 1) return false;
    setStatus("Other listeners online (" + n + ") — untick Only if alone.");
    toast("Other listeners online (" + n + ") — untick Only if alone.");
    return true;
  }

  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 0.06;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 400);
    } catch (e2) {}
  }

  function notify(msg) {
    if (!S.notifyNew || !msg) return;
    beep();
    try {
      if (window.Plugins && Plugins.notify && typeof Plugins.notify.show === "function") {
        Plugins.notify.show(msg);
      }
    } catch (e) {}
    try {
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Band survey", { body: msg, silent: true });
      }
    } catch (e2) {}
    setStatus(msg);
  }

  function askNotifyPerm() {
    try {
      if (S.notifyNew && window.Notification && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (e) {}
  }

  var recordingOn = false;
  var audioClips = [];
  var clipSeq = 1;
  var clipPlaying = null;
  var recCap = { rec: null, chunks: [], meta: null, mime: "", usingOwrx: false };

  function recorderMime() {
    var types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    if (!window.MediaRecorder) return "";
    for (var i = 0; i < types.length; i++) {
      try {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return types[i];
      } catch (e) {}
    }
    return "";
  }

  function extForMime(mime) {
    if (/ogg/.test(mime || "")) return "ogg";
    if (/mp4|aac|m4a/.test(mime || "")) return "m4a";
    if (/mpeg|mp3/.test(mime || "")) return "mp3";
    if (/wav/.test(mime || "")) return "wav";
    return "webm";
  }

  function ensureAudioTap() {
    var eng = window.audioEngine;
    if (!eng || !eng.audioContext) return null;
    if (eng._bs_tap) return eng._bs_tap;
    var src = eng.audioNode || eng.gainNode;
    if (!src || typeof src.connect !== "function") return null;
    try {
      var dest = eng.audioContext.createMediaStreamDestination();
      src.connect(dest);
      eng._bs_tap = dest;
      return dest;
    } catch (e) {
      return null;
    }
  }

  function clipFileName(clip) {
    var mhz = ((clip.freq || 0) / 1e6).toFixed(3).replace(".", "p");
    var t = new Date(clip.at || Date.now());
    var stamp = t.toISOString().slice(0, 19).replace(/[-:T]/g, "");
    stamp = stamp.slice(0, 8) + "-" + stamp.slice(8);
    return "sv-" + mhz + "MHz-" + stamp + "." + (clip.ext || "webm");
  }

  function addAudioClip(clip) {
    audioClips.unshift(clip);
    if (audioClips.length > 40) {
      var drop = audioClips.pop();
      if (drop && drop.url) {
        try { URL.revokeObjectURL(drop.url); } catch (e) {}
      }
    }
    renderAudioClips();
  }

  function startBusyCapture(meta) {
    if (recCap.rec || recCap.usingOwrx) return;
    recCap.meta = meta || {};
    recCap.chunks = [];
    recCap.mime = recorderMime();
    var dest = recCap.mime ? ensureAudioTap() : null;
    if (dest && dest.stream) {
      try {
        recCap.rec = recCap.mime
          ? new MediaRecorder(dest.stream, { mimeType: recCap.mime })
          : new MediaRecorder(dest.stream);
        recCap.mime = recCap.rec.mimeType || recCap.mime;
        recCap.rec.ondataavailable = function (ev) {
          if (ev && ev.data && ev.data.size) recCap.chunks.push(ev.data);
        };
        recCap.rec.onerror = function () { recCap.rec = null; };
        recCap.rec.start(400);
        recordingOn = true;
        return;
      } catch (e) {
        recCap.rec = null;
      }
    }
    try {
      if (window.UI && typeof UI.toggleRecording === "function") {
        UI.toggleRecording(true);
        recCap.usingOwrx = true;
        recordingOn = true;
      }
    } catch (e2) {}
  }

  function finishClipFromChunks() {
    var meta = recCap.meta || {};
    var mime = recCap.mime || "audio/webm";
    var chunks = recCap.chunks.slice();
    recCap.rec = null;
    recCap.chunks = [];
    recCap.meta = null;
    if (!chunks.length) return;
    var blob = new Blob(chunks, { type: mime });
    if (!blob.size) return;
    var url = URL.createObjectURL(blob);
    var clip = {
      id: clipSeq++,
      freq: Number(meta.freq) || 0,
      name: meta.name || "",
      pid: meta.pid || "",
      at: Date.now(),
      blob: blob,
      url: url,
      mime: mime,
      ext: extForMime(mime),
      loaded: false
    };
    addAudioClip(clip);
    setStatus("Saved clip · " + (clip.name || fmtMhz(clip.freq)) + " · Audio clips on the right.");
  }

  function stopBusyCapture() {
    var rec = recCap.rec;
    if (rec) {
      recCap.rec = null;
      try {
        rec.onstop = function () { finishClipFromChunks(); };
        if (rec.state !== "inactive") rec.stop();
        else finishClipFromChunks();
      } catch (e) {
        finishClipFromChunks();
      }
    }
    if (recCap.usingOwrx) {
      recCap.usingOwrx = false;
      try {
        if (window.UI && typeof UI.toggleRecording === "function") UI.toggleRecording(false);
      } catch (e2) {}
    }
    recordingOn = false;
  }

  function setRecording(on, meta) {
    if (on && !S.recordBusy) return;
    if (on) {
      if (recordingOn) return;
      startBusyCapture(meta || {});
    } else {
      stopBusyCapture();
    }
  }

  function applySchedule() {
    if (schedTimer) {
      clearInterval(schedTimer);
      schedTimer = null;
    }
    var hrs = Number(S.scheduleHrs) || 0;
    if (hrs < 0.1) return;
    schedTimer = setInterval(function () {
      if (!running) runSurvey(false);
    }, hrs * 3600 * 1000);
  }

  function localBookmarkList() {
    try {
      if (typeof BookmarkLocalStorage === "function") {
        var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
        return store.getBookmarks() || [];
      }
    } catch (e) {}
    return null;
  }

  function loadLoadedBookmarks() {
    try {
      var raw = window.localStorage.getItem(LS_LOADED_BM);
      if (!raw) return [];
      var o = JSON.parse(raw);
      if (!Array.isArray(o)) return [];
      return o.map(normalizeLoadedBookmark).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function saveLoadedBookmarks() {
    try {
      window.localStorage.setItem(LS_LOADED_BM, JSON.stringify(loadedBookmarks || []));
    } catch (e) {}
  }

  function guessPidForFreq(freq) {
    var list = profiles();
    var best = null;
    var bestSpan = Infinity;
    var i;
    for (i = 0; i < list.length; i++) {
      var r = parseMhzRange(list[i].label);
      if (!r) continue;
      var lo = r.lo * 1e6;
      var hi = r.hi * 1e6;
      if (freq >= lo && freq <= hi) {
        var span = hi - lo;
        if (span < bestSpan) {
          bestSpan = span;
          best = list[i].id;
        }
      }
    }
    return best || "imported";
  }

  function normalizeLoadedBookmark(b) {
    if (!b || typeof b !== "object") return null;
    var freq = Number(b.frequency || b.freq || 0);
    if (!isFinite(freq) || freq <= 0) return null;
    if (freq < 1e5) freq = Math.round(freq * 1e6);
    else freq = Math.round(freq);
    var name = String(b.name || "").trim();
    name = name.replace(/^\[(load|auto)\]\s*/i, "");
    var pid = String(b.pid || "").trim() || guessPidForFreq(freq);
    return {
      frequency: freq,
      name: name || fmtMhz(freq),
      modulation: b.modulation || b.mode || guessMode(pid),
      pid: pid
    };
  }

  function parseLoadedBookmarkFile(text, fname) {
    text = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!text) throw new Error("File is empty");
    var lower = String(fname || "").toLowerCase();
    var rows = [];
    if (lower.endsWith(".csv") || (/^seen,/i.test(text) && text.indexOf("MHz") >= 0)) {
      var parsed = parseImportCsv(text);
      parsed.hits.forEach(function (h) {
        rows.push(normalizeLoadedBookmark({
          frequency: h.freq,
          name: h.name || existingName(h.freq) || fmtMhz(h.freq),
          modulation: h.mode,
          pid: h.pid
        }));
      });
    } else {
      var o;
      try {
        o = JSON.parse(text);
      } catch (e) {
        throw new Error("Not valid JSON");
      }
      var isBackup = o && Array.isArray(o.bookmarks) && o.when && (o.reason || o.when) &&
        !Array.isArray(o.hits) && o.kind !== "owrx-band-survey";
      if (isBackup) {
        throw new Error("This is a blue-bookmark backup. Use Help → Restore, or Load bookmarks after exporting a bookmark list.");
      }
      var arr = null;
      if (Array.isArray(o)) arr = o;
      else if (o && Array.isArray(o.bookmarks)) arr = o.bookmarks;
      if (!arr) throw new Error("Need a JSON array or { bookmarks: [...] }");
      arr.forEach(function (b) {
        var n = normalizeLoadedBookmark(b);
        if (n) rows.push(n);
      });
    }
    rows = rows.filter(Boolean);
    if (!rows.length) throw new Error("No bookmark frequencies found");
    return rows;
  }

  function applyLoadedBookmarks(rows, source) {
    var replace = !loadedBookmarks.length;
    if (loadedBookmarks.length) {
      replace = window.confirm(
        "Replace " + loadedBookmarks.length + " loaded bookmark(s) with " + rows.length + " from " +
        (source || "file") + "? OK = replace. Cancel = merge new frequencies only."
      );
    }
    if (replace) loadedBookmarks = rows.slice();
    else {
      var seen = {};
      loadedBookmarks.forEach(function (b) { seen[b.frequency] = true; });
      rows.forEach(function (b) {
        if (!seen[b.frequency]) {
          loadedBookmarks.push(b);
          seen[b.frequency] = true;
        }
      });
    }
    saveLoadedBookmarks();
    renderBookmarkPane();
    setStatus("Loaded " + rows.length + " bookmark(s) — look for [load] on the right. Scan bookmarks includes them.");
  }

  function clearLoadedBookmarks() {
    if (!loadedBookmarks.length) {
      setStatus("No loaded bookmarks to clear.");
      return;
    }
    if (!window.confirm("Remove all " + loadedBookmarks.length + " loaded bookmark(s)? Local [auto] bookmarks are not touched.")) return;
    loadedBookmarks = [];
    saveLoadedBookmarks();
    renderBookmarkPane();
    setStatus("Cleared loaded bookmarks.");
  }

  function scanTargetItems() {
    if (lastCreated.length) return lastCreated.slice();
    var rows = [];
    var seen = {};
    function add(row) {
      var f = Number(row.freq || row.frequency);
      if (!f || seen[f]) return;
      seen[f] = true;
      rows.push(row);
    }
    (localBookmarkList() || []).forEach(function (b) {
      var nm = String(b.name || "").trim();
      if (!nm) nm = bookmarkDisplayName(b);
      add({
        freq: b.frequency,
        frequency: b.frequency,
        pid: guessPidForFreq(b.frequency),
        mode: b.modulation || guessMode(guessPidForFreq(b.frequency)),
        name: nm
      });
    });
    (loadedBookmarks || []).forEach(function (b) {
      add({
        freq: b.frequency,
        frequency: b.frequency,
        pid: b.pid || guessPidForFreq(b.frequency),
        mode: b.modulation || guessMode(b.pid || guessPidForFreq(b.frequency)),
        name: "[load] " + (b.name || fmtMhz(b.frequency))
      });
    });
    if (rows.length) return rows;
    return qualifiedHits().map(function (h) {
      return { freq: h.freq, pid: h.pid, mode: h.mode, name: bookmarkNameFor(h) };
    });
  }

  function startLoadBookmarks(ev) {
    var inp = $("bs-bm-file");
    if (!inp) return;
    inp.click();
  }

  function restoreLocalBookmarkList(list, source) {
    if (!list || !list.length) return false;
    if (typeof BookmarkLocalStorage !== "function") {
      setStatus("This page cannot write local bookmarks.");
      return false;
    }
    if (!window.confirm("Replace blue (local) bookmarks with " + list.length + " from " + (source || "file") + "? Yellow server bookmarks are not touched.")) {
      return false;
    }
    try {
      backupLocalBookmarks("before-restore-file");
      var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
      store.setBookmarks(list);
      if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
        bookmarks.loadLocalBookmarks();
      }
      refreshBookmarks();
      setStatus("Restored " + list.length + " local blue bookmark(s) from " + (source || "file") + ".");
      return true;
    } catch (e) {
      setStatus("Restore failed: " + (e && e.message ? e.message : e));
      return false;
    }
  }

  function importSavedBookmarkFile(text, fname) {
    var o;
    try {
      o = JSON.parse(String(text || "").replace(/^\uFEFF/, "").trim());
    } catch (e) {
      throw new Error("Not valid JSON");
    }
    if (!o || o.kind !== "owrx-band-survey") return false;
    var loadedRows = (o.loaded || []).map(normalizeLoadedBookmark).filter(Boolean);
    var localRows = Array.isArray(o.local) ? o.local.filter(function (b) {
      return b && (b.frequency || b.freq);
    }) : [];
    if (!loadedRows.length && !localRows.length) throw new Error("No bookmarks in this save file");
    if (loadedRows.length) applyLoadedBookmarks(loadedRows, fname);
    if (localRows.length) restoreLocalBookmarkList(localRows, fname);
    else if (!loadedRows.length) setStatus("No bookmarks imported.");
    return true;
  }

  function saveBookmarks() {
    var local = localBookmarkList() || [];
    var loaded = (loadedBookmarks || []).slice();
    if (!local.length && !loaded.length) {
      setStatus("No bookmarks to save.");
      return;
    }
    var payload = {
      kind: "owrx-band-survey",
      when: Date.now(),
      local: local,
      loaded: loaded
    };
    var ts = new Date().toISOString().slice(0, 10);
    downloadFile("band-survey-bookmarks-" + ts + ".json", JSON.stringify(payload, null, 2), "application/json");
    setStatus("Saved " + local.length + " local and " + loaded.length + " loaded bookmark(s) to JSON.");
  }

  function clearLocalBookmarks() {
    if (typeof BookmarkLocalStorage !== "function") {
      setStatus("No local bookmark store on this page. Nothing to clear.");
      return;
    }
    var list = localBookmarkList() || [];
    if (!list.length) {
      setStatus("No local blue bookmarks to clear.");
      return;
    }
    if (!window.confirm("Remove all " + list.length + " local blue bookmark(s) from this browser? [load] imports and always-skip are not touched.")) return;
    backupLocalBookmarks("before-clear-all");
    var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
    store.setBookmarks([]);
    if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
      bookmarks.loadLocalBookmarks();
    }
    refreshBookmarks();
    setStatus("Cleared " + list.length + " local blue bookmark(s).");
  }

  function onLoadBookmarkFile(ev) {
    var inp = ev && ev.target;
    var file = inp && inp.files && inp.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        if (!importSavedBookmarkFile(reader.result, file.name)) {
          var rows = parseLoadedBookmarkFile(reader.result, file.name);
          applyLoadedBookmarks(rows, file.name);
        }
      } catch (err) {
        setStatus(importError(err, "Load bookmarks"));
        toast(importError(err, "Load bookmarks"));
      }
      if (inp) inp.value = "";
    };
    reader.onerror = function () {
      setStatus("Could not read that file.");
      if (inp) inp.value = "";
    };
    reader.readAsText(file);
  }

  function backupLocalBookmarks(reason, forceFirst) {
    var list = localBookmarkList();
    if (!list) return false;
    var payload = { when: Date.now(), reason: reason || "auto", bookmarks: list };
    try {
      if (forceFirst || !window.localStorage.getItem(LS_BM_FIRST)) {
        window.localStorage.setItem(LS_BM_FIRST, JSON.stringify(payload));
      }
      window.localStorage.setItem(LS_BM_LAST, JSON.stringify(payload));
      return true;
    } catch (e) {
      return false;
    }
  }

  function backupInfo(which) {
    try {
      var raw = window.localStorage.getItem(which === "last" ? LS_BM_LAST : LS_BM_FIRST);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function restoreBookmarkBackup(which) {
    var info = backupInfo(which);
    if (!info || !Array.isArray(info.bookmarks)) {
      setStatus("No bookmark backup in this browser yet. Run a survey once, or re-install with install.sh.");
      return false;
    }
    if (typeof BookmarkLocalStorage !== "function") {
      setStatus("This page cannot write local bookmarks. Export the backup from Help instead.");
      return false;
    }
    if (!window.confirm("Replace blue (local) bookmarks with the " + (which === "last" ? "last" : "first-install") + " backup (" + info.bookmarks.length + " entries)? Yellow server bookmarks are not touched.")) {
      return false;
    }
    try {
      var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
      store.setBookmarks(info.bookmarks);
      if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
        bookmarks.loadLocalBookmarks();
      }
      refreshBookmarks();
      setStatus("Restored " + info.bookmarks.length + " local bookmarks from " + new Date(info.when).toLocaleString() + ".");
      return true;
    } catch (e) {
      setStatus("Restore failed: " + (e && e.message ? e.message : e) + ". See Help → Troubleshooting.");
      return false;
    }
  }

  function caps() {
    return {
      plugins: typeof window.Plugins !== "undefined" && typeof window.Plugins.load === "function",
      receiver: !!$("openwebrx-panel-receiver"),
      profiles: !!$("openwebrx-sdr-profiles-listbox"),
      profileHop: typeof window.sdr_profile_changed === "function",
      waterfall: typeof window.waterfall_add === "function" || !!(window.bs_wf_data || window.fs_wf_data),
      center: typeof window.center_freq === "number" && window.center_freq > 0,
      bandwidth: typeof window.bandwidth === "number" && window.bandwidth > 0,
      tune: !!(window.UI && typeof UI.setFrequency === "function"),
      bookmarks: typeof BookmarkLocalStorage === "function",
      record: !!window.MediaRecorder || !!(window.UI && typeof UI.toggleRecording === "function"),
      mute: !!(window.UI && typeof UI.setVolume === "function") ||
        !!(window.audioEngine && typeof audioEngine.setVolume === "function"),
      clients: !!$("openwebrx-bar-clients"),
      notifyPlugin: !!(window.Plugins && Plugins.notify && typeof Plugins.notify.show === "function"),
      notifyWeb: typeof window.Notification === "function",
      freqScanner: !!(window.fs_scanner_state || (window.Plugins && Plugins.freq_scanner)),
      scanHunt: !!(window.Plugins && Plugins.scan_hunt)
    };
  }

  function diagnose() {
    var issues = [];
    var c = caps();
    function add(level, title, fix) {
      issues.push({ level: level, title: title, fix: fix });
    }
    if (!c.plugins) {
      add("error", "This is not OpenWebRX+ (no plugin loader).",
        "Install OpenWebRX+ (the luarvique fork), not vanilla OpenWebRX. Plugins only exist on the + fork.");
    }
    if (!c.receiver) {
      add("error", "No receiver panel on this page.",
        "Open the receiver page (the SDR waterfall), not the map hub only. Wait for OpenWebRX+ to finish loading, then hard-refresh (Ctrl+Shift+R).");
    }
    var sel = $("openwebrx-sdr-profiles-listbox");
    if (!sel) {
      add("error", "No profile list.",
        "Open the receiver page (not the map hub only), wait for OpenWebRX+ to finish loading, hard-refresh.");
    } else if (!sel.options || !sel.options.length) {
      add("warn", "Profile list is empty.",
        "Wait ~10 seconds for the radio to connect, then click Check install. If it stays empty, add SDR profiles in OpenWebRX settings (admin).");
    }
    if (sel && !c.profileHop) {
      add("warn", "Cannot hop profiles from the plugin.",
        "Survey can still count peaks on the current tile. Profile hopping needs a stock OpenWebRX+ receiver page (sdr_profile_changed).");
    }
    if (!c.waterfall) {
      add(c.receiver ? "warn" : "error", "No waterfall data yet.",
        "Wait a few seconds after the radio connects, then click Check install again. A black waterfall usually means the SDR is not started. Stay on the receiver page (not the map hub).");
    }
    if (!c.center || !c.bandwidth) {
      add("warn", "Center frequency / bandwidth not ready yet.",
        "Wait a few seconds after the radio connects. Peak finding needs window.center_freq and window.bandwidth.");
    }
    if (!c.tune) {
      add("warn", "Tune API is missing (UI.setFrequency).",
        "Clicking a MHz or Jump loudest will not retune. Update OpenWebRX+ or open the full receiver UI.");
    }
    if (!c.bookmarks) {
      add("warn", "Local bookmarks API missing.",
        "Auto-bookmark is off; Export JSON still works. Blue bookmarks need BookmarkLocalStorage on this page.");
    }
    if (!c.record) {
      add("info", "Record busy unavailable.",
        "This browser has no MediaRecorder and no UI.toggleRecording. Untick Record busy — survey still works. Save/Load audio still play files you pick.");
    }
    if (!c.mute) {
      add("info", "Mute-while-running unavailable.",
        "No UI.setVolume on this page. Unmute the receiver yourself, or update OpenWebRX+.");
    }
    if (!c.clients) {
      add("info", "Courtesy / alone check unavailable.",
        "No #openwebrx-bar-clients on this page. “Only if alone” cannot see other listeners, so it will not block. Untick it if you want that clear.");
    }
    if (!c.notifyPlugin && !c.notifyWeb) {
      add("info", "Desktop notify not available.",
        "Plugins.notify / Notification missing — new-peak alerts fall back to a short beep and the status line.");
    } else if (!c.notifyPlugin) {
      add("info", "notify plugin not installed (optional).",
        "Not required. New peaks still beep and show in the status line; browser notifications work if you allow them.");
    }
    if (!c.freqScanner) {
      add("info", "freq_scanner — optional, not installed.",
        "Band survey does not need it. Ignore this unless you want the separate scanner plugin.");
    }
    if (!c.scanHunt) {
      add("info", "scan_hunt — optional, not installed.",
        "Band survey does not need it (nor uikit). Core needs: profile select, waterfall, local bookmarks APIs.");
    }
    try {
      window.localStorage.setItem("owrx_band_survey_ping", "1");
      window.localStorage.removeItem("owrx_band_survey_ping");
    } catch (e) {
      add("warn", "This browser blocked saved settings.",
        "Allow cookies / site data for this receiver, or use another browser. Survey will still run this session only. Privacy: this plugin stores data in localStorage only, in this browser.");
    }
    var cssOk = false;
    try {
      var probe = $("bs-panel") || document.querySelector("#bs-toggle-btn") || $("bs-fallback-chip");
      if (probe) {
        var z = window.getComputedStyle(probe).zIndex;
        cssOk = z && z !== "auto";
      }
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        if (/band_survey/.test(links[i].href || "")) cssOk = true;
      }
    } catch (e2) {}
    if ($("bs-panel") && !cssOk) {
      add("warn", "Plugin CSS did not load.",
        "band_survey.css must sit next to band_survey.js. Re-copy the folder or re-run install.sh, then hard-refresh.");
    }
    return issues;
  }

  function renderIssueP(x) {
    var tag = x.level === "error" ? "Needs a fix: " : x.level === "warn" ? "Note: " : "Optional: ";
    return "<p><b>" + tag + escapeHtml(x.title) + "</b><br>" + escapeHtml(x.fix) + "</p>";
  }

  function renderHealth(opts) {
    opts = opts || {};
    applyCaps();
    var box = $("bs-health");
    if (!box) return diagnose();
    var issues = diagnose();
    var hard = issues.filter(function (x) { return x.level === "error"; });
    var warns = issues.filter(function (x) { return x.level === "warn"; });
    var extras = issues.filter(function (x) { return x.level === "info"; });
    var showExtra = !!opts.all;
    if (!hard.length && !warns.length && !opts.ok && !showExtra) {
      box.hidden = true;
      box.innerHTML = "";
      box.className = "bs-health";
      return issues;
    }
    var html = "";
    if (!hard.length && !warns.length) {
      html += "<p><b>Install looks good.</b> Orange <b>SV</b> is this plugin. Tick bands (or Air / VHF voice / All VHF / All UHF / Ham) and press Scan bands. Help is always in the header.</p>";
    }
    html += hard.concat(warns).map(renderIssueP).join("");
    if (showExtra && extras.length) {
      html += "<p class=\"bs-health-opt-h\">Optional extras (not required)</p>" + extras.map(renderIssueP).join("");
    }
    html += '<p><button type="button" class="bs-tiny" id="bs-health-help" title="Open the help overlay.">Open Help</button></p>';
    box.hidden = false;
    box.className = "bs-health" + (hard.length ? " bs-health-err" : warns.length ? " bs-health-warn" : " bs-health-ok");
    box.innerHTML = html;
    var hb = $("bs-health-help");
    if (hb) hb.onclick = function () { openHelp(); };
    if (opts.toast) {
      var first = hard[0] || warns[0];
      if (first) toast(first.title + " — " + first.fix);
    }
    return issues;
  }

  function blockingIssue() {
    var issues = diagnose();
    for (var i = 0; i < issues.length; i++) {
      if (issues[i].level === "error") return issues[i];
    }
    return null;
  }

  function toast(msg) {
    if (!msg) return;
    var el = $("bs-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "bs-toast";
      document.body.appendChild(el);
    }
    el.textContent = String(msg).replace(/\s+/g, " ").slice(0, 280);
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 7000);
  }

  function friendlyError(err, action) {
    var msg = (err && err.message) ? err.message : String(err || "unknown error");
    msg = msg.replace(/\s+/g, " ").slice(0, 160);
    return (action || "That") + " failed: " + msg + ". Click Help or Check install.";
  }

  function applyCaps() {
    var c = caps();
    function setOpt(id, ok, why) {
      var el = $(id);
      if (!el) return;
      el.disabled = !ok;
      var lab = el.parentElement;
      if (lab) {
        if (lab.classList) lab.classList.toggle("bs-off", !ok);
        if (!ok) {
          if (!lab.getAttribute("data-tip-ok") && lab.getAttribute("title")) {
            lab.setAttribute("data-tip-ok", lab.getAttribute("title"));
          }
          lab.title = why;
        } else if (lab.getAttribute("data-tip-ok")) {
          lab.title = lab.getAttribute("data-tip-ok");
        }
      }
    }
    setOpt("bs-autobm", c.bookmarks, "Local bookmarks API missing — auto-bookmark is off; Export JSON still works.");
    if (!c.bookmarks) {
      S.autoBm = false;
      if ($("bs-autobm")) $("bs-autobm").checked = false;
    }
    setOpt("bs-record", c.record, "Record busy unavailable — no MediaRecorder and no UI.toggleRecording on this page.");
    if (!c.record) {
      S.recordBusy = false;
      if ($("bs-record")) $("bs-record").checked = false;
    }
    setOpt("bs-mute", c.mute, "Mute-while-running unavailable — no volume API on this page.");
    setOpt("bs-alone", c.clients, "Courtesy / alone check unavailable — client count bar not found.");
    applyOwnerLock();
  }

  function applyOwnerLock() {
    var el = $("bs-ownradio");
    var lab = el && el.parentElement;
    var hint = $("bs-hophint");
    if (!ownerOverrideAllowed()) {
      S.ownRadio = false;
      if (el) {
        el.checked = false;
        el.disabled = true;
      }
      if (lab) {
        lab.hidden = true;
        lab.title = "The site operator locked fast hops on this receiver.";
      }
      if (hint) hint.textContent = "busy channel waits here · same-band ~1s · other band 11s (operator locked fast hops)";
    } else if (el && lab) {
      el.disabled = false;
      lab.hidden = false;
      lab.title = "Skip the 11s wait between bands. Only on a receiver you run. Public sites can lock this off.";
      if (hint) hint.textContent = "busy channel waits here · same-band ~1s · other band 11s unless Own radio is on";
    }
  }

  function helpHtml() {
    return (
      '<div class="bs-help-card" role="dialog" aria-labelledby="bs-help-title">' +
      '<div class="bs-help-top"><h2 id="bs-help-title">Band survey — help</h2>' +
      '<button type="button" class="bs-x" id="bs-help-x" title="Close">×</button></div>' +
      "<h3>First 30 seconds</h3>" +
      "<ol>" +
      "<li>Hard-refresh this receiver page (<b>Ctrl+Shift+R</b> / Mac <b>Cmd+Shift+R</b>) after you install or update.</li>" +
      "<li>Click the orange <b>SV</b> button on the right-hand receiver panel.</li>" +
      "<li>Click <b>Check install</b>. Green means ready. Red or yellow includes the fix on screen — not only in the browser console.</li>" +
      "<li>Tick bands (or <b>Air</b> / <b>VHF voice</b> / <b>All VHF</b> / <b>All UHF</b> / <b>Ham</b>) and press <b>Scan bands</b>.</li>" +
      "<li>Hover any control for a short tip. Drag the panel edges or bottom-right corner to resize. Drag any grey bar between sections (controls vs peaks, survey vs bookmarks, each right-hand block) to adjust layout. Size is remembered in this browser.</li>" +
      "</ol>" +
      '<p><button type="button" id="bs-help-check" title="Run the same checks as Check install on the panel.">Check install now</button></p>' +
      "<h3>What this is</h3>" +
      "<p>A <b>standalone OpenWebRX+ receiver plugin</b>. It walks the bands you tick, counts real waterfall peaks, ranks the busiest, and can bookmark them in <em>this browser</em>.</p>" +
      "<p>It does <b>not</b> need freq_scanner, scan_hunt, rx_bands, uikit, or notify. Those are optional extras if they are already loaded.</p>" +
      "<h3>Install (new machine)</h3>" +
      "<p>Preferred: from this folder run <code>./install.sh</code>. It backs up your files, copies the plugin, and adds one load line. Then hard-refresh. To only verify an existing copy: <code>./install.sh --check</code>. On a public shared receiver, use <code>./install.sh --public</code> so visitors cannot skip the 11s gap.</p>" +
      "<p>Manual: copy <code>band_survey/</code> into <code>htdocs/plugins/receiver/band_survey/</code> (typical htdocs: <code>/usr/lib/python3/dist-packages/htdocs</code> or <code>/opt/openwebrx/htdocs</code>), then add <code>await Plugins.load(\"band_survey\");</code> inside <code>plugins/receiver/init.js</code>.</p>" +
      "<h3>How to use</h3>" +
      "<ol>" +
      "<li><b>Scan bands</b> adds to Seen totals; <b>Fresh scan</b> starts at zero.</li>" +
      "<li>Band presets (<b>Air</b> / <b>VHF voice</b> / <b>All VHF</b> / <b>All UHF</b> / <b>Ham</b>) are <b>additive</b> — they add ticks without clearing others. Combine <b>All VHF</b> + <b>All UHF</b> for both ranges. <b>None</b> unticks every band.</li>" +
      (ownerOverrideAllowed()
        ? "<li>Same-band hops ~<b>1s</b>. Other-band profile changes stay ~<b>11s</b> unless <b>Own radio — fast hops</b> is on (~1s). Only tick that on a receiver you run yourself — public sites can ban the client.</li>"
        : "<li>Same-band hops ~<b>1s</b>. Other-band profile changes stay ~<b>11s</b> — the operator locked fast hops on this public receiver (visitors cannot tick the override). Server bot-ban still applies if it is enabled.</li>") +
      "<li>Click a MHz to tune, click a name to rename, <b>ign</b> to always skip a birdie (click again to undo).</li>" +
      "<li>While listening: <b>Hold</b> stay, <b>Skip</b> next, <b>Lockout</b> ~30 min, <b>Always skip</b> never land there again and continue the scan (saved in this browser). A <b>busy</b> channel pauses until you click <b>Continue scan</b> or <b>Always skip</b>. Undo with <b>un-ign</b> on the peak (untick Hide birdies) or <b>Clear always-skip</b>.</li>" +
      "<li><b>Hold while busy</b> stays on a live signal until it goes quiet. <b>Jump loudest</b> retunes on <em>this tile only</em>.</li>" +
      "<li><b>Priority</b> (e.g. 121.5) plus tower/ATIS names are listened first. <b>Only if alone</b> skips retune when other listeners are online — untick it to override.</li>" +
      "<li><b>Every N hours</b> runs Scan bands while this tab stays open. <b>Export CSV</b> / <b>Export JSON</b> for a log or to merge yellow server bookmarks. <b>Import CSV</b> / <b>Import JSON</b> restores Peaks/Seen in this browser.</li>" +
      "</ol>" +
      "<h3>Panel</h3>" +
      "<p>The left side is survey controls and a scrollable band list, with Passes→Every N hours always visible in a fixed strip above the draggable bar, then the peaks table. The <b>right side</b> lists blue local bookmarks (<b>[auto]</b> vs named), amber <b>[load]</b> imports, audio clips, and always-skip frequencies — drag the bars between them to resize each block. Click a row to tune. Hover any checkbox, field, or button for a one-line tip.</p>" +
      "<h3>Bookmarks</h3>" +
      "<p><b>Blue</b> bookmarks are local to this browser (<b>[auto]</b> from surveys vs named). <b>Save bookmarks</b> downloads local + <b>[load]</b> as JSON; <b>Load bookmarks</b> imports JSON/CSV (including that save file). <b>Scan bookmarks</b> hops through both. <b>Clear bookmarks</b> removes all blue local entries; <b>Clear loaded</b> removes only <b>[load]</b>; <b>Clear auto bookmarks</b> removes only <b>[auto]</b>.</p>" +
      "<p>Yellow <b>server</b> bookmarks are admin-only — a normal user cannot write them. Use <b>Export JSON</b> and merge the <code>bookmarks</code> array on the radio host.</p>" +
      "<p><b>Import CSV</b> / <b>Import JSON</b> restores Peaks/Seen in this browser from a previous export (file picker; Shift-click to paste). Blue and loaded bookmarks are not changed.</p>" +
      "<h3>Audio clips</h3>" +
      "<p>Tick <b>Record busy</b> before <b>Scan bookmarks</b> — demod audio is captured only while parked on a busy or held channel (bookmark-scan pause), <em>not</em> during the survey walk or quiet hops. Clips appear on the right. <b>Save audio</b> downloads them; <b>Load audio</b> adds files from disk to play in the panel (nothing is uploaded).</p>" +
      '<p><button type="button" id="bs-restore-first" title="Replace this browser’s blue bookmarks with the copy taken on first run.">Restore first-run bookmarks</button> ' +
      '<button type="button" id="bs-restore-last" title="Replace this browser’s blue bookmarks with the most recent backup.">Restore last backup</button> ' +
      '<button type="button" id="bs-dl-backup" title="Download the last bookmark backup as JSON.">Download bookmark backup</button></p>' +
      "<h3>If something is wrong</h3>" +
      "<ul>" +
      "<li><b>No SV button</b> — plugin not loaded, or this browser cached an old file. Re-run <code>./install.sh --check</code>, then hard-refresh. If the receiver panel is missing, use the fixed SV chip or the red banner.</li>" +
      "<li><b>No profile list</b> — open the receiver page (not the map / settings page only), wait for OpenWebRX+ to finish loading, hard-refresh.</li>" +
      "<li><b>No waterfall data</b> — wait a few seconds after the radio connects, or check the SDR is started.</li>" +
      "<li><b>Local bookmarks API missing</b> — auto-bookmark is off; Export JSON still works.</li>" +
      "<li><b>Other listeners online</b> — untick Only if alone.</li>" +
      "<li><b>Nothing counted</b> — lower “dB over noise”, pick a busier band, or wait until the waterfall is moving.</li>" +
      (ownerOverrideAllowed()
        ? "<li><b>Banned / kicked</b> — leave <b>Own radio — fast hops</b> off on shared/public receivers (11s gap). Same-band hops and frequencies already on this waterfall skip that wait.</li>"
        : "<li><b>Banned / kicked</b> — this site locked fast hops (11s profile gap). Same-band hops still ~1s. Hiding the checkbox is not a hard security fence (DevTools can still change the wait), but <b>server bot-ban</b> still kicks clients if the admin has it on.</li>") +
      "</ul>" +
      "<p>Press <b>Esc</b> or click outside this card to close. Click <b>Check install</b> any time — messages include the fix.</p>" +
      "<h3>Privacy</h3>" +
      "<p>Settings, hit lists, and bookmark backups live in <b>localStorage only in this browser</b>. Nothing is uploaded. Clearing site data removes them.</p>" +
      "</div>"
    );
  }

  function openHelp() {
    var wrap = $("bs-help");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "bs-help";
      wrap.innerHTML = helpHtml();
      document.body.appendChild(wrap);
      $("bs-help-x").onclick = closeHelp;
      wrap.addEventListener("click", function (ev) {
        if (ev.target === wrap) closeHelp();
      });
      if ($("bs-restore-first")) {
        $("bs-restore-first").onclick = function () { restoreBookmarkBackup("first"); };
      }
      if ($("bs-restore-last")) {
        $("bs-restore-last").onclick = function () { restoreBookmarkBackup("last"); };
      }
      if ($("bs-dl-backup")) {
        $("bs-dl-backup").onclick = function () {
          var info = backupInfo("last") || backupInfo("first");
          if (!info) {
            setStatus("No bookmark backup to download yet.");
            return;
          }
          downloadFile("band-survey-bookmarks-backup.json", JSON.stringify(info, null, 2), "application/json");
          setStatus("Downloaded bookmark backup.");
        };
      }
      if ($("bs-help-check")) {
        $("bs-help-check").onclick = function () {
          closeHelp();
          var p = $("bs-panel");
          if (p) p.hidden = false;
          var issues = renderHealth({ all: true, toast: true, ok: true });
          var hard = issues.filter(function (x) { return x.level === "error"; }).length;
          var notes = issues.filter(function (x) { return x.level === "warn"; }).length;
          if (!hard && !notes) setStatus("Install looks good. Tick bands and press Scan bands.");
        };
      }
    }
    wrap.hidden = false;
    document.removeEventListener("keydown", helpEsc);
    document.addEventListener("keydown", helpEsc);
    S.seenHelp = true;
    saveSettings();
  }

  function helpEsc(ev) {
    if (ev && ev.key === "Escape") closeHelp();
  }

  function closeHelp() {
    var wrap = $("bs-help");
    if (wrap) wrap.hidden = true;
    document.removeEventListener("keydown", helpEsc);
    S.seenHelp = true;
    saveSettings();
    if ($("bs-panel") && !$("bs-panel").hidden && !hits.length) {
      setStatus("Next: tick bands (or Air / VHF voice / All VHF / All UHF / Ham) and press Scan bands. Check install if anything looks wrong.");
    }
  }

  function $(id) {
    return document.getElementById(id);
  }

  function profiles() {
    var sel = $("openwebrx-sdr-profiles-listbox");
    var out = [];
    if (!sel) return out;
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      var value = opt.value || "";
      var id = value.indexOf("|") >= 0 ? value.split("|").slice(1).join("|") : value;
      out.push({ value: value, id: id, label: opt.text || id });
    }
    return out;
  }

  // ITU VHF is 30–300 MHz. "UHF" here is the operator band 300–1000 MHz
  // (70cm / PMR / GMRS / TETRA / ISM 868), not 23cm / ADS-B / GPS.
  // A tile whose range crosses 300 MHz is ticked by both All VHF and All UHF.
  var VHF_MHZ_LO = 30;
  var VHF_MHZ_HI = 300;
  var UHF_MHZ_LO = 300;
  var UHF_MHZ_HI = 1000;

  function parseMhzRange(label) {
    var s = String(label || "").replace(/[–—−]/g, "-");
    var m;
    var last = null;
    var reRange = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?:\s*(GHz|MHz))?/gi;
    while ((m = reRange.exec(s))) last = m;
    if (last) {
      var a = parseFloat(last[1]);
      var b = parseFloat(last[2]);
      var mul = last[3] && /ghz/i.test(last[3]) ? 1000 : 1;
      if (!last[3]) {
        if (a >= 10000) a /= 1e6;
        if (b >= 10000) b /= 1e6;
      }
      return { lo: Math.min(a, b) * mul, hi: Math.max(a, b) * mul };
    }
    m = /(\d+(?:\.\d+)?)\s*(GHz|MHz)\b/i.exec(s);
    if (m) {
      var v = parseFloat(m[1]) * (/ghz/i.test(m[2]) ? 1000 : 1);
      return { lo: v, hi: v };
    }
    return null;
  }

  function mhzOverlapsVhf(lo, hi) {
    return lo < VHF_MHZ_HI && hi >= VHF_MHZ_LO;
  }

  function mhzOverlapsUhf(lo, hi) {
    return lo <= UHF_MHZ_HI && hi >= UHF_MHZ_LO;
  }

  function idLooksVhf(id) {
    return /^(air_|marine_|2m_|vor|vdl|ais|dab_|fm_|6m|4m)/i.test(id || "");
  }

  function idLooksUhf(id) {
    return /^(70c_|pmr|uhf|dmr|gmrs|gmsr)/i.test(id || "");
  }

  function findProfileForEl(el) {
    var val = (el && el.value) || "";
    var id = (el && el.dataset && el.dataset.id) || "";
    var list = profiles();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].value === val) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return { id: id, label: (el && el.dataset && el.dataset.label) || "", value: val };
  }

  function profileInAllVhf(p) {
    var r = parseMhzRange(p && p.label);
    if (r) return mhzOverlapsVhf(r.lo, r.hi);
    return idLooksVhf(p && p.id);
  }

  function profileInAllUhf(p) {
    var r = parseMhzRange(p && p.label);
    if (r) return mhzOverlapsUhf(r.lo, r.hi);
    return idLooksUhf(p && p.id);
  }

  function defaultSelected() {
    return profiles()
      .filter(function (p) { return /^air_[1-7]$/.test(p.id); })
      .map(function (p) { return p.value; });
  }

  function hookWaterfall() {
    if (window._bs_wf_hooked) return;
    if (typeof window.waterfall_add !== "function") return;
    var orig = window.waterfall_add;
    window.waterfall_add = function (data) {
      window.bs_wf_data = data;
      if (!window.fs_wf_data) window.fs_wf_data = data;
      return orig.apply(this, arguments);
    };
    window._bs_wf_hooked = true;
  }

  function wf() {
    return window.fs_wf_data || window.bs_wf_data || null;
  }

  function noiseFloor(data) {
    if (!data || data.length < 16) return -80;
    var copy = Array.prototype.slice.call(data).sort(function (a, b) { return a - b; });
    return copy[Math.floor(copy.length * 0.2)];
  }

  function freqOf(i, data) {
    var center = window.center_freq;
    var bw = window.bandwidth;
    return (center - bw / 2) + (i / data.length) * bw;
  }

  function snapFreq(freq, pid) {
    var step = 1000;
    if (/^air_|^vor|vdl2/.test(pid)) step = 25000 / 3;
    else if (/^fm_/.test(pid)) step = 100000;
    else if (/marine|2m_|70c_|pmr|ais|tetra/.test(pid)) step = 12500;
    return Math.round(freq / step) * step;
  }

  function guessMode(pid) {
    var mode = "nfm";
    if (/^air_|^vor/.test(pid)) mode = "am";
    else if (/^fm_/.test(pid)) mode = "wfm";
    else if (/lf|80m|hffax|40m|30m|25m|20m|17m|15m|12m|10m|6m_/.test(pid)) mode = "usb";
    if (window.Modes && typeof Modes.findByModulation === "function") {
      if (Modes.findByModulation(mode)) return mode;
      if (mode === "wfm" && Modes.findByModulation("wfm")) return "wfm";
      if (Modes.findByModulation("nfm")) return "nfm";
      if (Modes.findByModulation("am")) return "am";
    }
    return mode;
  }

  function findPeaks(pid) {
    var data = wf();
    var center = window.center_freq;
    var bw = window.bandwidth;
    if (!data || !data.length || !bw) return [];
    var floor = noiseFloor(data);
    var thr = floor + (Number(S.threshDb) || 10);
    var lo = Math.floor(data.length * EDGE_FRAC);
    var hi = Math.ceil(data.length * (1 - EDGE_FRAC));
    var found = [];
    var i = lo;
    while (i < hi) {
      if (data[i] < thr) {
        i++;
        continue;
      }
      var maxV = -999;
      var maxI = i;
      var sum = 0;
      var n = 0;
      while (i < hi && data[i] >= thr) {
        sum += data[i];
        n++;
        if (data[i] > maxV) {
          maxV = data[i];
          maxI = i;
        }
        i++;
      }
      if (!n) continue;
      // n=1 would always fail max<mean+1.2; only skip flat broadband blobs.
      if (n >= 4 && maxV < sum / n + 1.2) continue;
      var f = freqOf(maxI, data);
      if (Math.abs(f - center) < CENTER_GUARD_HZ) continue;
      if (isIgnoredFreq(snapFreq(f, pid))) continue;
      found.push({ freq: snapFreq(f, pid), raw: f, db: maxV, width: n, offset: f - center });
    }
    return found;
  }

  function mergeHz(pid) {
    if (/^air_|^vor/.test(pid)) return 4000;
    if (/^fm_/.test(pid)) return 80000;
    return 2500;
  }

  function findHit(freq, pid) {
    var tol = mergeHz(pid);
    for (var i = 0; i < hits.length; i++) {
      if (Math.abs(hits[i].freq - freq) <= tol) return hits[i];
    }
    return null;
  }

  function classifyHit(h) {
    if (!h) return;
    if (isIgnoredFreq(h.freq) || h.ignored) {
      h.spur = true;
      h.spurWhy = "ignored";
      return;
    }
    var looks = h.looks || 0;
    var duty = looks ? h.seen / looks : 0;
    var live = stddev(h.samples);
    var voice = !alwaysOnBand(h.pid);

    if (h.dongle) {
      h.spur = true;
      h.spurWhy = h.spurWhy || "same offset on several bands";
      return;
    }
    if (voice && looks >= 6 && duty >= 0.85 && (h.width || 9) <= 2) {
      h.spur = true;
      h.spurWhy = "narrow always-on line";
      return;
    }
    if (voice && looks >= 6 && duty >= 0.88 && live < 1.2) {
      h.spur = true;
      h.spurWhy = "steady line (birdie)";
      return;
    }
    if (voice && looks >= 6 && live < 0.7 && duty >= 0.7) {
      h.spur = true;
      h.spurWhy = "no level change";
      return;
    }
    if (!voice && (h.width || 9) <= 2 && looks >= 6 && live < 0.6 && duty >= 0.9) {
      h.spur = true;
      h.spurWhy = "narrow constant spur";
      return;
    }
    if (h.spur && h.spurWhy && h.spurWhy !== "ignored") {
      h.spur = false;
      h.spurWhy = "";
    }
  }

  function markDongleOffsets() {
    var buckets = {};
    hits.forEach(function (h) {
      if (h.offset == null) return;
      var key = String(offsetBucket(h.offset));
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(h);
    });
    Object.keys(buckets).forEach(function (key) {
      var group = buckets[key];
      var pids = {};
      group.forEach(function (h) { pids[h.pid] = true; });
      if (Object.keys(pids).length < 2) return;
      group.forEach(function (h) {
        h.dongle = true;
        h.spur = true;
        h.spurWhy = "same offset on " + Object.keys(pids).length + " bands";
      });
    });
  }

  function classifyAll() {
    markDongleOffsets();
    hits.forEach(classifyHit);
  }

  function recordLook(pid, label) {
    tileLooks[pid] = (tileLooks[pid] || 0) + 1;
    var peaks = findPeaks(pid);
    var now = Date.now();
    var seenIds = {};
    peaks.forEach(function (p) {
      var hit = findHit(p.freq, pid);
      if (!hit) {
        hit = {
          freq: p.freq,
          raw: p.raw,
          seen: 0,
          looks: 0,
          maxDb: p.db,
          lastDb: p.db,
          pid: pid,
          label: label,
          first: now,
          last: now,
          mode: guessMode(pid),
          samples: [],
          width: p.width || 1,
          offset: p.offset,
          spur: false,
          spurWhy: "",
          ignored: false,
          dongle: false,
          name: existingName(p.freq) || "",
          isNew: false
        };
        hits.push(hit);
      }
      hit.seen += 1;
      hit.looks += 1;
      hit.lastDb = p.db;
      if (p.db > hit.maxDb) hit.maxDb = p.db;
      hit.last = now;
      hit.width = p.width || hit.width;
      if (p.offset != null) hit.offset = p.offset;
      if (!hit.samples) hit.samples = [];
      hit.samples.push(p.db);
      if (hit.samples.length > 48) hit.samples = hit.samples.slice(-48);
      if (Math.abs(p.raw - hit.freq) < Math.abs((hit.raw || hit.freq) - hit.freq)) {
        hit.raw = p.raw;
      }
      seenIds[hit.freq] = true;
    });
    hits.forEach(function (h) {
      if (h.pid !== pid) return;
      if (seenIds[h.freq]) return;
      h.looks = (h.looks || 0) + 1;
    });
    classifyAll();
    var min = Number(S.minHits) || 3;
    var prev = loadSnap();
    hits.forEach(function (h) {
      if (h.pid !== pid || isSpur(h) || h._notified) return;
      if (h.seen < min) return;
      if (prev[freqKey(h.freq)]) return;
      h._notified = true;
      h.isNew = true;
      notify("New " + (h.name || existingName(h.freq) || icao833(h.freq) || fmtMhz(h.freq)));
    });
  }

  function fmtMhz(hz) {
    return (hz / 1e6).toFixed(hz >= 3e7 ? 3 : 3);
  }

  function isAuto(b) {
    return !!(b && (b.auto === true || (b.name && /^\[auto\]/i.test(b.name))));
  }

  function allBookmarks() {
    try {
      if (window.bookmarks && typeof bookmarks.getAllBookmarks === "function") {
        return bookmarks.getAllBookmarks() || [];
      }
    } catch (e) {}
    try {
      if (typeof BookmarkLocalStorage === "function") {
        return new BookmarkLocalStorage().getBookmarks() || [];
      }
    } catch (e2) {}
    return [];
  }

  function existingName(freq) {
    var list = [];
    try {
      if (typeof BookmarkLocalStorage === "function") {
        list = list.concat(new BookmarkLocalStorage().getBookmarks() || []);
      }
    } catch (e) {}
    list = list.concat(allBookmarks());
    list = list.concat(loadedBookmarks || []);
    for (var i = 0; i < list.length; i++) {
      if (list[i] && Math.abs(list[i].frequency - freq) < 2500) return list[i].name;
    }
    return null;
  }

  function bookmarkNameFor(hit) {
    if (hit && hit.name && String(hit.name).trim() && !/^\[auto\]/i.test(hit.name)) {
      return String(hit.name).trim();
    }
    var known = existingName(hit.freq);
    if (known && !/^\[auto\]/i.test(known)) return known;
    if (known) return known;
    var icao = hit && icao833(hit.freq);
    if (icao) return "[auto] " + icao;
    return "[auto] " + fmtMhz(hit.freq);
  }

  function addBookmark(hit) {
    if (isSpur(hit)) return null;
    var known = existingName(hit.freq);
    if (known && !/^\[auto\]/i.test(known)) {
      hit.name = known;
      return { freq: hit.freq, pid: hit.pid, mode: hit.mode, name: known, already: true };
    }
    if (typeof BookmarkLocalStorage !== "function") {
      setStatus("Cannot save blue bookmarks here. Use Export CSV/JSON, or see Help → Bookmarks.");
      return null;
    }
    backupLocalBookmarks("before-bookmark");
    var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
    var list = store.getBookmarks() || [];
    var name = bookmarkNameFor(hit);
    for (var i = 0; i < list.length; i++) {
      if (Math.abs(list[i].frequency - hit.freq) < 2500) {
        if (hit.name && list[i].name !== name) {
          list[i].name = name;
          store.setBookmarks(list);
          if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
            bookmarks.loadLocalBookmarks();
          }
        }
        return {
          freq: list[i].frequency,
          pid: hit.pid,
          mode: hit.mode || list[i].modulation,
          name: list[i].name,
          already: true
        };
      }
    }
    var id = 1;
    if (list.length) {
      id = 1 + Math.max.apply(Math, list.map(function (b) { return b.id || 0; }));
    }
    var bm = {
      id: id,
      name: name,
      frequency: Math.round(hit.freq),
      modulation: hit.mode || "am",
      underlying: "",
      description: "Seen " + hit.seen + "× on " + (hit.label || hit.pid),
      scannable: true,
      auto: true
    };
    list.push(bm);
    store.setBookmarks(list);
    if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
      bookmarks.loadLocalBookmarks();
    }
    hit.name = name;
    return { freq: bm.frequency, pid: hit.pid, mode: bm.modulation, name: name, already: false };
  }

  function qualifiedHits() {
    var min = Number(S.minHits) || 3;
    return hits.filter(function (h) {
      return !isSpur(h) && h.seen >= min;
    });
  }

  function autoBookmarkQualified() {
    var created = [];
    var min = Number(S.minHits) || 3;
    hits.forEach(function (h) {
      if (isSpur(h)) return;
      if (h.seen >= min) {
        var row = addBookmark(h);
        if (row) created.push(row);
      }
    });
    lastCreated = created.filter(function (r) { return !r.already; });
    return created;
  }

  function renameBookmark(freq, name) {
    name = String(name || "").trim();
    if (!name) return false;
    hits.forEach(function (h) {
      if (Math.abs(h.freq - freq) < 2500) h.name = name;
    });
    saveHits();
    if (typeof BookmarkLocalStorage !== "function") {
      renderHits();
      return true;
    }
    var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
    var list = store.getBookmarks() || [];
    var found = false;
    list.forEach(function (b) {
      if (Math.abs(b.frequency - freq) < 2500) {
        b.name = name;
        found = true;
      }
    });
    if (found) {
      store.setBookmarks(list);
      if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
        bookmarks.loadLocalBookmarks();
      }
    }
    lastCreated.forEach(function (row) {
      if (Math.abs(row.freq - freq) < 2500) row.name = name;
    });
    renderHits();
    refreshBookmarks();
    return true;
  }

  function askRename(freq) {
    var cur = "";
    hits.forEach(function (h) {
      if (Math.abs(h.freq - freq) < 2500) cur = h.name || "";
    });
    if (!cur) cur = existingName(freq) || ("[auto] " + fmtMhz(freq));
    var next = window.prompt("Bookmark name for " + fmtMhz(freq), cur);
    if (next == null) return;
    if (renameBookmark(freq, next)) setStatus("Renamed to “" + next.trim() + "”.");
  }

  function levelAt(freq) {
    var data = wf();
    var center = window.center_freq;
    var bw = window.bandwidth;
    if (!data || !data.length || !bw) return -999;
    var i = Math.floor((freq - (center - bw / 2)) / bw * data.length);
    if (i < 0 || i >= data.length) return -999;
    return data[i];
  }

  function profileValueForPid(pid) {
    var list = profiles();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === pid) return list[i].value;
    }
    return null;
  }

  function consumeListenAbort(freq, name) {
    if (listenCmd === "always") {
      ignoreFreq(freq);
      listenCmd = "";
      setStatus("Always skip " + (name || fmtMhz(freq)) + " — will not land here again");
      return true;
    }
    if (listenCmd === "lock") {
      lockout(freq);
      listenCmd = "";
      setStatus("Locked out " + (name || fmtMhz(freq)) + " for " + (S.lockoutMin || 30) + " min");
      return true;
    }
    if (listenCmd === "skip" || listenCmd === "continue") {
      listenCmd = "";
      return true;
    }
    return shouldSkipTune(freq);
  }

  async function listenBookmarks(items) {
    try {
    if (!items || !items.length) {
      setStatus("Nothing to listen to yet.");
      return;
    }
    if (courtesyBlocked("listening / retuning")) return;
    items = sortListenPriority(items.filter(function (row) {
      var f = (row.hit || row).freq || row.frequency;
      return !shouldSkipTune(f);
    }));
    if (!items.length) {
      setStatus("Everything is locked out or always-skipped right now.");
      return;
    }
    if (window.fs_scanner_state && fs_scanner_state.running && typeof fs_stop_scanner === "function") {
      try { fs_stop_scanner(); } catch (e) {}
    }
    if (window.UI && typeof UI.toggleScanner === "function") {
      try { UI.toggleScanner(false); } catch (e2) {}
    }
    muteOff();
    listenCmd = "";
    setListenPaused(false);
    var heard = 0;
    for (var i = 0; i < items.length && !stopFlag; i++) {
      var it = items[i].hit || items[i];
      var freq = it.freq || it.frequency;
      var pid = it.pid;
      var name = it.name || existingName(freq) || icao833(freq) || fmtMhz(freq);
      listenFreq = freq;
      if (shouldSkipTune(freq)) continue;
      var value = profileValueForPid(pid);
      var onThisTile = freqInVisibleRange(freq);
      if (!onThisTile && value && currentProfileValue() !== value) {
        if (lastProfileSwitchAt) {
          var waitMore = profileGapMs() - (Date.now() - lastProfileSwitchAt);
          var why = ownerHopsOn() ? "fast hops (own radio)" : "anti-ban, profile change";
          while (waitMore > 0 && !stopFlag) {
            setStatus("Listen wait " + Math.ceil(waitMore / 1000) + "s (" + why + ")");
            if (consumeListenAbort(freq, name)) break;
            await sleep(Math.min(200, waitMore));
            waitMore = profileGapMs() - (Date.now() - lastProfileSwitchAt);
          }
        }
        if (stopFlag) break;
        if (consumeListenAbort(freq, name)) continue;
        await switchProfile(value);
        lastProfileSwitchAt = Date.now();
      }
      if (consumeListenAbort(freq, name)) continue;
      if (window.UI && typeof UI.setFrequency === "function") UI.setFrequency(freq);
      if (it.mode && window.UI && typeof UI.setModulation === "function") {
        try { UI.setModulation(it.mode, ""); } catch (e3) {}
      }
      setStatus("Listen " + (i + 1) + "/" + items.length + " · " + name + " · " + fmtMhz(freq) + "  [Hold / Skip / Always skip / Continue scan]");
      var settled = Date.now() + HOP_SETTLE_MS;
      var abortHop = false;
      while (Date.now() < settled && !stopFlag) {
        if (consumeListenAbort(freq, name)) { abortHop = true; break; }
        await sleep(Math.min(150, settled - Date.now()));
      }
      if (abortHop || stopFlag) continue;
      var floor = noiseFloor(wf());
      var busyThr = floor + Math.max(4, (Number(S.threshDb) || 7) - 2);
      var lvl = levelAt(freq);
      if (consumeListenAbort(freq, name)) continue;
      if (lvl < busyThr && listenCmd !== "hold") {
        setStatus("Listen " + (i + 1) + "/" + items.length + " · quiet, skip · " + name);
        await sleep(400);
        continue;
      }
      heard++;
      var recOn = false;
      if (S.recordBusy) {
        setRecording(true, { freq: freq, name: name, pid: pid });
        recOn = true;
      }
      setListenPaused(true);
      setStatus("ACTIVE · " + name + " · " + fmtMhz(freq) + " — Continue scan or Always skip");
      while (!stopFlag) {
        if (consumeListenAbort(freq, name)) break;
        lvl = levelAt(freq);
        var extra = listenCmd === "hold" ? " · HOLD" : (lvl >= busyThr ? " · busy" : " · quiet");
        setStatus("ACTIVE · " + (i + 1) + "/" + items.length + " · " + name + " · " + Math.round(lvl) + " dB" + extra + " — Continue scan");
        await sleep(250);
      }
      setListenPaused(false);
      if (recOn) setRecording(false);
    }
    listenCmd = "";
    listenFreq = 0;
    setListenPaused(false);
    setRecording(false);
    if ($("bs-hold")) $("bs-hold").classList.remove("bs-on");
    if (stopFlag) setStatus("Listen stopped after " + heard + " busy bookmarks.");
    else setStatus("Listen done. " + heard + " busy / " + items.length + " bookmarks.");
    } catch (err) {
      listenFreq = 0;
      setRecording(false);
      setListenPaused(false);
      setStatus(friendlyError(err, "Listen"));
      toast(friendlyError(err, "Listen"));
      renderHealth();
    }
  }

  function clearAutoBookmarks() {
    if (typeof BookmarkLocalStorage !== "function") {
      setStatus("No local bookmark store on this page. Nothing to clear. See Help.");
      return 0;
    }
    backupLocalBookmarks("before-clear-auto");
    var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
    var list = store.getBookmarks() || [];
    var keep = list.filter(function (b) { return !isAuto(b); });
    var n = list.length - keep.length;
    store.setBookmarks(keep);
    if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
      bookmarks.loadLocalBookmarks();
    }
    return n;
  }

  function hookHide() {
    if (!window.BookmarkBar || BookmarkBar.prototype._bs_hide_hooked) return;
    BookmarkBar.prototype._bs_hide_hooked = true;
    var orig = BookmarkBar.prototype.render;
    BookmarkBar.prototype.render = function () {
      if (!S.hideAuto || !this.bookmarks) {
        return orig.call(this);
      }
      var saved = {};
      var src;
      for (src in this.bookmarks) {
        if (!Object.prototype.hasOwnProperty.call(this.bookmarks, src)) continue;
        saved[src] = this.bookmarks[src];
        this.bookmarks[src] = (this.bookmarks[src] || []).filter(function (b) {
          return !isAuto(b);
        });
      }
      orig.call(this);
      for (src in saved) {
        if (!Object.prototype.hasOwnProperty.call(saved, src)) continue;
        this.bookmarks[src] = saved[src];
      }
    };
  }

  function refreshBookmarks() {
    if (window.bookmarks && typeof bookmarks.render === "function") {
      bookmarks.render();
    } else if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
      bookmarks.loadLocalBookmarks();
    }
    renderBookmarkPane();
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function leftControlsSettingsMinPx() {
    var controls = $("bs-left-controls");
    var settings = $("bs-settings");
    var h = 0;
    if (controls) h += controls.offsetHeight;
    if (settings) h += settings.offsetHeight;
    return h + 20;
  }

  function leftSplitMinPct() {
    var stack = $("bs-left-stack");
    if (!stack) return 28;
    var sh = stack.getBoundingClientRect().height;
    if (sh < 80) return 28;
    return clamp(Math.ceil((leftControlsSettingsMinPx() / sh) * 100), 28, 78);
  }

  function applyPanelLayout() {
    var p = $("bs-panel");
    if (!p) return;
    var vw = window.innerWidth || 1024;
    var vh = window.innerHeight || 768;
    var minW = Math.min(520, Math.max(360, Math.floor(vw * 0.92)));
    var minH = 280;
    var w = clamp(Number(S.panelW) || 720, minW, Math.floor(vw * 0.96));
    var h = clamp(Number(S.panelH) || 520, minH, Math.floor(vh * 0.88));
    S.panelW = w;
    S.panelH = h;
    p.style.width = w + "px";
    p.style.height = h + "px";
    p.style.maxHeight = "none";
    var left = parseFloat(p.style.left);
    var top = parseFloat(p.style.top);
    if (isNaN(left)) {
      p.style.left = Math.max(4, vw - w - 12) + "px";
      p.style.right = "auto";
    } else {
      p.style.left = clamp(left, 4, Math.max(4, vw - minW - 4)) + "px";
    }
    if (isNaN(top)) {
      p.style.top = "72px";
    } else {
      p.style.top = clamp(top, 4, Math.max(4, vh - 80)) + "px";
    }
    var pct = Number(S.splitPct);
    if (!(pct >= 30 && pct <= 82)) pct = 62;
    S.splitPct = pct;
    var leftEl = $("bs-left");
    if (leftEl) leftEl.style.flex = "0 0 " + pct + "%";
    var minLsp = leftSplitMinPct();
    var lsp = Number(S.leftSplitPct);
    if (!(lsp >= minLsp && lsp <= 78)) lsp = Math.max(42, minLsp);
    if (lsp < minLsp) lsp = minLsp;
    S.leftSplitPct = lsp;
    var leftTop = $("bs-left-top");
    if (leftTop) leftTop.style.flex = lsp + " 1 0";
    var leftBottom = $("bs-left-bottom");
    if (leftBottom) leftBottom.style.flex = (100 - lsp) + " 1 0";
    var rs1 = Number(S.rightSplit1);
    var rs2 = Number(S.rightSplit2);
    var rs3 = Number(S.rightSplit3);
    if (!(rs1 >= 12 && rs1 <= 70)) rs1 = 38;
    if (!(rs2 >= rs1 + 10 && rs2 <= 85)) rs2 = Math.max(rs1 + 10, 56);
    if (!(rs3 >= rs2 + 10 && rs3 <= 92)) rs3 = Math.max(rs2 + 10, 78);
    S.rightSplit1 = rs1;
    S.rightSplit2 = rs2;
    S.rightSplit3 = rs3;
    var segMap = [
      ["bs-bm-seg", rs1],
      ["bs-loaded-seg", rs2 - rs1],
      ["bs-audio-seg", rs3 - rs2],
      ["bs-skip-seg", 100 - rs3]
    ];
    segMap.forEach(function (pair) {
      var el = $(pair[0]);
      if (el) el.style.flex = pair[1] + " 1 0";
    });
  }

  function savePanelLayout() {
    var p = $("bs-panel");
    if (!p) return;
    var r = p.getBoundingClientRect();
    if (r.width > 40 && r.height > 40) {
      S.panelW = Math.round(r.width);
      S.panelH = Math.round(r.height);
    }
    saveSettings();
  }

  function layoutDragKind() {
    return document.body.classList.contains("bs-layout-drag");
  }

  function ensureFloatTip() {
    var el = $("bs-float-tip");
    if (el) return el;
    el = document.createElement("div");
    el.id = "bs-float-tip";
    el.hidden = true;
    document.body.appendChild(el);
    return el;
  }

  function placeFloatTip(ev) {
    var el = $("bs-float-tip");
    if (!el || el.hidden) return;
    var pad = 8;
    var x = ev.clientX + 14;
    var y = ev.clientY + 18;
    var w = el.offsetWidth || 220;
    var h = el.offsetHeight || 40;
    if (x + w > window.innerWidth - pad) x = ev.clientX - w - 12;
    if (y + h > window.innerHeight - pad) y = ev.clientY - h - 12;
    el.style.left = Math.max(pad, x) + "px";
    el.style.top = Math.max(pad, y) + "px";
  }

  function hideFloatTip() {
    var el = $("bs-float-tip");
    if (el) el.hidden = true;
    var rest = hideFloatTip._restore;
    if (rest && rest.el && rest.title && !rest.el.getAttribute("title")) {
      rest.el.setAttribute("title", rest.title);
    }
    hideFloatTip._restore = null;
    hideFloatTip._host = null;
  }

  function showFloatTip(host, ev) {
    if (layoutDragKind()) {
      hideFloatTip();
      return;
    }
    if (hideFloatTip._host === host) {
      placeFloatTip(ev);
      return;
    }
    var text = host.getAttribute("data-tip") || host.getAttribute("title");
    if (!text) {
      hideFloatTip();
      return;
    }
    hideFloatTip();
    if (host.getAttribute("title")) {
      hideFloatTip._restore = { el: host, title: host.getAttribute("title") };
      host.removeAttribute("title");
    }
    hideFloatTip._host = host;
    var tip = ensureFloatTip();
    tip.textContent = text;
    tip.hidden = false;
    placeFloatTip(ev);
  }

  function wireHoverTips() {
    if (wireHoverTips._on) return;
    wireHoverTips._on = true;
    document.addEventListener("mousemove", function (ev) {
      var t = ev.target;
      if (!t || !t.closest) {
        hideFloatTip();
        return;
      }
      var root = t.closest("#bs-panel, #bs-help, #bs-fallback, #bs-fallback-chip, #bs-toggle-btn");
      var host = root && t.closest("[title], [data-tip]");
      if (host && root.contains(host) && !t.closest(".bs-resize-e, .bs-resize-s, .bs-resize-se, .bs-splitter, .bs-splitter-h")) {
        showFloatTip(host, ev);
      } else if (hideFloatTip._host) {
        hideFloatTip();
      }
    });
  }

  function bindPanelLayout(panel) {
    applyPanelLayout();
    wireHoverTips();
    var dragging = null;
    function setDragClass(kind) {
      document.body.classList.remove("bs-layout-drag", "bs-resize-ew", "bs-resize-ns", "bs-resize-nwse");
      if (!kind) return;
      document.body.classList.add("bs-layout-drag");
      if (kind === "e") document.body.classList.add("bs-resize-ew");
      else if (kind === "s" || kind === "left-split" || kind === "r1" || kind === "r2" || kind === "r3") {
        document.body.classList.add("bs-resize-ns");
      } else if (kind === "se") document.body.classList.add("bs-resize-nwse");
    }
    function onMove(ev) {
      if (!dragging) return;
      ev.preventDefault();
      hideFloatTip();
      if (dragging === "split") {
        var box = $("bs-split");
        if (!box) return;
        var r = box.getBoundingClientRect();
        if (r.width < 40) return;
        S.splitPct = clamp(((ev.clientX - r.left) / r.width) * 100, 32, 80);
        applyPanelLayout();
        return;
      }
      if (dragging === "left-split") {
        var lbox = $("bs-left-stack");
        if (!lbox) return;
        var lr = lbox.getBoundingClientRect();
        if (lr.height < 80) return;
        S.leftSplitPct = clamp(((ev.clientY - lr.top) / lr.height) * 100, leftSplitMinPct(), 78);
        applyPanelLayout();
        return;
      }
      if (dragging === "r1" || dragging === "r2" || dragging === "r3") {
        var rbox = $("bs-right-stack");
        if (!rbox) return;
        var rr = rbox.getBoundingClientRect();
        if (rr.height < 100) return;
        var yPct = clamp(((ev.clientY - rr.top) / rr.height) * 100, 8, 92);
        applyPanelLayout();
        if (dragging === "r1") {
          S.rightSplit1 = clamp(yPct, 12, Math.min(70, S.rightSplit2 - 10));
        } else if (dragging === "r2") {
          S.rightSplit2 = clamp(yPct, S.rightSplit1 + 10, Math.min(85, S.rightSplit3 - 10));
        } else if (dragging === "r3") {
          S.rightSplit3 = clamp(yPct, S.rightSplit2 + 10, 92);
        }
        applyPanelLayout();
        return;
      }
      var pr = panel.getBoundingClientRect();
      var w = pr.width;
      var h = pr.height;
      if (dragging.indexOf("e") >= 0) w = ev.clientX - pr.left;
      if (dragging.indexOf("s") >= 0) h = ev.clientY - pr.top;
      S.panelW = w;
      S.panelH = h;
      applyPanelLayout();
    }
    function onUp() {
      if (!dragging) return;
      dragging = null;
      setDragClass("");
      savePanelLayout();
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    var split = $("bs-splitter");
    if (split) {
      split.addEventListener("pointerdown", function (ev) {
        if (ev.button && ev.button !== 0) return;
        dragging = "split";
        setDragClass("split");
        try { split.setPointerCapture(ev.pointerId); } catch (e) {}
        ev.preventDefault();
      });
    }
    var leftSplit = $("bs-left-splitter");
    if (leftSplit) {
      leftSplit.addEventListener("pointerdown", function (ev) {
        if (ev.button && ev.button !== 0) return;
        dragging = "left-split";
        setDragClass("left-split");
        try { leftSplit.setPointerCapture(ev.pointerId); } catch (e) {}
        ev.preventDefault();
      });
    }
    Array.prototype.forEach.call(panel.querySelectorAll(".bs-splitter-h[data-split]"), function (h) {
      h.addEventListener("pointerdown", function (ev) {
        if (ev.button && ev.button !== 0) return;
        dragging = h.getAttribute("data-split");
        setDragClass(dragging);
        try { h.setPointerCapture(ev.pointerId); } catch (e2) {}
        ev.preventDefault();
      });
    });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-resize]"), function (h) {
      h.addEventListener("pointerdown", function (ev) {
        if (ev.button && ev.button !== 0) return;
        dragging = h.getAttribute("data-resize");
        setDragClass(dragging);
        try { h.setPointerCapture(ev.pointerId); } catch (e2) {}
        ev.preventDefault();
      });
    });
    if (!bindPanelLayout._win) {
      bindPanelLayout._win = true;
      window.addEventListener("resize", function () { applyPanelLayout(); });
    }
  }

  function bookmarkDisplayName(b) {
    var n = String((b && b.name) || "").trim();
    if (/^\[auto\]/i.test(n)) n = n.replace(/^\[auto\]\s*/i, "");
    return n || (b && b.frequency ? fmtMhz(b.frequency) : "");
  }

  function tuneBookmark(freq, mode) {
    freq = Number(freq);
    if (!freq) return;
    var hit = null;
    for (var i = 0; i < hits.length; i++) {
      if (Math.abs(hits[i].freq - freq) < 2500) {
        hit = hits[i];
        break;
      }
    }
    if (hit) {
      tuneTo(hit.freq, hit.pid);
      return;
    }
    if (window.UI && typeof UI.setFrequency === "function") UI.setFrequency(freq);
    if (mode && window.UI && typeof UI.setModulation === "function") {
      try { UI.setModulation(mode, ""); } catch (e) {}
    }
  }

  function renderBookmarkPane() {
    var host = $("bs-bmlist");
    if (!host) return;
    var list = localBookmarkList();
    if (!list) list = [];
    var skipN = (S.ignoredFreqs || []).length;
    var visibleLocal = list.slice().sort(function (a, b) {
      return (a.frequency || 0) - (b.frequency || 0);
    }).filter(function (b) { return !isIgnoredFreq(b.frequency); });
    var visibleLoaded = loadedBookmarks.slice().sort(function (a, b) {
      return a.frequency - b.frequency;
    }).filter(function (b) { return !isIgnoredFreq(b.frequency); });
    var count = $("bs-bmcount");
    if (count) {
      var parts = [];
      if (visibleLocal.length) parts.push(visibleLocal.length + " local");
      if (visibleLoaded.length) parts.push(visibleLoaded.length + " loaded");
      if (skipN) parts.push(skipN + " skipped");
      count.textContent = parts.length ? parts.join(" · ") : "";
    }
    if (!visibleLocal.length) {
      host.innerHTML = list.length && skipN
        ? '<p class="bs-empty">All local bookmarks are always-skipped — see Always skip below.</p>'
        : '<p class="bs-empty">No blue bookmarks in this browser yet. Auto-bookmark or + on a peak adds them here.</p>';
    } else {
      host.innerHTML = '<div class="bs-bm-section"><b class="bs-bm-section-head">Local</b><ul class="bs-bm-ul">' + visibleLocal.map(function (b) {
        var freq = b.frequency;
        var auto = isAuto(b);
        return '<li class="bs-bm-row' +
          '" data-bm-tune="' + freq + '" data-bm-mode="' + escapeHtml(b.modulation || "") +
          '" title="Tune to this bookmark.">' +
          '<span class="bs-bm-name">' + escapeHtml(bookmarkDisplayName(b)) + "</span>" +
          (auto ? '<span class="bs-bm-auto">[auto]</span>' : "") +
          '<span class="bs-bm-mhz">' + fmtMhz(freq) + "</span>" +
          '<button type="button" class="bs-tiny" data-bm-ign="' + freq + '" title="Skip this MHz forever and continue the scan.">ign</button>' +
          "</li>";
      }).join("") + "</ul></div>";
    }
    var loadedHost = $("bs-loadedlist");
    if (loadedHost) {
      if (!visibleLoaded.length) {
        loadedHost.innerHTML = loadedBookmarks.length && skipN
          ? '<p class="bs-empty">All loaded bookmarks are always-skipped — see Always skip below.</p>'
          : '<p class="bs-empty">Load bookmarks from JSON/CSV — tagged [load], scanned separately from [auto].</p>';
      } else {
        loadedHost.innerHTML = '<div class="bs-bm-section"><b class="bs-bm-section-head">Loaded</b><ul class="bs-bm-ul">' +
          visibleLoaded.map(function (b) {
            var freq = b.frequency;
            return '<li class="bs-bm-row bs-bm-loaded' +
              '" data-loaded-tune="' + freq + '" data-bm-mode="' + escapeHtml(b.modulation || "") +
              '" title="Tune to this loaded bookmark.">' +
              '<span class="bs-bm-name">' + escapeHtml(b.name || fmtMhz(freq)) + "</span>" +
              '<span class="bs-bm-load">[load]</span>' +
              '<span class="bs-bm-mhz">' + fmtMhz(freq) + "</span>" +
              '<button type="button" class="bs-tiny" data-bm-ign="' + freq + '" title="Skip this MHz forever and continue the scan.">ign</button>' +
              "</li>";
          }).join("") + "</ul></div>";
      }
    }
    var skipHead = $("bs-skiphead");
    var skipHost = $("bs-skiplist");
    var ign = (S.ignoredFreqs || []).slice().sort(function (a, b) { return a - b; });
    if (skipHead) skipHead.textContent = ign.length ? ("Always skip (" + ign.length + ")") : "Always skip";
    if (!skipHost) return;
    if (!ign.length) {
      skipHost.innerHTML = '<p class="bs-empty">None. Always skip or ign on a peak adds frequencies here.</p>';
      return;
    }
    skipHost.innerHTML = ign.map(function (f) {
      var known = existingName(f) || "";
      return '<div class="bs-skip-row">' +
        '<button type="button" class="bs-tune" data-skip-tune="' + f + '" title="Tune to this frequency.">' +
        fmtMhz(f) + "</button>" +
        (known ? '<span class="bs-bm-name">' + escapeHtml(known) + "</span>" : "") +
        '<button type="button" class="bs-tiny bs-on" data-bm-ign="' + f + '" title="Stop always-skipping this frequency.">un-ign</button></div>';
    }).join("");
    renderAudioClips();
  }

  function clipLabel(clip) {
    return clip.name || (clip.freq ? fmtMhz(clip.freq) : (clip.file || "clip"));
  }

  function renderAudioClips() {
    var host = $("bs-audiolist");
    var head = $("bs-audiohead");
    if (head) head.textContent = audioClips.length ? ("Audio clips (" + audioClips.length + ")") : "Audio clips";
    if (!host) return;
    if (!audioClips.length) {
      host.innerHTML = '<p class="bs-empty">None this session. Tick Record busy, then Scan bookmarks — clips are saved only while parked on a busy/held channel, not during the survey walk. Load audio adds files from disk.</p>';
      return;
    }
    host.innerHTML = audioClips.map(function (c) {
      var when = new Date(c.at || Date.now()).toLocaleTimeString();
      var playing = clipPlaying && clipPlaying.id === c.id;
      return '<div class="bs-audio-row' + (playing ? " bs-audio-on" : "") + '">' +
        '<button type="button" class="bs-tiny" data-clip-play="' + c.id + '" title="' +
        (playing ? "Stop this clip." : "Play this clip in the panel.") + '">' +
        (playing ? "Stop" : "Play") + "</button>" +
        '<span class="bs-bm-mhz">' + (c.freq ? fmtMhz(c.freq) : "—") + "</span>" +
        '<span class="bs-bm-name" title="' + escapeHtml(clipLabel(c)) + '">' + escapeHtml(clipLabel(c)) + "</span>" +
        '<span class="bs-hint">' + when + (c.loaded ? " · loaded" : "") + "</span>" +
        '<button type="button" class="bs-tiny" data-clip-save="' + c.id + '" title="Download this clip.">Save</button>' +
        '<button type="button" class="bs-tiny" data-clip-del="' + c.id + '" title="Remove this clip from the list (does not delete a file you already saved).">×</button>' +
        "</div>";
    }).join("");
  }

  function stopClipPlayback() {
    if (clipPlaying && clipPlaying.el) {
      try { clipPlaying.el.pause(); } catch (e) {}
    }
    clipPlaying = null;
  }

  function playAudioClip(id) {
    var clip = null;
    for (var i = 0; i < audioClips.length; i++) {
      if (audioClips[i].id === id) clip = audioClips[i];
    }
    if (!clip || !clip.url) return;
    if (clipPlaying && clipPlaying.id === id) {
      stopClipPlayback();
      renderAudioClips();
      return;
    }
    stopClipPlayback();
    var el = new Audio(clip.url);
    clipPlaying = { id: id, el: el };
    el.onended = function () {
      clipPlaying = null;
      renderAudioClips();
    };
    el.onerror = function () {
      setStatus("Could not play that clip in this browser.");
      clipPlaying = null;
      renderAudioClips();
    };
    var go = el.play();
    if (go && typeof go.catch === "function") {
      go.catch(function () {
        setStatus("Playback blocked — click Play again after interacting with the page.");
        clipPlaying = null;
        renderAudioClips();
      });
    }
    renderAudioClips();
  }

  function downloadBlob(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 1500);
  }

  function saveAudioClip(id) {
    var clip = null;
    for (var i = 0; i < audioClips.length; i++) {
      if (audioClips[i].id === id) clip = audioClips[i];
    }
    if (!clip || !clip.blob) {
      setStatus("That clip is gone.");
      return;
    }
    downloadBlob(clip.file || clipFileName(clip), clip.blob);
  }

  function saveAllAudioClips() {
    if (!audioClips.length) {
      setStatus("No clips to save. Tick Record busy and scan a busy channel, or Load audio first.");
      toast("No audio clips yet.");
      return;
    }
    audioClips.forEach(function (c, i) {
      setTimeout(function () { saveAudioClip(c.id); }, i * 250);
    });
    setStatus("Downloading " + audioClips.length + " audio clip" + (audioClips.length === 1 ? "" : "s") + ".");
  }

  function removeAudioClip(id) {
    audioClips = audioClips.filter(function (c) {
      if (c.id !== id) return true;
      if (clipPlaying && clipPlaying.id === id) stopClipPlayback();
      if (c.url) {
        try { URL.revokeObjectURL(c.url); } catch (e) {}
      }
      return false;
    });
    renderAudioClips();
  }

  function parseFreqFromAudioName(name) {
    var s = String(name || "");
    var m = /(?:^|[^\d])(\d{2,4}(?:[p.]\d{1,3})?)MHz/i.exec(s);
    if (m) return Math.round(parseFloat(m[1].replace("p", ".")) * 1e6);
    m = /REC-[^-]+-(\d{4,7})\.mp3/i.exec(s);
    if (m) return Number(m[1]) * 1000;
    return 0;
  }

  function loadAudioFiles(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    var n = 0;
    list.forEach(function (file) {
      if (!file) return;
      var url = URL.createObjectURL(file);
      addAudioClip({
        id: clipSeq++,
        freq: parseFreqFromAudioName(file.name),
        name: file.name.replace(/\.[^.]+$/, ""),
        file: file.name,
        at: (file.lastModified) || Date.now(),
        blob: file,
        url: url,
        mime: file.type || "audio/*",
        ext: (file.name.split(".").pop() || "webm").toLowerCase(),
        loaded: true
      });
      n++;
    });
    if (n) setStatus("Loaded " + n + " audio file" + (n === 1 ? "" : "s") + " — Play on the right.");
  }

  function onAudioPaneClick(ev) {
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    var play = t.getAttribute("data-clip-play");
    if (play) {
      ev.preventDefault();
      playAudioClip(Number(play));
      return;
    }
    var save = t.getAttribute("data-clip-save");
    if (save) {
      ev.preventDefault();
      saveAudioClip(Number(save));
      return;
    }
    var del = t.getAttribute("data-clip-del");
    if (del) {
      ev.preventDefault();
      removeAudioClip(Number(del));
    }
  }

  function onBookmarkPaneClick(ev) {
    var t = ev.target;
    if (!t) return;
    var ign = t.getAttribute && t.getAttribute("data-bm-ign");
    if (ign) {
      ev.preventDefault();
      ev.stopPropagation();
      var f = Number(ign);
      if (isIgnoredFreq(f)) {
        unignoreFreq(f);
        setStatus("Will land on " + fmtMhz(f) + " again.");
      } else {
        ignoreFreq(f);
        if (continueIfPausedOn(f)) {
          setStatus("Always skip " + fmtMhz(f) + " — continuing scan.");
        } else {
          setStatus("Always skip " + fmtMhz(f) + " (saved in this browser).");
        }
      }
      renderBookmarkPane();
      return;
    }
    var skipTune = t.getAttribute && t.getAttribute("data-skip-tune");
    if (skipTune) {
      tuneBookmark(Number(skipTune), "");
      return;
    }
    var row = t.closest && t.closest("[data-bm-tune]");
    if (row) {
      tuneBookmark(Number(row.getAttribute("data-bm-tune")), row.getAttribute("data-bm-mode") || "");
      return;
    }
    row = t.closest && t.closest("[data-loaded-tune]");
    if (row) {
      tuneBookmark(Number(row.getAttribute("data-loaded-tune")), row.getAttribute("data-bm-mode") || "");
    }
  }

  function selectedValues() {
    var box = $("bs-bands");
    if (!box) return [];
    return Array.prototype.map.call(box.querySelectorAll("input:checked"), function (el) {
      return el.value;
    });
  }

  function applyPreset(kind) {
    var box = $("bs-bands");
    if (!box) return;
    if (kind === "none") {
      Array.prototype.forEach.call(box.querySelectorAll("input[type=checkbox]"), function (el) {
        el.checked = false;
      });
    } else if (kind === "all") {
      Array.prototype.forEach.call(box.querySelectorAll("input[type=checkbox]"), function (el) {
        el.checked = true;
      });
    } else {
      Array.prototype.forEach.call(box.querySelectorAll("input[type=checkbox]"), function (el) {
        var id = el.dataset.id || "";
        var match = false;
        if (kind === "air") match = /^air_[1-7]$/.test(id);
        else if (kind === "vhf") match = /^(air_|marine_|2m_|pmr)/.test(id);
        else if (kind === "allvhf") match = profileInAllVhf(findProfileForEl(el));
        else if (kind === "alluhf") match = profileInAllUhf(findProfileForEl(el));
        else if (kind === "ham") match = /^(80m|40m|30m|20m|17m|15m|12m|10m|6m|4m|2m_|70c_)/.test(id);
        if (match) el.checked = true;
      });
    }
    S.selected = selectedValues();
    saveSettings();
    updateCount();
  }

  function updateCount() {
    var el = $("bs-selcount");
    if (!el) return;
    var n = selectedValues().length;
    var tot = profiles().length;
    el.textContent = n + " / " + tot + " bands";
  }

  function filterBands() {
    var q = (($("bs-filter") && $("bs-filter").value) || "").toLowerCase();
    var box = $("bs-bands");
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll("label"), function (lab) {
      var t = (lab.textContent || "").toLowerCase();
      lab.style.display = !q || t.indexOf(q) >= 0 ? "" : "none";
    });
  }

  function fillBands() {
    var box = $("bs-bands");
    if (!box) return;
    var list = profiles();
    if (!list.length) {
      box.innerHTML = '<p class="bs-empty">No band profiles yet. Wait a few seconds for the radio to connect, then click Check install. If this stays empty, add SDR profiles in OpenWebRX settings (admin) — Help has the steps.</p>';
      updateCount();
      return;
    }
    var chosen = S.selected && S.selected.length ? S.selected : defaultSelected();
    var chosenSet = {};
    chosen.forEach(function (v) { chosenSet[v] = true; });
    box.innerHTML = "";
    list.forEach(function (p) {
      var lab = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = p.value;
      cb.dataset.id = p.id;
      cb.dataset.label = p.label;
      cb.checked = !!chosenSet[p.value];
      var id = document.createElement("span");
      id.className = "bs-id";
      id.textContent = p.id;
      var name = document.createElement("span");
      name.textContent = p.label;
      lab.title = "Include this band when Scan bands or Fresh scan runs.";
      lab.appendChild(cb);
      lab.appendChild(id);
      lab.appendChild(name);
      box.appendChild(lab);
    });
    updateCount();
  }

  function visibleHits() {
    if (!S.hideSpurs) return hits.slice();
    return hits.filter(function (h) { return !isSpur(h); });
  }

  function spurCount() {
    return hits.filter(isSpur).length;
  }

  function sortedHits() {
    var copy = visibleHits();
    copy.sort(function (a, b) {
      if (sortKey === "freq") return a.freq - b.freq;
      if (sortKey === "db") return b.maxDb - a.maxDb;
      if (a.seen !== b.seen) return b.seen - a.seen;
      return b.maxDb - a.maxDb;
    });
    return copy;
  }

  function updateClearSkipBtn() {
    var skipN = (S.ignoredFreqs || []).length;
    var clr = $("bs-clearskip");
    if (!clr) return;
    clr.hidden = !skipN;
    clr.textContent = skipN ? ("Clear always-skip (" + skipN + ")") : "Clear always-skip";
  }

  function renderHits() {
    updateClearSkipBtn();
    var host = $("bs-hitwrap");
    if (!host) return;
    if (!hits.length) {
      host.innerHTML = '<p class="bs-empty">No peaks yet. Pick bands and press Scan bands or Fresh scan.</p>';
      renderBookmarkPane();
      return;
    }
    var shown = sortedHits();
    if (!shown.length) {
      host.innerHTML = '<p class="bs-empty">' + spurCount() + " birdies hidden. Untick “Hide birdies” to un-ign, or Clear always-skip.</p>";
      renderBookmarkPane();
      return;
    }
    var rows = shown.map(function (h) {
      var known = existingName(h.freq);
      var spur = isSpur(h);
      var bm = spur
        ? ""
        : (known
          ? '<span title="' + escapeHtml(known) + '">bm</span>'
          : '<button type="button" class="bs-tiny" data-bm="' + h.freq + '" title="Save this peak as a blue bookmark in this browser.">+</button>');
      var tag = spur ? '<span class="bs-spur-tag" title="' + escapeHtml(h.spurWhy || "birdie") + '">birdie</span>' : "";
      var icao = icao833(h.freq);
      var ch = icao && icao !== fmtMhz(h.freq) ? '<span class="bs-icao">' + icao + "</span> " : "";
      var newb = h.isNew && !spur ? '<span class="bs-new">new</span> ' : "";
      var pri = isPriority(h.freq) && !spur ? '<span class="bs-pri">pri</span> ' : "";
      var nm = h.name || known || "";
      var alwaysOn = isIgnoredFreq(h.freq) || !!h.ignored;
      var ignBtn = alwaysOn
        ? ' <button type="button" class="bs-tiny bs-on" data-ignore="' + h.freq + '" title="Stop always-skipping this MHz">un-ign</button>'
        : ' <button type="button" class="bs-tiny" data-ignore="' + h.freq + '" title="Skip this MHz forever and continue the scan.">ign</button>';
      return '<tr class="' + (spur ? "bs-spur" : "") + '">' +
        '<td class="bs-n">' + h.seen + "</td>" +
        '<td>' + pri + newb + ch +
        '<button type="button" class="bs-tune" data-tune="' + h.freq + '" data-pid="' + escapeHtml(h.pid) + '" title="Tune the receiver to this frequency.">' +
        fmtMhz(h.freq) + "</button> " + tag + "</td>" +
        '<td><button type="button" class="bs-tune" data-rename="' + h.freq + '" title="Rename bookmark">' +
        (nm ? escapeHtml(nm) : "name") + "</button></td>" +
        "<td>" + Math.round(h.maxDb) + "</td>" +
        "<td>" + escapeHtml(h.label || h.pid) + "</td>" +
        "<td>" + bm + ignBtn + "</td>" +
        "</tr>";
    }).join("");
    updateClearSkipBtn();
    var extra = S.hideSpurs && spurCount()
      ? '<p class="bs-empty">' + spurCount() + " birdies hidden. Untick Hide birdies to un-ign, or Clear always-skip.</p>"
      : "";
    host.innerHTML = extra +
      '<table class="bs-hits"><thead><tr>' +
      '<th data-sort="seen"' + (sortKey === "seen" ? ' class="bs-sort"' : "") + ' title="Sort by how many times this peak was counted.">Seen</th>' +
      '<th data-sort="freq"' + (sortKey === "freq" ? ' class="bs-sort"' : "") + ' title="Sort by frequency.">MHz</th>' +
      "<th>Name</th>" +
      '<th data-sort="db"' + (sortKey === "db" ? ' class="bs-sort"' : "") + ' title="Sort by strongest reading.">dB</th>' +
      "<th>Band</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>";
    renderBookmarkPane();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function setStatus(msg) {
    var el = $("bs-status");
    if (el) el.textContent = msg || "";
  }

  function setProgress(frac) {
    var el = $("bs-bar");
    if (el) el.style.width = Math.max(0, Math.min(100, frac * 100)) + "%";
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function switchProfile(value) {
    var sel = $("openwebrx-sdr-profiles-listbox");
    if (!sel) return Promise.resolve(false);
    var prevCenter = window.center_freq;
    var already = sel.value === value;
    if (!already) {
      sel.value = value;
      var toggle = $("owrx-band-toggle");
      if (toggle) {
        var opt = sel.options[sel.selectedIndex];
        toggle.textContent = opt ? opt.text : "Bands";
      }
      if (typeof sdr_profile_changed === "function") sdr_profile_changed();
      else sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    var t0 = Date.now();
    return new Promise(function (resolve) {
      (function tick() {
        var nowSel = $("openwebrx-sdr-profiles-listbox");
        var ok = nowSel && nowSel.value === value;
        var data = wf();
        var moved = already || window.center_freq !== prevCenter;
        if (ok && moved && data && data.length > 32 && Date.now() - t0 > 600) {
          resolve(true);
          return;
        }
        if (Date.now() - t0 > 10000) {
          resolve(ok);
          return;
        }
        setTimeout(tick, 200);
      })();
    });
  }

  function muteOn() {
    if (!S.mute || mutedHold) return;
    mutedHold = true;
    try {
      if (window.UI && typeof UI.volume === "number") savedVol = UI.volume;
      if (window.audioEngine && typeof audioEngine.setVolume === "function") {
        audioEngine.setVolume(0);
      } else if (window.UI && typeof UI.setVolume === "function") {
        UI.setVolume(0);
      }
    } catch (e) {}
  }

  function muteOff() {
    if (!mutedHold) return;
    mutedHold = false;
    try {
      if (window.UI && UI.volumeMuted >= 0) return;
      if (savedVol != null && window.UI && typeof UI.setVolume === "function") {
        UI.setVolume(savedVol);
      }
    } catch (e) {}
    savedVol = null;
  }

  function profileByValue(value) {
    var list = profiles();
    for (var i = 0; i < list.length; i++) {
      if (list[i].value === value) return list[i];
    }
    return null;
  }

  function ignoreFreq(freq) {
    freq = Number(freq);
    if (!freq) return;
    S.ignoredFreqs = S.ignoredFreqs || [];
    if (!isIgnoredFreq(freq)) S.ignoredFreqs.push(Math.round(freq));
    hits.forEach(function (h) {
      if (Math.abs(h.freq - freq) < 4000) {
        h.ignored = true;
        h.spur = true;
        h.spurWhy = "ignored";
      }
    });
    saveSettings();
    saveHits();
    renderHits();
  }

  function unignoreFreq(freq) {
    freq = Number(freq);
    S.ignoredFreqs = (S.ignoredFreqs || []).filter(function (f) {
      return Math.abs(f - freq) >= 4000;
    });
    hits.forEach(function (h) {
      if (Math.abs(h.freq - freq) < 4000) {
        h.ignored = false;
        if (h.spurWhy === "ignored") {
          h.spur = false;
          h.spurWhy = "";
        }
      }
    });
    classifyAll();
    saveSettings();
    saveHits();
    renderHits();
  }

  function clearAlwaysSkips() {
    var n = (S.ignoredFreqs || []).length;
    S.ignoredFreqs = [];
    hits.forEach(function (h) {
      if (h.ignored) {
        h.ignored = false;
        if (h.spurWhy === "ignored") {
          h.spur = false;
          h.spurWhy = "";
        }
      }
    });
    classifyAll();
    saveSettings();
    saveHits();
    renderHits();
    setStatus(n ? ("Cleared " + n + " always-skip frequenc" + (n === 1 ? "y." : "ies.")) : "No always-skip frequencies.");
  }

  function currentTuneHz() {
    if (listenFreq) return listenFreq;
    try {
      if (window.UI && typeof UI.getFrequency === "function") {
        var u = UI.getFrequency();
        if (u) return u;
      }
    } catch (e) {}
    try {
      if (window.dems) {
        var ids = Object.keys(window.dems);
        if (ids.length && window.dems[ids[0]] && typeof window.dems[ids[0]].get_offset_frequency === "function") {
          return window.center_freq + window.dems[ids[0]].get_offset_frequency();
        }
      }
    } catch (e2) {}
    return 0;
  }

  async function runSurvey(fresh) {
    if (running) return;
    hookWaterfall();
    readForm();
    S.passes = $("bs-passes") ? Math.max(1, Math.min(20, Number($("bs-passes").value) || 2)) : S.passes;
    S.dwell = $("bs-dwell") ? Math.max(0.8, Math.min(15, Number($("bs-dwell").value) || 2.5)) : S.dwell;
    S.minHits = $("bs-minhits") ? Math.max(1, Math.min(50, Number($("bs-minhits").value) || 3)) : S.minHits;
    S.threshDb = $("bs-thresh") ? Math.max(4, Math.min(25, Number($("bs-thresh").value) || 10)) : S.threshDb;
    if ($("bs-autobm")) S.autoBm = $("bs-autobm").checked;
    if ($("bs-mute")) S.mute = $("bs-mute").checked;
    var box = $("bs-bands");
    if (box && !box.querySelector("input")) fillBands();
    S.selected = selectedValues();
    saveSettings();
    if (!S.selected.length) {
      var noProfiles = !profiles().length;
      var msg = noProfiles
        ? "No bands to pick yet. Wait for the radio to finish loading, then click Check install. See Help if this stays empty."
        : "Pick at least one band (or tap Air / VHF voice / All VHF / All UHF / Ham).";
      setStatus(msg);
      toast(msg);
      renderHealth({ ok: true });
      return;
    }
    var blocked = blockingIssue();
    if (blocked) {
      setStatus(blocked.title + " — " + blocked.fix);
      renderHealth();
      openHelp();
      return;
    }
    if (courtesyBlocked("surveying")) return;
    if (window.fs_scanner_state && fs_scanner_state.running && typeof fs_stop_scanner === "function") {
      try { fs_stop_scanner(); } catch (e) {}
    }
    running = true;
    stopFlag = false;
    var snapBefore = loadSnap();
    if (fresh) {
      hits = [];
      tileLooks = {};
    }
    renderHits();
    var btn = $("bs-toggle-btn");
    if (btn) btn.classList.add("bs-running");
    muteOn();
    var total = S.selected.length * S.passes;
    var step = 0;
    try {
      for (var pass = 1; pass <= S.passes && !stopFlag; pass++) {
        for (var i = 0; i < S.selected.length && !stopFlag; i++) {
          var value = S.selected[i];
          var p = profileByValue(value) || { id: value, label: value };
          setStatus("Pass " + pass + "/" + S.passes + " · " + p.label);
          setProgress(step / total);
          var needSwitch = currentProfileValue() !== value;
          if (needSwitch) {
            await waitProfileGap("Pass " + pass + "/" + S.passes + " · " + p.label + " · waiting");
            if (stopFlag) break;
            await switchProfile(value);
            lastProfileSwitchAt = Date.now();
          } else {
            await switchProfile(value);
          }
          var until = Date.now() + S.dwell * 1000;
          var lastNoise = "";
          while (Date.now() < until && !stopFlag) {
            recordLook(p.id, p.label);
            saveHits();
            var data = wf();
            if (data && data.length) {
              lastNoise = " · noise " + Math.round(noiseFloor(data)) + " dB · " + hits.length + " peaks";
            }
            setStatus("Pass " + pass + "/" + S.passes + " · " + p.label + lastNoise);
            renderHits();
            await sleep(SAMPLE_MS);
          }
          step++;
          setProgress(step / total);
        }
      }
      classifyAll();
      markNewFlags(snapBefore);
      saveHits();
      saveSnap();
      var created = S.autoBm ? autoBookmarkQualified() : [];
      var freshBm = created.filter(function (r) { return !r.already; });
      lastCreated = freshBm;
      var liveN = hits.filter(function (h) { return !isSpur(h); }).length;
      var newN = hits.filter(function (h) { return h.isNew && !isSpur(h); }).length;
      var extra = hits.length ? "" : " Nothing sat above the threshold — lower “dB over noise” or pick a busier band.";
      var summary = liveN + " signals (" + newN + " new), " + spurCount() + " birdies ignored. " + freshBm.length + " auto bookmarks.";
      if (stopFlag) setStatus("Stopped. " + summary + extra);
      else setStatus("Done. " + summary + extra);
      muteOff();
      if (!stopFlag && S.scanAfter && freshBm.length) {
        setStatus("Done. " + summary + " Listening to new bookmarks…");
        await listenBookmarks(freshBm);
      } else if (!stopFlag && S.scanAfter && !freshBm.length && qualifiedHits().length) {
        setStatus("No new bookmarks — listening to qualified peaks…");
        await listenBookmarks(qualifiedHits().map(function (h) { return { hit: h, freq: h.freq, pid: h.pid, mode: h.mode, name: bookmarkNameFor(h) }; }));
      }
    } catch (err) {
      setStatus(friendlyError(err, "Survey"));
      toast(friendlyError(err, "Survey"));
      renderHealth({ all: true, toast: false });
    }
    running = false;
    if (btn) btn.classList.remove("bs-running");
    if (!S.scanAfter) muteOff();
    renderHits();
  }

  function stopSurvey() {
    stopFlag = true;
    setStatus("Stopping…");
  }

  function tuneTo(freq, pid) {
    var list = profiles();
    var want = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === pid) {
        want = list[i].value;
        break;
      }
    }
    var go = want ? switchProfile(want) : Promise.resolve(true);
    go.then(function () {
      if (window.UI && typeof UI.setFrequency === "function") UI.setFrequency(freq);
      var hit = null;
      for (var j = 0; j < hits.length; j++) {
        if (hits[j].freq === freq) hit = hits[j];
      }
      if (hit && window.UI && typeof UI.setModulation === "function") {
        try { UI.setModulation(hit.mode, ""); } catch (e) {}
      }
    });
  }

  function copyResults() {
    try {
    var lines = sortedHits().map(function (h) {
      return h.seen + "\t" + fmtMhz(h.freq) + "\t" + (icao833(h.freq) || "") + "\t" +
        Math.round(h.maxDb) + "\t" + (h.label || h.pid) + "\t" + (h.name || "") + "\t" + (h.isNew ? "new" : "");
    });
    lines.unshift("seen\tMHz\tch833\tdB\tband\tname\tnew");
    var text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setStatus("Copied " + hits.length + " peaks.");
    } else {
      setStatus("Clipboard blocked — use Export CSV instead.");
    }
    } catch (err) {
      setStatus(friendlyError(err, "Copy"));
    }
  }

  function downloadFile(name, text, mime) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime || "text/plain" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 1500);
  }

  function hitForExport(h) {
    return {
      freq: h.freq,
      raw: h.raw,
      seen: h.seen,
      looks: h.looks,
      maxDb: h.maxDb,
      lastDb: h.lastDb,
      pid: h.pid,
      label: h.label,
      first: h.first,
      last: h.last,
      mode: h.mode,
      samples: (h.samples || []).slice(-48),
      width: h.width,
      offset: h.offset,
      spur: !!h.spur,
      spurWhy: h.spurWhy || "",
      ignored: !!h.ignored,
      dongle: !!h.dongle,
      name: h.name || "",
      isNew: !!h.isNew
    };
  }

  function exportCsv() {
    try {
    var lines = ["seen,MHz,ch833,dB,band,name,new,birdie,last,pid,looks,mode"];
    hits.slice().sort(function (a, b) {
      if (a.seen !== b.seen) return b.seen - a.seen;
      return (b.maxDb || 0) - (a.maxDb || 0);
    }).forEach(function (h) {
      lines.push([
        h.seen,
        fmtMhz(h.freq),
        icao833(h.freq),
        Math.round(h.maxDb),
        JSON.stringify(h.label || h.pid),
        JSON.stringify(h.name || existingName(h.freq) || ""),
        h.isNew ? "yes" : "",
        isSpur(h) ? (h.spurWhy || "yes") : "",
        h.last ? new Date(h.last).toISOString() : "",
        JSON.stringify(h.pid || ""),
        h.looks || "",
        JSON.stringify(h.mode || "")
      ].join(","));
    });
    downloadFile("band-survey.csv", lines.join("\n"), "text/csv");
    setStatus("Exported CSV (" + hits.length + " peaks).");
    } catch (err) {
      setStatus(friendlyError(err, "Export CSV"));
      toast(friendlyError(err, "Export CSV"));
    }
  }

  function bookmarkRowsForExport() {
    return qualifiedHits().map(function (h) {
      return {
        name: bookmarkNameFor(h),
        frequency: Math.round(h.freq),
        modulation: h.mode || "am",
        description: "survey seen " + h.seen + (h.isNew ? " (new)" : "")
      };
    });
  }

  function exportServerJson() {
    try {
    var bookmarks = bookmarkRowsForExport();
    var payload = {
      kind: "owrx-band-survey",
      version: 1,
      exported: new Date().toISOString(),
      bookmarks: bookmarks,
      hits: hits.map(hitForExport),
      tileLooks: tileLooks
    };
    downloadFile("bookmarks-survey.json", JSON.stringify(payload, null, 2), "application/json");
    setStatus("Exported " + bookmarks.length + " bookmark rows plus " + hits.length + " peaks. For yellow server bookmarks, merge the bookmarks array on the radio host.");
    } catch (err) {
      setStatus(friendlyError(err, "Export JSON"));
      toast(friendlyError(err, "Export JSON"));
    }
  }

  function parseCsvLine(line) {
    var out = [];
    var cur = "";
    var i = 0;
    var inQ = false;
    while (i < line.length) {
      var c = line.charAt(i);
      if (inQ) {
        if (c === "\\" && line.charAt(i + 1) === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        if (c === '"') {
          if (line.charAt(i + 1) === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          inQ = false;
          i++;
          continue;
        }
        cur += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === ",") {
        out.push(cur);
        cur = "";
        i++;
        continue;
      }
      cur += c;
      i++;
    }
    out.push(cur);
    return out;
  }

  function hzFromCell(raw) {
    var n = Number(String(raw || "").replace(/[^\d.eE+-]/g, ""));
    if (!isFinite(n) || n <= 0) return 0;
    if (n < 1e5) return Math.round(n * 1e6);
    return Math.round(n);
  }

  function pidFromBand(band, pidCell) {
    var wantPid = String(pidCell || "").trim();
    var wantBand = String(band || "").trim();
    var list = profiles();
    var i;
    if (wantPid) {
      for (i = 0; i < list.length; i++) {
        if (list[i].id === wantPid || list[i].label === wantPid) return list[i].id;
      }
      return wantPid;
    }
    if (wantBand) {
      for (i = 0; i < list.length; i++) {
        if (list[i].id === wantBand || list[i].label === wantBand) return list[i].id;
      }
      return wantBand;
    }
    return "imported";
  }

  function normalizeHit(h) {
    if (!h || typeof h !== "object") return null;
    var freq = Number(h.freq || h.frequency || 0);
    if (!isFinite(freq) || freq <= 0) return null;
    if (freq < 1e5) freq = Math.round(freq * 1e6);
    else freq = Math.round(freq);
    var pid = String(h.pid || "").trim() || "imported";
    var seen = Math.max(1, Math.round(Number(h.seen) || 1));
    var last = h.last;
    if (typeof last === "string" && last) {
      var t = Date.parse(last);
      last = isFinite(t) ? t : Date.now();
    }
    if (!last) last = Date.now();
    var first = h.first;
    if (typeof first === "string" && first) {
      var t2 = Date.parse(first);
      first = isFinite(t2) ? t2 : last;
    }
    if (!first) first = last;
    var maxDb = Number(h.maxDb != null ? h.maxDb : (h.db != null ? h.db : h.lastDb));
    if (!isFinite(maxDb)) maxDb = 0;
    var spurWhy = String(h.spurWhy || "");
    var spur = !!(h.spur || h.ignored);
    if (h.birdie && String(h.birdie) !== "no") {
      spur = true;
      if (!spurWhy) spurWhy = String(h.birdie) === "yes" ? "birdie" : String(h.birdie);
    }
    var isNew = h.isNew === true || h.isNew === "yes" || h.isNew === "true";
    return {
      freq: freq,
      raw: Number(h.raw) || freq,
      seen: seen,
      looks: Math.max(Number(h.looks) || 0, seen),
      maxDb: maxDb,
      lastDb: Number(h.lastDb) || maxDb,
      pid: pid,
      label: String(h.label || pid),
      first: first,
      last: last,
      mode: h.mode || guessMode(pid),
      samples: Array.isArray(h.samples) ? h.samples.slice(-48) : [],
      width: Number(h.width) || 1,
      offset: h.offset != null && h.offset !== "" ? Number(h.offset) : undefined,
      spur: spur,
      spurWhy: spurWhy,
      ignored: !!h.ignored,
      dongle: !!h.dongle,
      name: h.name != null ? String(h.name) : "",
      isNew: isNew
    };
  }

  function hitFromBookmarkRow(b) {
    if (!b || typeof b !== "object") return null;
    var freq = Number(b.frequency || b.freq || 0);
    if (!isFinite(freq) || freq <= 0) return null;
    var desc = String(b.description || "");
    var m = desc.match(/seen\s+(\d+)/i);
    var seen = Number(b.seen);
    if (!isFinite(seen) || seen < 1) seen = m ? Number(m[1]) : 1;
    return normalizeHit({
      freq: freq,
      seen: seen,
      looks: b.looks || seen,
      maxDb: b.maxDb,
      lastDb: b.lastDb,
      pid: b.pid || "",
      label: b.label || b.pid || "imported",
      mode: b.modulation || b.mode,
      name: String(b.name || "").replace(/^\[auto\]\s*/i, ""),
      isNew: b.isNew || /\(new\)/i.test(desc),
      last: b.last,
      first: b.first,
      spur: b.spur,
      spurWhy: b.spurWhy,
      ignored: b.ignored
    });
  }

  function parseImportCsv(text) {
    text = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    if (!text) throw new Error("File is empty");
    var lines = text.split("\n").filter(function (l) { return l.trim(); });
    if (!lines.length) throw new Error("No rows");
    var delim = (lines[0].indexOf("\t") >= 0 && lines[0].split("\t").length >= 3) ? "\t" : ",";
    var header = delim === "\t" ? lines[0].split("\t") : parseCsvLine(lines[0]);
    var keys = header.map(function (k) { return String(k || "").trim().toLowerCase(); });
    function col() {
      var names = arguments;
      var i, j;
      for (i = 0; i < names.length; i++) {
        j = keys.indexOf(names[i]);
        if (j >= 0) return j;
      }
      return -1;
    }
    var iSeen = col("seen", "n", "count");
    var iMhz = col("mhz", "frequency", "freq", "hz");
    var iDb = col("db", "maxdb", "dB".toLowerCase());
    var iBand = col("band", "label", "profile");
    var iName = col("name");
    var iNew = col("new", "isnew");
    var iBird = col("birdie", "spur");
    var iLast = col("last", "lastseen");
    var iPid = col("pid");
    var iLooks = col("looks");
    var iMode = col("mode", "modulation");
    if (iMhz < 0 && iSeen < 0) throw new Error("CSV needs a header with MHz (and usually seen)");
    if (iMhz < 0) throw new Error("CSV has no MHz / frequency column");
    var out = [];
    for (var r = 1; r < lines.length; r++) {
      var cells = delim === "\t" ? lines[r].split("\t") : parseCsvLine(lines[r]);
      var freq = hzFromCell(cells[iMhz]);
      if (!freq) continue;
      var band = iBand >= 0 ? cells[iBand] : "";
      var pidCell = iPid >= 0 ? cells[iPid] : "";
      var pid = pidFromBand(band, pidCell);
      var hit = normalizeHit({
        freq: freq,
        seen: iSeen >= 0 ? cells[iSeen] : 1,
        maxDb: iDb >= 0 ? cells[iDb] : 0,
        pid: pid,
        label: band || pid,
        name: iName >= 0 ? cells[iName] : "",
        isNew: iNew >= 0 ? cells[iNew] : "",
        birdie: iBird >= 0 ? cells[iBird] : "",
        last: iLast >= 0 ? cells[iLast] : "",
        looks: iLooks >= 0 ? cells[iLooks] : "",
        mode: iMode >= 0 ? cells[iMode] : ""
      });
      if (hit) out.push(hit);
    }
    if (!out.length) throw new Error("No peak rows found in that CSV");
    return { hits: out, tileLooks: {} };
  }

  function parseImportJson(text) {
    var o;
    try {
      o = JSON.parse(text);
    } catch (e) {
      throw new Error("Not valid JSON");
    }
    var isBackup = o && Array.isArray(o.bookmarks) && o.when && (o.reason || o.when) &&
      !Array.isArray(o.hits) && o.kind !== "owrx-band-survey";
    if (isBackup) {
      throw new Error("This is a blue-bookmark backup. Restore it from Help, not Import");
    }
    if (o && Array.isArray(o.hits)) {
      var fromHits = o.hits.map(normalizeHit).filter(Boolean);
      if (!fromHits.length) throw new Error("JSON hits array had no usable peaks");
      return { hits: fromHits, tileLooks: (o.tileLooks && typeof o.tileLooks === "object") ? o.tileLooks : {} };
    }
    if (Array.isArray(o)) {
      if (!o.length) throw new Error("JSON array is empty");
      var mapped;
      if (o[0] && (o[0].freq || o[0].seen != null) && o[0].frequency == null) {
        mapped = o.map(normalizeHit).filter(Boolean);
      } else {
        mapped = o.map(hitFromBookmarkRow).filter(Boolean);
      }
      if (!mapped.length) throw new Error("JSON array had no frequencies");
      return { hits: mapped, tileLooks: {} };
    }
    if (o && Array.isArray(o.bookmarks)) {
      var fromBm = o.bookmarks.map(hitFromBookmarkRow).filter(Boolean);
      if (!fromBm.length) throw new Error("JSON bookmarks array had no frequencies");
      return { hits: fromBm, tileLooks: (o.tileLooks && typeof o.tileLooks === "object") ? o.tileLooks : {} };
    }
    throw new Error("JSON is not a Band survey export (need hits, bookmarks, or a bookmark array)");
  }

  function mergeImportedHits(incoming) {
    incoming.forEach(function (h) {
      var exist = findHit(h.freq, h.pid);
      if (!exist) {
        hits.push(h);
        return;
      }
      exist.seen = Math.max(exist.seen || 0, h.seen || 0);
      exist.looks = Math.max(exist.looks || 0, h.looks || 0);
      exist.maxDb = Math.max(exist.maxDb || -999, h.maxDb || -999);
      if (h.name && !exist.name) exist.name = h.name;
      if (h.last && (!exist.last || h.last > exist.last)) exist.last = h.last;
      if (h.mode && !exist.mode) exist.mode = h.mode;
    });
  }

  function applyImportedPeaks(parsed, source) {
    var incoming = parsed.hits || [];
    if (!incoming.length) throw new Error("Nothing to import");
    if (!window.confirm("Import " + incoming.length + " peaks into Peaks/Seen? Bookmarks are not changed.")) return;
    var replace = true;
    if (hits.length) {
      replace = window.confirm("Replace the current list (" + hits.length + " peaks)? OK = replace. Cancel = merge.");
    }
    if (replace) {
      hits = incoming;
      tileLooks = parsed.tileLooks && typeof parsed.tileLooks === "object" ? parsed.tileLooks : {};
    } else {
      mergeImportedHits(incoming);
      if (parsed.tileLooks) {
        Object.keys(parsed.tileLooks).forEach(function (k) {
          tileLooks[k] = Math.max(tileLooks[k] || 0, parsed.tileLooks[k] || 0);
        });
      }
    }
    classifyAll();
    saveHits();
    renderHits();
    setStatus("Imported " + incoming.length + " peaks from " + (source || "file") +
      (replace ? " (replaced list)" : " (merged)") + ".");
  }

  function importError(err, action) {
    var msg = (err && err.message) ? err.message : String(err || "unknown error");
    msg = msg.replace(/\s+/g, " ").slice(0, 180);
    setStatus(action + " failed: " + msg);
    toast(action + " failed: " + msg);
  }

  function runImportText(kind, text, source) {
    try {
      var parsed = kind === "csv" ? parseImportCsv(text) : parseImportJson(text);
      applyImportedPeaks(parsed, source);
    } catch (err) {
      importError(err, kind === "csv" ? "Import CSV" : "Import JSON");
    }
  }

  function startImport(kind, ev) {
    if (ev && ev.shiftKey) {
      var pasted = window.prompt(kind === "csv" ? "Paste Export CSV:" : "Paste Export JSON:");
      if (pasted == null) return;
      if (!String(pasted).trim()) {
        setStatus("Nothing pasted.");
        return;
      }
      runImportText(kind, pasted, "paste");
      return;
    }
    var inp = $(kind === "csv" ? "bs-csv-file" : "bs-json-file");
    if (!inp) return;
    inp.value = "";
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        runImportText(kind, String(reader.result || ""), f.name);
      };
      reader.onerror = function () {
        importError(new Error("Could not read that file"), kind === "csv" ? "Import CSV" : "Import JSON");
      };
      reader.readAsText(f);
    };
    inp.click();
  }

  function jumpLoudest() {
    try {
    hookWaterfall();
    var sel = $("openwebrx-sdr-profiles-listbox");
    var pid = "";
    if (sel && sel.value) {
      pid = sel.value.indexOf("|") >= 0 ? sel.value.split("|").slice(1).join("|") : sel.value;
    }
    var peaks = findPeaks(pid);
    if (!peaks.length) {
      var blocked = blockingIssue();
      setStatus(blocked
        ? blocked.title + " — " + blocked.fix
        : "No peak on this tile right now. Wait a few seconds after the radio connects, or check the SDR is started.");
      renderHealth();
      return;
    }
    peaks.sort(function (a, b) { return b.db - a.db; });
    var p = peaks[0];
    if (!window.UI || typeof UI.setFrequency !== "function") {
      setStatus("Tune API is missing (UI.setFrequency). Update OpenWebRX+ or open the full receiver UI.");
      renderHealth();
      return;
    }
    UI.setFrequency(p.freq);
    if (window.UI && typeof UI.setModulation === "function") {
      try { UI.setModulation(guessMode(pid), ""); } catch (e) {}
    }
    setStatus("Jumped to " + (icao833(p.freq) || fmtMhz(p.freq)) + " (" + Math.round(p.db) + " dB) — this tile only.");
    } catch (err) {
      setStatus(friendlyError(err, "Jump loudest"));
      toast(friendlyError(err, "Jump loudest"));
      renderHealth();
    }
  }

  function readForm() {
    S.hideAuto = $("bs-hideauto") ? $("bs-hideauto").checked : S.hideAuto;
    S.autoBm = $("bs-autobm") ? $("bs-autobm").checked : S.autoBm;
    S.mute = $("bs-mute") ? $("bs-mute").checked : S.mute;
    S.hideSpurs = $("bs-hidespurs") ? $("bs-hidespurs").checked : S.hideSpurs;
    S.scanAfter = $("bs-scanafter") ? $("bs-scanafter").checked : S.scanAfter;
    S.holdBusy = $("bs-holdbusy") ? $("bs-holdbusy").checked : S.holdBusy;
    S.recordBusy = $("bs-record") ? $("bs-record").checked : S.recordBusy;
    S.notifyNew = $("bs-notify") ? $("bs-notify").checked : S.notifyNew;
    S.aloneOnly = $("bs-alone") ? $("bs-alone").checked : S.aloneOnly;
    S.ownRadio = ownerOverrideAllowed() && $("bs-ownradio") ? $("bs-ownradio").checked : false;
    if ($("bs-listensec")) S.listenSec = Math.max(1, Math.min(20, Number($("bs-listensec").value) || 4));
    if ($("bs-priority")) S.priority = $("bs-priority").value || "";
    if ($("bs-lockmin")) S.lockoutMin = Math.max(1, Math.min(240, Number($("bs-lockmin").value) || 30));
    if ($("bs-sched")) S.scheduleHrs = Math.max(0, Math.min(24, Number($("bs-sched").value) || 0));
    saveSettings();
    applySchedule();
    refreshBookmarks();
    renderHits();
  }

  function startListenScan() {
    if (running) return;
    S.listenSec = $("bs-listensec") ? Math.max(1, Math.min(20, Number($("bs-listensec").value) || 4)) : S.listenSec;
    saveSettings();
    var list = scanTargetItems();
    if (!list.length) {
      setStatus("No bookmarks or qualified peaks to scan.");
      return;
    }
    stopFlag = false;
    running = true;
    var btn = $("bs-toggle-btn");
    if (btn) btn.classList.add("bs-running");
    listenBookmarks(list).then(function () {
      running = false;
      if (btn) btn.classList.remove("bs-running");
      renderHits();
    }).catch(function (err) {
      running = false;
      if (btn) btn.classList.remove("bs-running");
      setStatus(friendlyError(err, "Listen"));
    });
  }

  function makePanel() {
    if ($("bs-panel")) return;
    var panel = document.createElement("div");
    panel.id = "bs-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="bs-head" id="bs-drag" title="Drag to move the panel."><b>Band survey</b>' +
      '<button type="button" id="bs-help-btn" title="Help and install guide.">Help</button>' +
      '<button type="button" class="bs-x" id="bs-close" title="Close the survey panel. Settings and bookmarks stay in this browser.">×</button></div>' +
      '<div class="bs-split" id="bs-split">' +
      '<div class="bs-left" id="bs-left">' +
      '<div class="bs-left-stack" id="bs-left-stack">' +
      '<div class="bs-left-top" id="bs-left-top">' +
      '<div class="bs-left-controls" id="bs-left-controls">' +
      '<div id="bs-health" class="bs-health" hidden></div>' +
      '<p class="bs-note">Tick bands, then Scan bands (add to Seen) or Fresh scan (start over). Hover a control for a tip. Blue bookmarks are on the right.</p>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-primary" id="bs-start" title="Walk ticked bands and add to Seen counts.">Scan bands</button>' +
      '<button type="button" id="bs-fresh" title="Clear peak list and scan from scratch.">Fresh scan</button>' +
      '<button type="button" class="bs-stop" id="bs-stop" title="Stop the survey or bookmark scan right now.">Stop</button>' +
      '<button type="button" class="bs-scan-top" id="bs-listen-top" title="Hop through new auto bookmarks, or qualified peaks if none are new.">Scan bookmarks</button>' +
      '<button type="button" id="bs-jump" title="Retune to the strongest peak on this waterfall tile only.">Jump loudest</button>' +
      '<button type="button" id="bs-check" title="Check that this page can run Band survey and show any fix on screen.">Check install</button>' +
      '<span class="bs-count" id="bs-selcount"></span>' +
      "</div>" +
      '<div class="bs-row">' +
      '<button type="button" id="bs-hold" title="Stay on this frequency until you click Hold again or Skip.">Hold</button>' +
      '<button type="button" id="bs-skip" title="Leave this frequency and go to the next bookmark.">Skip</button>' +
      '<button type="button" id="bs-lockout" title="Skip this frequency for Lockout minutes (saved in this browser).">Lockout</button>' +
      '<button type="button" id="bs-alwaysskip" title="Skip this MHz forever and continue the scan.">Always skip</button>' +
      '<button type="button" id="bs-contscan" title="Leave this busy channel and keep scanning bookmarks.">Continue scan</button>' +
      '<span class="bs-hint" id="bs-hophint">busy waits · Always skip = never again · same-band ~1s · other band 11s unless Own radio is on</span>' +
      "</div>" +
      '<div class="bs-status" id="bs-status"></div>' +
      '<div class="bs-progress"><i id="bs-bar"></i></div>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-tiny" data-preset="air" title="Add airband profiles (air_1–air_7). Does not untick others — use None to clear first.">Air</button>' +
      '<button type="button" class="bs-tiny" data-preset="vhf" title="Add air, marine, 2m, and PMR voice profiles. Does not untick others.">VHF voice</button>' +
      '<button type="button" class="bs-tiny" data-preset="allvhf" title="Add every local profile 30–300 MHz. Combine with All UHF. Does not untick others.">All VHF</button>' +
      '<button type="button" class="bs-tiny" data-preset="alluhf" title="Add every local profile 300–1000 MHz. Combine with All VHF. Does not untick others.">All UHF</button>' +
      '<button type="button" class="bs-tiny" data-preset="ham" title="Add HF/VHF/UHF ham band profiles. Does not untick others.">Ham</button>' +
      '<button type="button" class="bs-tiny" data-preset="all" title="Tick every band profile.">All</button>' +
      '<button type="button" class="bs-tiny" data-preset="none" title="Untick every band.">None</button>' +
      '<input type="search" id="bs-filter" placeholder="Filter bands" style="flex:1;min-width:120px" title="Type to hide band names that do not match.">' +
      "</div></div>" +
      '<div class="bs-bands-wrap" id="bs-bands-wrap">' +
      '<div class="bs-bands" id="bs-bands"></div>' +
      "</div>" +
      '<div class="bs-settings" id="bs-settings">' +
      '<div class="bs-row">' +
      "<label title=\"How many times to walk the ticked bands in one run.\">Passes <input type=\"number\" id=\"bs-passes\" min=\"1\" max=\"20\" step=\"1\" style=\"width:3.4em\" title=\"How many times to walk the ticked bands in one run.\"></label>" +
      "<label title=\"Seconds to sit on each band while counting peaks.\">Dwell s <input type=\"number\" id=\"bs-dwell\" min=\"0.8\" max=\"15\" step=\"0.1\" style=\"width:4em\" title=\"Seconds to sit on each band while counting peaks.\"></label>" +
      "<label title=\"Peaks below this Seen count are not auto-bookmarked or Scan-bookmarks qualified.\">Min seen <input type=\"number\" id=\"bs-minhits\" min=\"1\" max=\"50\" step=\"1\" style=\"width:3.4em\" title=\"Peaks below this Seen count are not auto-bookmarked or Scan-bookmarks qualified.\"></label>" +
      "<label title=\"How far above the noise floor a peak must be to count.\">dB over noise <input type=\"number\" id=\"bs-thresh\" min=\"4\" max=\"25\" step=\"1\" style=\"width:3.4em\" title=\"How far above the noise floor a peak must be to count.\"></label>" +
      "<label title=\"Fixed listen, or quiet-before-move when Hold while busy is on.\">Listen s <input type=\"number\" id=\"bs-listensec\" min=\"1\" max=\"20\" step=\"0.5\" style=\"width:3.6em\" title=\"Fixed listen, or quiet-before-move when Hold while busy is on.\"></label>" +
      "</div>" +
      '<div class="bs-row">' +
      '<label class="bs-chk" title="Save busy peaks as blue [auto] bookmarks in this browser."><input type="checkbox" id="bs-autobm"> Auto-bookmark actives</label>' +
      '<label class="bs-chk" title="After a survey, hop through the new auto bookmarks."><input type="checkbox" id="bs-scanafter"> Scan new bookmarks when done</label>' +
      '<label class="bs-chk" title="Hide [auto] bookmarks from the OpenWebRX bookmark bar (they still show on the right)."><input type="checkbox" id="bs-hideauto"> Hide auto bookmarks</label>' +
      '<label class="bs-chk" title="Mute receiver audio while the survey is walking bands."><input type="checkbox" id="bs-mute"> Mute while running</label>' +
      '<label class="bs-chk" title="Hide always-skipped / birdie rows from the list."><input type="checkbox" id="bs-hidespurs"> Hide birdies</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label class="bs-chk" title="Stay on a live signal until it goes quiet, then move on."><input type="checkbox" id="bs-holdbusy"> Hold while busy</label>' +
      '<label class="bs-chk" title="Record demod audio only while Scan bookmarks is parked on a busy or held channel (bookmark-scan pause). Does not record the survey walk or quiet hops. Clips appear under Audio clips on the right."><input type="checkbox" id="bs-record"> Record busy</label>' +
      '<label class="bs-chk" title="Browser notification when a new (unseen) peak is counted."><input type="checkbox" id="bs-notify"> Notify new</label>' +
      '<label class="bs-chk" title="Don\'t retune if other listeners are connected."><input type="checkbox" id="bs-alone"> Only if alone</label>' +
      '<label class="bs-chk" title="Skip the 11s wait between bands. Only on a receiver you run. Public sites can lock this off."><input type="checkbox" id="bs-ownradio"> Own radio — fast hops</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="MHz or Hz, comma-separated. Guard / tower / ATIS bookmarks are added automatically.">Priority <input type="text" id="bs-priority" placeholder="121.5" style="width:8em" title="MHz or Hz, comma-separated. Guard / tower / ATIS bookmarks are added automatically."></label>' +
      '<label title="Minutes a Lockout button skip lasts for that frequency.">Lockout min <input type="number" id="bs-lockmin" min="1" max="240" step="1" style="width:3.6em" title="Minutes a Lockout button skip lasts for that frequency."></label>' +
      '<label title="0 = off. Runs Scan bands while this tab stays open.">Every N hours <input type="number" id="bs-sched" min="0" max="24" step="0.25" style="width:3.8em" title="0 = off. Runs Scan bands while this tab stays open."></label>' +
      "</div>" +
      "</div></div>" +
      '<div class="bs-splitter bs-splitter-h" id="bs-left-splitter" title="Drag to resize controls vs peaks table." role="separator" aria-orientation="horizontal"></div>' +
      '<div class="bs-left-bottom" id="bs-left-bottom">' +
      "<div><b>Peaks</b> · most active first · new since last run · click MHz to tune · click Name to rename · ign = always skip (click again to undo) " +
      '<button type="button" class="bs-tiny" id="bs-clearskip" hidden title="Forget all always-skip frequencies (bookmarks stay).">Clear always-skip</button></div>' +
      '<div id="bs-hitwrap"></div>' +
      '<div class="bs-row" style="margin-top:8px">' +
      '<button type="button" id="bs-bmqual" title="Save every peak with Seen at or above Min seen as a blue bookmark.">Bookmark qualified</button>' +
      '<button type="button" id="bs-listen" title="Hop through new auto bookmarks, or qualified peaks if none are new.">Scan bookmarks</button>' +
      '<button type="button" id="bs-copy" title="Copy the peak table as text.">Copy list</button>' +
      '<button type="button" id="bs-csv" title="Download the peak list as a CSV file.">Export CSV</button>' +
      '<button type="button" id="bs-json" title="Download qualified peaks as JSON (for merging yellow server bookmarks).">Export JSON</button>' +
      '<button type="button" id="bs-csv-in" title="Restore Peaks/Seen from a previous Export CSV. Shift-click to paste.">Import CSV</button>' +
      '<button type="button" id="bs-json-in" title="Restore Peaks/Seen from a previous Export JSON. Shift-click to paste.">Import JSON</button>' +
      '<button type="button" id="bs-aud-save" title="Download every clip in Audio clips (busy-channel recordings and files you loaded). Does not record the survey walk.">Save audio</button>' +
      '<button type="button" id="bs-aud-load" title="Pick audio files from disk to play in the panel. Nothing is uploaded.">Load audio</button>' +
      '<button type="button" id="bs-bm-save" title="Download local blue bookmarks and [load] imports as one JSON file. Load bookmarks can re-import it.">Save bookmarks</button>' +
      '<button type="button" id="bs-bm-load" title="Import bookmark frequencies from JSON or CSV into a separate [load] list on the right. Scan bookmarks includes them. Does not overwrite blue [auto] bookmarks unless the file is a Save bookmarks export.">Load bookmarks</button>' +
      '<button type="button" id="bs-bm-clearload" title="Remove all [load] bookmarks from this browser. Local blue bookmarks stay.">Clear loaded</button>' +
      '<button type="button" id="bs-bm-clearlocal" title="Remove all local blue bookmarks from this browser. [load] imports and always-skip are not touched.">Clear bookmarks</button>' +
      '<input type="file" id="bs-csv-file" accept=".csv,.txt,text/csv,text/plain" hidden>' +
      '<input type="file" id="bs-json-file" accept=".json,.txt,application/json,text/plain" hidden>' +
      '<input type="file" id="bs-aud-file" accept="audio/*,.webm,.ogg,.mp3,.wav,.m4a,.opus" multiple hidden>' +
      '<input type="file" id="bs-bm-file" accept=".json,.csv,.txt,application/json,text/csv" hidden>' +
      '<button type="button" id="bs-clearauto" title="Remove [auto] blue bookmarks from this browser. Named ones stay.">Clear auto bookmarks</button>' +
      '<button type="button" id="bs-clearhits" title="Clear the Peaks table in this browser. Bookmarks are not deleted.">Clear list</button>' +
      "</div>" +
      "</div></div></div>" +
      '<div class="bs-splitter" id="bs-splitter" title="Drag to resize the bookmarks pane." role="separator" aria-orientation="vertical"></div>' +
      '<div class="bs-right" id="bs-right">' +
      '<div class="bs-right-head"><b>Bookmarks</b><span class="bs-count" id="bs-bmcount"></span></div>' +
      '<p class="bs-right-sub">Local = blue [auto] · Loaded = [load] import · click to tune</p>' +
      '<div class="bs-right-stack" id="bs-right-stack">' +
      '<div class="bs-right-seg bs-bm-seg" id="bs-bm-seg">' +
      '<div class="bs-bm-scroll" id="bs-bmlist"></div>' +
      "</div>" +
      '<div class="bs-splitter bs-splitter-h" id="bs-right-split1" data-split="r1" title="Drag to resize local bookmarks vs loaded." role="separator" aria-orientation="horizontal"></div>' +
      '<div class="bs-right-seg bs-loaded-seg" id="bs-loaded-seg">' +
      '<div class="bs-loaded-block">' +
      '<div class="bs-loaded-scroll" id="bs-loadedlist"></div>' +
      "</div></div>" +
      '<div class="bs-splitter bs-splitter-h" id="bs-right-split2" data-split="r2" title="Drag to resize loaded vs audio clips." role="separator" aria-orientation="horizontal"></div>' +
      '<div class="bs-right-seg bs-audio-seg" id="bs-audio-seg">' +
      '<div class="bs-audio-block">' +
      '<b id="bs-audiohead">Audio clips</b>' +
      '<p class="bs-right-sub">busy / held channels only · this session · Save / Load below Peaks</p>' +
      '<div class="bs-audiolist" id="bs-audiolist"></div>' +
      "</div></div>" +
      '<div class="bs-splitter bs-splitter-h" id="bs-right-split3" data-split="r3" title="Drag to resize audio clips vs always skip." role="separator" aria-orientation="horizontal"></div>' +
      '<div class="bs-right-seg bs-skip-seg" id="bs-skip-seg">' +
      '<div class="bs-skip-block">' +
      '<b id="bs-skiphead">Always skip</b>' +
      '<div class="bs-skiplist" id="bs-skiplist"></div>' +
      "</div></div></div></div></div>" +
      '<div class="bs-resize-e" data-resize="e" title="Drag to make the panel wider or narrower."></div>' +
      '<div class="bs-resize-s" data-resize="s" title="Drag to make the panel taller or shorter."></div>' +
      '<div class="bs-resize-se" data-resize="se" title="Drag to resize the panel."></div>';
    document.body.appendChild(panel);

    $("bs-passes").value = S.passes;
    $("bs-dwell").value = S.dwell;
    $("bs-minhits").value = S.minHits;
    $("bs-thresh").value = S.threshDb;
    $("bs-autobm").checked = !!S.autoBm;
    $("bs-scanafter").checked = !!S.scanAfter;
    $("bs-listensec").value = S.listenSec || 4;
    $("bs-hideauto").checked = !!S.hideAuto;
    $("bs-mute").checked = !!S.mute;
    $("bs-hidespurs").checked = S.hideSpurs !== false;
    $("bs-holdbusy").checked = S.holdBusy !== false;
    $("bs-record").checked = !!S.recordBusy;
    $("bs-notify").checked = S.notifyNew !== false;
    $("bs-alone").checked = S.aloneOnly !== false;
    $("bs-ownradio").checked = ownerOverrideAllowed() && !!S.ownRadio;
    applyOwnerLock();
    $("bs-priority").value = S.priority || "121.5";
    $("bs-lockmin").value = S.lockoutMin || 30;
    $("bs-sched").value = S.scheduleHrs || 0;
    fillBands();
    applyCaps();
    loadedBookmarks = loadLoadedBookmarks();
    loadHits();
    classifyAll();
    bindPanelLayout(panel);
    renderHits();
    var right = $("bs-right");
    if (right) right.onclick = onBookmarkPaneClick;

    $("bs-close").onclick = function () { panel.hidden = true; };
    $("bs-help-btn").onclick = openHelp;
    $("bs-check").onclick = function () {
      var issues = renderHealth({ all: true, toast: true, ok: true });
      var hard = issues.filter(function (x) { return x.level === "error"; }).length;
      var warns = issues.filter(function (x) { return x.level === "warn"; }).length;
      var extras = issues.filter(function (x) { return x.level === "info"; }).length;
      if (!hard && !warns) {
        setStatus("Install looks good. Orange SV is this plugin. Optional extras are listed only so you know they are not required.");
      } else {
        setStatus((hard ? hard + " problem" + (hard === 1 ? "" : "s") + " to fix. " : "No blockers. ") +
          (warns ? warns + " note" + (warns === 1 ? "" : "s") + ". " : "") +
          (extras ? extras + " optional extra" + (extras === 1 ? "" : "s") + ". " : "") +
          "Read the box above, or open Help.");
      }
    };
    $("bs-start").onclick = function () {
      if (listenPaused) {
        resumeListenScan();
        return;
      }
      runSurvey(false);
    };
    $("bs-fresh").onclick = function () { runSurvey(true); };
    $("bs-stop").onclick = stopSurvey;
    $("bs-jump").onclick = function () { jumpLoudest(); };
    $("bs-hold").onclick = function () {
      listenCmd = listenCmd === "hold" ? "" : "hold";
      $("bs-hold").classList.toggle("bs-on", listenCmd === "hold");
      setStatus(listenCmd === "hold" ? "Holding this frequency." : "Hold released.");
    };
    $("bs-skip").onclick = function () { listenCmd = "skip"; };
    $("bs-lockout").onclick = function () { listenCmd = "lock"; };
    $("bs-alwaysskip").onclick = function () { alwaysSkipAndContinue(); };
    $("bs-contscan").onclick = resumeListenScan;
    if ($("bs-clearskip")) $("bs-clearskip").onclick = clearAlwaysSkips;
    $("bs-filter").oninput = filterBands;
    $("bs-autobm").onchange = readForm;
    $("bs-scanafter").onchange = readForm;
    $("bs-hideauto").onchange = readForm;
    $("bs-mute").onchange = readForm;
    $("bs-hidespurs").onchange = readForm;
    $("bs-holdbusy").onchange = readForm;
    $("bs-record").onchange = readForm;
    $("bs-notify").onchange = function () { readForm(); askNotifyPerm(); };
    $("bs-alone").onchange = readForm;
    $("bs-ownradio").onchange = readForm;
    $("bs-priority").onchange = readForm;
    $("bs-lockmin").onchange = readForm;
    $("bs-sched").onchange = readForm;
    $("bs-bands").onchange = function () {
      S.selected = selectedValues();
      saveSettings();
      updateCount();
    };
    panel.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.onclick = function () { applyPreset(btn.getAttribute("data-preset")); };
    });
    $("bs-bmqual").onclick = function () {
      var created = autoBookmarkQualified();
      var n = created.filter(function (r) { return !r.already; }).length;
      setStatus("Bookmarked " + n + " new (seen ≥ " + S.minHits + "). Click a name to rename.");
      renderHits();
      if (S.scanAfter && lastCreated.length && !running) {
        stopFlag = false;
        running = true;
        var btn2 = $("bs-toggle-btn");
        if (btn2) btn2.classList.add("bs-running");
      listenBookmarks(lastCreated).then(function () {
          running = false;
          if (btn2) btn2.classList.remove("bs-running");
        }).catch(function (err) {
          running = false;
          if (btn2) btn2.classList.remove("bs-running");
          setStatus(friendlyError(err, "Listen"));
        });
      }
    };
    $("bs-listen-top").onclick = startListenScan;
    $("bs-listen").onclick = startListenScan;
    $("bs-copy").onclick = copyResults;
    $("bs-csv").onclick = function () { exportCsv(); };
    $("bs-json").onclick = function () { exportServerJson(); };
    $("bs-csv-in").onclick = function (ev) { startImport("csv", ev); };
    $("bs-json-in").onclick = function (ev) { startImport("json", ev); };
    if ($("bs-aud-save")) $("bs-aud-save").onclick = saveAllAudioClips;
    if ($("bs-aud-load")) $("bs-aud-load").onclick = function () {
      var inp = $("bs-aud-file");
      if (inp) inp.click();
    };
    if ($("bs-aud-file")) $("bs-aud-file").onchange = function () {
      loadAudioFiles(this.files);
      this.value = "";
    };
    if ($("bs-audiolist")) $("bs-audiolist").onclick = onAudioPaneClick;
    if ($("bs-bm-save")) $("bs-bm-save").onclick = saveBookmarks;
    if ($("bs-bm-load")) $("bs-bm-load").onclick = startLoadBookmarks;
    if ($("bs-bm-clearload")) $("bs-bm-clearload").onclick = clearLoadedBookmarks;
    if ($("bs-bm-clearlocal")) $("bs-bm-clearlocal").onclick = clearLocalBookmarks;
    if ($("bs-bm-file")) $("bs-bm-file").onchange = onLoadBookmarkFile;
    $("bs-clearauto").onclick = function () {
      var n = clearAutoBookmarks();
      setStatus("Removed " + n + " auto bookmarks.");
      renderHits();
    };
    $("bs-clearhits").onclick = function () {
      hits = [];
      tileLooks = {};
      saveHits();
      renderHits();
      setStatus("List cleared.");
    };
    $("bs-hitwrap").onclick = function (ev) {
      var t = ev.target;
      if (!t) return;
      if (t.getAttribute("data-sort")) {
        sortKey = t.getAttribute("data-sort");
        renderHits();
        return;
      }
      if (t.getAttribute("data-rename")) {
        askRename(Number(t.getAttribute("data-rename")));
        return;
      }
      if (t.getAttribute("data-tune")) {
        tuneTo(Number(t.getAttribute("data-tune")), t.getAttribute("data-pid"));
        return;
      }
      if (t.getAttribute("data-ignore")) {
        var ignF = Number(t.getAttribute("data-ignore"));
        if (isIgnoredFreq(ignF)) {
          unignoreFreq(ignF);
          setStatus("Will land on " + fmtMhz(ignF) + " again.");
        } else {
          ignoreFreq(ignF);
          if (continueIfPausedOn(ignF)) {
            setStatus("Always skip " + fmtMhz(ignF) + " — continuing scan.");
          } else {
            setStatus("Always skip " + fmtMhz(ignF) + " (saved in this browser).");
          }
        }
        return;
      }
      if (t.getAttribute("data-bm")) {
        var f = Number(t.getAttribute("data-bm"));
        var hit = hits.filter(function (h) { return h.freq === f; })[0];
        if (hit && addBookmark(hit)) {
          setStatus("Bookmarked " + (hit.name || fmtMhz(f)) + " — click the name to rename.");
          renderHits();
        }
      }
    };

    var drag = $("bs-drag");
    var ox = 0;
    var oy = 0;
    var dragging = false;
    drag.addEventListener("mousedown", function (ev) {
      if (ev.target && (ev.target.id === "bs-close" || ev.target.id === "bs-help-btn")) return;
      dragging = true;
      var r = panel.getBoundingClientRect();
      ox = ev.clientX - r.left;
      oy = ev.clientY - r.top;
      ev.preventDefault();
    });
    document.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      panel.style.left = Math.max(4, ev.clientX - ox) + "px";
      panel.style.top = Math.max(4, ev.clientY - oy) + "px";
      panel.style.right = "auto";
    });
    document.addEventListener("mouseup", function () { dragging = false; });
  }

  function placeToggle(btn, container) {
    var buttons = Array.prototype.slice.call(
      container.querySelectorAll('div[id$="-toggle-btn"], div[id$="-btn"], div[id="openwebrx-clock-utc"]')
    ).filter(function (b) { return b.offsetParent !== null; });
    buttons.sort(function (a, b) {
      if (a.id === "openwebrx-clock-utc") return -1;
      if (b.id === "openwebrx-clock-utc") return 1;
      return a.id.localeCompare(b.id);
    });
    var left = 4;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].id === btn.id) break;
      var rect = buttons[i].getBoundingClientRect();
      if (rect.width > 0) left += rect.width + 4;
    }
    btn.style.left = left + "px";
  }

  function showFallback(msg) {
    var bar = $("bs-fallback");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bs-fallback";
      document.body.appendChild(bar);
    }
    bar.innerHTML = '<button type="button" id="bs-fallback-sv" class="bs-fallback-sv" title="Open the Band survey panel.">SV</button> <span>' +
      escapeHtml(msg) + '</span> <button type="button" id="bs-fallback-help" title="Open the help overlay.">Help</button>';
    var sv = $("bs-fallback-sv");
    if (sv) {
      sv.onclick = function () {
        makePanel();
        var p = $("bs-panel");
        if (!p) return;
        p.hidden = !p.hidden;
        if (!p.hidden) {
          applyPanelLayout();
          fillBands();
          renderBookmarkPane();
          renderHealth({ all: true, toast: true });
        }
      };
    }
    var hb = $("bs-fallback-help");
    if (hb) hb.onclick = openHelp;
    ensureFallbackChip();
  }

  function hideFallback() {
    var bar = $("bs-fallback");
    if (bar) bar.remove();
    var chip = $("bs-fallback-chip");
    if (chip) chip.remove();
  }

  function ensureFallbackChip() {
    if ($("bs-fallback-chip")) return;
    var chip = document.createElement("div");
    chip.id = "bs-fallback-chip";
    chip.textContent = "SV";
    chip.title = "Band survey — receiver toolbar missing. Click to open the panel anyway.";
    chip.onclick = function () {
      makePanel();
      var p = $("bs-panel");
      if (!p) return;
      p.hidden = !p.hidden;
        if (!p.hidden) {
          applyPanelLayout();
          fillBands();
          renderBookmarkPane();
          renderHealth({ all: true, toast: true });
          setStatus("Receiver toolbar not found. Open the SDR receiver page (not a map hub), then hard-refresh.");
        }
    };
    document.body.appendChild(chip);
  }

  function ensureUi() {
    hookWaterfall();
    hookHide();
    makePanel();
    backupLocalBookmarks("first-ui");
    var container = $("openwebrx-panel-receiver");
    if (!container) {
      if (Date.now() - (window._bs_ui_t0 || (window._bs_ui_t0 = Date.now())) > 8000) {
        showFallback("Band survey loaded, but the receiver panel is not on this page. Open the SDR receiver (not the map hub only) and hard-refresh. Click SV or Help.");
      }
      return;
    }
    hideFallback();
    var btn = $("bs-toggle-btn");
    if (!btn) {
      btn = document.createElement("div");
      btn.id = "bs-toggle-btn";
      btn.textContent = "SV";
      btn.title = "Band survey — pick bands, count peaks. Click for the panel; Help is inside.";
      btn.onclick = function () {
        var panel = $("bs-panel");
        if (!panel) return;
        panel.hidden = !panel.hidden;
        if (!panel.hidden) {
          applyPanelLayout();
          fillBands();
          renderBookmarkPane();
          if (S.hideAuto !== $("bs-hideauto").checked) $("bs-hideauto").checked = !!S.hideAuto;
          renderHealth();
          applyCaps();
          if (!profiles().length) {
            setStatus("Waiting for band profiles… if this stays empty, click Check install or Help.");
          }
        }
      };
      container.appendChild(btn);
    }
    placeToggle(btn, container);
    if (S.hideAuto) refreshBookmarks();
    applySchedule();
    if ($("bs-panel") && !$("bs-panel").hidden) {
      setTimeout(function () { renderHealth(); }, 2500);
    }
    if (!S.seenHelp && !window._bs_welcomed) {
      window._bs_welcomed = true;
      var p = $("bs-panel");
      if (p) p.hidden = false;
      fillBands();
      renderHealth();
      setStatus("Welcome. Your blue bookmarks were copied into a browser backup. Click Help for the full guide — this only auto-opens once.");
      openHelp();
    }
  }

  if (Plugins.utils && Plugins.utils.on_ready) {
    Plugins.utils.on_ready(ensureUi);
  }
  setTimeout(ensureUi, 400);
  setTimeout(ensureUi, 1500);
  setTimeout(ensureUi, 4000);
  setInterval(function () {
    var btn = $("bs-toggle-btn");
    var container = $("openwebrx-panel-receiver");
    if (btn && container) placeToggle(btn, container);
  }, 2500);
  return true;
};
