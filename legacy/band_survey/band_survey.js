// Band survey — standalone OpenWebRX+ receiver plugin.
// Does not need freq_scanner, scan_hunt, uikit, or notify.
// Optional: uses notify/freq_scanner if they are already loaded.
//
// Install (preferred): run ./install.sh from this folder — it backs up
// init.js, bookmarks, and any previous copy, then loads the plugin.
// Manual: see README.md. Survey button is in the top bar (between Help and Status).
// Help is always available from the panel (and on first run).
//
// Public shared OpenWebRX: set the next line to false (or run ./install.sh --public)
// so visitors cannot tick "Own radio — fast hops". Personal / own-PC installs leave true.

var BAND_SURVEY_ALLOW_OWNER_OVERRIDE = true;

Plugins.band_survey = {};
Plugins.band_survey._version = 127;
/* Homelab magic_key for continuous center retune (setfrequency). Override if needed. */
Plugins.band_survey.magic_key = Plugins.band_survey.magic_key || "memagic";

Plugins.band_survey.init = function () {
  var LS = "owrx_band_survey_v1";
  var LS_REC_MIGRATE = "owrx_band_survey_rec_migrate_v53";
  var LS_HITS = "owrx_band_survey_hits_v1";
  var SAMPLE_MS = 400;
  var MAX_PASSES = 100;
  var RENDER_HITS_CAP = 400;
  var PEAKS_LOAD_WARN = 800;
  var _panelHeavyTimer = null;
  var _hitsLoaded = false;
  var _hitsLoading = false;
  var _hitsLoadQueue = [];
  var _hitsClassified = false;

  function syncPassesUi(val) {
    val = Math.max(1, Math.min(MAX_PASSES, Number(val) || 2));
    if ($("bs-passes")) $("bs-passes").value = val;
    if ($("bs-range-passes")) $("bs-range-passes").value = val;
    return val;
  }

  function passesFromUi() {
    var el = $("bs-range-passes") || $("bs-passes");
    return syncPassesUi(el && el.value);
  }

  function syncDwellUi(val) {
    val = Math.max(0.8, Math.min(15, Number(val) || 2.5));
    if ($("bs-dwell")) $("bs-dwell").value = val;
    if ($("bs-range-dwell")) $("bs-range-dwell").value = val;
    return val;
  }

  function syncThreshUi(val) {
    val = Math.max(2, Math.min(25, Number(val) || 10));
    if ($("bs-thresh")) $("bs-thresh").value = val;
    if ($("bs-range-thresh")) $("bs-range-thresh").value = val;
    return val;
  }

  function syncMuteUi(checked) {
    var on = !!checked;
    if ($("bs-mute")) $("bs-mute").checked = on;
    if ($("bs-range-mute")) $("bs-range-mute").checked = on;
    return on;
  }

  function syncOwnRadioUi(checked) {
    var on = ownerOverrideAllowed() && !!checked;
    if ($("bs-ownradio")) $("bs-ownradio").checked = on;
    if ($("bs-range-ownradio")) $("bs-range-ownradio").checked = on;
    return on;
  }

  function syncAloneUi(checked) {
    var on = !!checked;
    if ($("bs-band-alone")) $("bs-band-alone").checked = on;
    if ($("bs-range-alone")) $("bs-range-alone").checked = on;
    return on;
  }

  function aloneFromUi() {
    /* Prefer the control on the active surface: Bands form first, then Range. */
    var el = $("bs-band-alone") || $("bs-range-alone");
    return syncAloneUi(el ? el.checked : S.aloneOnly);
  }

  function syncPairChk(idA, idB, on) {
    on = !!on;
    if ($(idA)) $(idA).checked = on;
    if ($(idB)) $(idB).checked = on;
    return on;
  }

  function pairChkFromUi(idA, idB, fallback) {
    var el = $(idA) || $(idB);
    if (!el) return fallback;
    return syncPairChk(idA, idB, el.checked);
  }

  function syncPairNum(idA, idB, val) {
    if ($(idA)) $(idA).value = val;
    if ($(idB)) $(idB).value = val;
    return val;
  }

  function dwellFromUi() {
    var el = $("bs-range-dwell") || $("bs-dwell");
    return syncDwellUi(el && el.value);
  }

  function threshFromUi() {
    var el = $("bs-range-thresh") || $("bs-thresh");
    return syncThreshUi(el && el.value);
  }

  function muteFromUi() {
    var el = $("bs-range-mute") || $("bs-mute");
    return syncMuteUi(el && el.checked);
  }

  function ownRadioFromUi() {
    var el = $("bs-range-ownradio") || $("bs-ownradio");
    return syncOwnRadioUi(el && el.checked);
  }

  function syncMinHitsUi(val) {
    val = Math.max(1, Math.min(50, Number(val) || 3));
    if ($("bs-minhits")) $("bs-minhits").value = val;
    if ($("bs-range-minhits")) $("bs-range-minhits").value = val;
    return val;
  }

  function minHitsFromUi() {
    var el = $("bs-range-minhits") || $("bs-minhits");
    return syncMinHitsUi(el && el.value);
  }

  function syncHideSpursUi(on) {
    on = on !== false;
    if ($("bs-hidespurs")) $("bs-hidespurs").checked = on;
    if ($("bs-range-hidespurs")) $("bs-range-hidespurs").checked = on;
    return on;
  }

  function hideSpursFromUi() {
    var el = $("bs-range-hidespurs") || $("bs-hidespurs");
    return syncHideSpursUi(el ? el.checked : S.hideSpurs !== false);
  }

  function syncWidebandUi(on) {
    on = on !== false;
    if ($("bs-wideband")) $("bs-wideband").checked = on;
    if ($("bs-range-wideband")) $("bs-range-wideband").checked = on;
    return on;
  }

  function widebandFromUi() {
    var el = $("bs-range-wideband") || $("bs-wideband");
    return syncWidebandUi(el ? el.checked : S.widebandPeaks !== false);
  }

  function syncRangeScanOptsUi() {
    syncPassesUi(S.passes);
    syncDwellUi(S.dwell);
    syncThreshUi(S.threshDb);
    syncMinHitsUi(S.minHits);
    syncMuteUi(S.mute);
    syncOwnRadioUi(S.ownRadio);
    syncAloneUi(S.aloneOnly !== false);
    syncWidebandUi(S.widebandPeaks !== false);
    syncHideSpursUi(S.hideSpurs !== false);
  }
  var CENTER_GUARD_HZ = 25000;
  var EDGE_FRAC = 0.06;
  var OFFSET_BUCKET_HZ = 8000;
  var layoutDragging = false;
  var TAB_IDS = ["bands", "range", "explore", "analyzer", "peaks", "bookmarks", "audio", "skip", "settings", "help"];

  /* Optional Extras — off by default; Settings → Extras ticks reveal UI on existing tabs. */
  var EXTRAS_DEFS = [
    { id: "sessionLog", label: "Session log", where: "Bookmarks", tip: "Log bookmark-scan hops (time, MHz, busy, clip). Export CSV." },
    { id: "whatsNew", label: "What’s new filter", where: "Peaks", tip: "Filter the peak table to only new peaks since the last survey." },
    { id: "peakNativeBm", label: "Peak → named bookmark", where: "Peaks", tip: "Extra button to save a peak as a named blue bookmark (not [auto])." },
    { id: "watchlist", label: "Watchlist panel", where: "Bookmarks", tip: "Show alert MHz list on Bookmarks for quick edit while scanning." },
    { id: "clipMeta", label: "Clip duration / voice %", where: "Audio", tip: "Show length and voice activity on each audio clip row." },
    { id: "keyboard", label: "Keyboard shortcuts", where: "Global", tip: "S=Stop, B=Scan bookmarks, H=Hold, K/→=Skip, ←=Previous bookmark when scanning." },
    { id: "surveyDiff", label: "Survey snapshot / diff", where: "Peaks", tip: "Save a peak snapshot and highlight changes vs that snapshot." },
    { id: "freqNotes", label: "Frequency notes", where: "Peaks / Bookmarks", tip: "Per-MHz notes stored in this browser." },
    { id: "spectrumHistory", label: "Range spectrum history", where: "Range", tip: "Keep the last few range charts and flip between them." },
    { id: "recCaps", label: "Max clip length", where: "Audio", tip: "Cap Record busy clips at N seconds (default 60)." },
    { id: "scanOrder", label: "Bookmark scan order", where: "Bookmarks", tip: "Priority / freq / name / random order for Scan bookmarks." },
    { id: "copyTuneLink", label: "Copy tune link", where: "Peaks / Bookmarks", tip: "Copy MHz + mode text for chat or notes." },
    { id: "publicMode", label: "Public / shared receiver mode", where: "Settings", tip: "Force alone-only, disable fast hops and factory reset." },
    { id: "idlePresets", label: "Quiet-hours presets", where: "Settings", tip: "One-click night / evening quiet-hour presets for scheduled scans." },
    { id: "waterfallSnap", label: "Waterfall snapshot", where: "Peaks", tip: "Save a PNG of the waterfall when bookmarking a peak (best-effort)." },
    { id: "speechToText", label: "Clip transcribe (browser)", where: "Audio", tip: "Try Web Speech API while a clip plays (Chrome; quality varies)." },
    { id: "nearbyTraffic", label: "Nearby traffic hint", where: "Peaks", tip: "If aircraft/AIS data is on the page, show a short nearby hint on peak rows." },
    { id: "userBmShortcuts", label: "Load user bookmarks · Current / Ticked", where: "Bookmarks", tip: "Show Current and Ticked shortcut buttons next to Load user bookmarks." },
    { id: "digiSurvey", label: "Digi / FT8 survey", where: "Bands", tip: "Digi preset, longer dwell on digi profiles, optional FT8 mode, occupancy scoring for heatmap." },
    { id: "dayNightBands", label: "HF day / night band sets", where: "Bands", tip: "HF day/night tick chips; optional auto-apply before scheduled scans." },
    { id: "occHeatmap", label: "Band × hour heatmap", where: "Peaks", tip: "Occupancy grid from surveys (band vs local hour). Needs surveys with this extra on." },
    { id: "sendToScanner", label: "Send to OWRX scanner", where: "Bookmarks / Peaks", tip: "Mark qualified/auto bookmarks scannable and start built-in or freq_scanner." },
    { id: "shareReport", label: "Share survey report", where: "Peaks", tip: "Download a PNG summary (top peaks + optional heatmap) for posts or notes." }
  ];
  var LS_FREQ_NOTES = "owrx_band_survey_freq_notes_v1";
  var LS_SESSION_LOG = "owrx_band_survey_session_log_v1";
  var LS_SURVEY_SNAP = "owrx_band_survey_survey_snap_v1";
  var LS_SPEC_HIST = "owrx_band_survey_spec_hist_v1";
  var LS_OCC_HEAT = "owrx_band_survey_occ_heat_v1";
  var occHeatLog = [];

  var S = loadSettings();
  if (!S.extras) S.extras = extrasDefaults();
  loadFreqNotes();
  loadSessionLog();
  loadSurveySnap();
  loadSpectrumHist();
  loadOccHeat();
  var panelLayoutUserSet = Number(S.panelW) > 0;
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
  var listenScanRunning = false;
  var surveyRunning = false;
  var listenFreq = 0;
  var lastProfileSwitchAt = 0;
  var PROFILE_GAP_MS = 11000;
  var PROFILE_GAP_OWN_MS = 1200;
  var HOP_SETTLE_MS = 700;
  var LISTEN_SAMPLE_MS = 250;
  var QUIET_HOLD_MS = 1500;
  var MIN_RECORD_MS = 2000;
  var REC_SIGNAL_QUIET_MS = 800;
  var REC_SIGNAL_DEBOUNCE_MS = 450;
  var MIN_CLIP_ACTIVE_MS = 900;
  var MIN_CLIP_ACTIVE_RATIO = 0.18;
  var REC_MODE_ORIGINAL = "original";
  var REC_MODE_BALANCED = "balanced";
  var REC_MODE_STRICT = "strict";
  var SMETER_TRACK_N = 14;
  var schedTimer = null;
  var LS_LOCK = "owrx_band_survey_lock_v1";
  var LS_SNAP = "owrx_band_survey_snap_v1";
  var LS_BM_FIRST = "owrx_band_survey_bm_backup_v1";
  var LS_BM_LAST = "owrx_band_survey_bm_backup_last_v1";
  var LS_LOADED_BM = "owrx_band_survey_loaded_bm_v1";
  var SS_TAB = "owrx_band_survey_tab_v1";
  var LS_CHECK_DISMISS = "owrx_band_survey_check_dismiss_v1";
  var LS_PANEL_LAYOUT = "owrx_band_survey_panel_layout_v1";
  var LS_EXPLORE = "owrx_band_survey_explore_v1";
  var LS_EXPLORE_MM = "owrx_band_survey_explore_mm_v1";
  var LS_RANGE_SPECTRUM = "owrx_band_survey_range_spectrum_v1";
  var EX_CLICK_MAX_PX = 6;
  var EX_MINIMAP_BINS = 512;
  var EX_OVERVIEW_EMPTY = -999;
  var EX_DEBOUNCE_MS = 180;
  var explore = {
    on: false,
    minimapOn: false,
    dragging: false,
    dragStartX: 0,
    dragStartCenter: 0,
    movedPx: 0,
    pendingCenter: null,
    debounceTimer: null,
    segmentStart: 0,
    segmentEnd: 0,
    minimap: null,
    minimapCtx: null,
    overview: null,
    handlersOn: false
  };
  var bsInternalTune = false;
  var lastManualTuneAt = 0;
  var SCHED_IDLE_MS = 10 * 60 * 1000;
  var loadedBookmarks = [];
  var rangeSpectrum = { startMhz: 0, endMhz: 0, peaks: [] };
  var rangeSpectrumBound = false;
  var RANGE_SPEC = { cssH: 172, padL: 46, padR: 10, padT: 14, padB: 24, bins: 480 };

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
      widebandPeaks: true,
      ignoredFreqs: [],
      scanAfter: false,
      listenSec: 4,
      holdBusy: true,
      continuousBmScan: true,
      recordBusy: false,
      recMode: REC_MODE_ORIGINAL,
      recSquelchOnly: true,
      recMinSnrDb: 0,
      recSquelchHeadroomDb: 0,
      recMinClipRatioPct: 0,
      recDebounceMs: 0,
      recQuietMs: 0,
      notifyNew: true,
      aloneOnly: true,
      lockoutMin: 30,
      scheduleHrs: 0,
      priority: "121.5",
      ownRadio: false,
      seenHelp: false,
      autoOpenPanel: false,
      panelW: 0,
      panelH: 0,
      panelLeft: null,
      panelTop: null,
      splitPct: 62,
      leftSplitPct: 58,
      rightSplit1: 28,
      rightSplit2: 52,
      rightSplit3: 76,
      rangeStartMhz: 109,
      rangeEndMhz: 200,
      rangeStepKhz: 0,
      rangeOffsetKhz: 0,
      rangeChannelGrid: false,
      rangeGridPreset: "auto",
      rangeMode: "full",
      exploreStepKhz: 12.5,
      exploreOffsetKhz: 0,
      rememberTab: true,
      defaultTab: "last",
      switchPeaksOnDone: false,
      notifyScanDone: false,
      soundNewPeak: true,
      schedAction: "band",
      schedIdleOnly: false,
      quietStart: "",
      quietEnd: "",
      pauseOnManualTune: false,
      profileSettleMs: 0,
      maxPeaks: 0,
      keepPeaks: true,
      maxAudioClips: 40,
      clipPreviewSec: 3,
      clipVolume: 80,
      loadUserBmBands: [],
      extras: null,
      maxClipSec: 60,
      listenScanOrder: "priority",
      showNewOnly: false,
      showDiffOnly: false,
      webhookUrl: "",
      copyPeaksOnDone: false,
      alertFreqs: "",
      alertOffsetKhz: 25,
      digiLongDwell: true,
      digiDwellSec: 90,
      digiForceMode: "ft8",
      digiForceOn: false,
      dayNightBeforeSched: false,
      peaksView: "list",
      occDays: 7,
      uiTextSize: "default",
      hideToolbar: false,
      saStartMhz: 88,
      saEndMhz: 108,
      saFollowTile: false,
      saPeakHold: true,
      saAvg: true,
      saAvgN: 6,
      saAutoDb: true,
      saDbMin: -100,
      saDbMax: -20,
      saHopMs: 450,
      saLiveOnOpen: false,
      hiddenTabs: ["analyzer"],
      analyzerTabMigrated: true,
      btnShades: {}
    };
    try {
      var raw = window.localStorage.getItem(LS);
      var hadStored = false;
      if (raw) {
        hadStored = true;
        var o = JSON.parse(raw);
        Object.keys(d).forEach(function (k) {
          if (typeof o[k] !== "undefined") d[k] = o[k];
        });
      }
      if (!window.localStorage.getItem(LS_REC_MIGRATE)) {
        if (!hadStored || !d.recMode || d.recMode === "balanced" || d.recMode === "simple") {
          d.recMode = REC_MODE_ORIGINAL;
        }
        window.localStorage.setItem(LS_REC_MIGRATE, "1");
      } else if (!d.recMode || d.recMode === "simple") {
        d.recMode = REC_MODE_ORIGINAL;
      } else if (d.recMode !== REC_MODE_BALANCED && d.recMode !== REC_MODE_STRICT && d.recMode !== REC_MODE_ORIGINAL) {
        d.recMode = REC_MODE_ORIGINAL;
      }
    } catch (e) {}
    return sanitizeLayoutSettings(d);
  }

  function extrasDefaults() {
    var o = {};
    EXTRAS_DEFS.forEach(function (e) { o[e.id] = false; });
    return o;
  }

  function sanitizeExtras(raw) {
    var d = extrasDefaults();
    if (!raw || typeof raw !== "object") return d;
    EXTRAS_DEFS.forEach(function (e) {
      if (typeof raw[e.id] === "boolean") d[e.id] = raw[e.id];
    });
    return d;
  }

  function extraOn(id) {
    return !!(S.extras && S.extras[id]);
  }

  function setExtrasAll(on, includePublic) {
    if (!S.extras) S.extras = extrasDefaults();
    on = !!on;
    EXTRAS_DEFS.forEach(function (e) {
      if (!includePublic && e.id === "publicMode") {
        if (!on) S.extras[e.id] = false;
      } else {
        S.extras[e.id] = on;
      }
      var el = $("bs-extra-" + e.id);
      if (el) el.checked = !!S.extras[e.id];
    });
    saveSettings();
    applyExtrasUi();
    if (typeof renderHits === "function") renderHits();
    if (typeof renderAudioClips === "function") renderAudioClips();
    setStatus(on
      ? "All extras on (Public / shared mode left off so Factory reset stays available)."
      : "All extras off.");
  }

  function readExtrasFromForm() {
    if (!S.extras) S.extras = extrasDefaults();
    EXTRAS_DEFS.forEach(function (e) {
      var el = $("bs-extra-" + e.id);
      if (el) S.extras[e.id] = !!el.checked;
    });
    if ($("bs-max-clip-sec")) S.maxClipSec = Math.max(5, Math.min(600, Number($("bs-max-clip-sec").value) || 60));
    if ($("bs-listen-order")) S.listenScanOrder = $("bs-listen-order").value || "priority";
    if ($("bs-show-new-only")) S.showNewOnly = !!$("bs-show-new-only").checked;
    if ($("bs-show-diff-only")) S.showDiffOnly = !!$("bs-show-diff-only").checked;
  }

  function fillExtrasForm() {
    if (!S.extras) S.extras = extrasDefaults();
    EXTRAS_DEFS.forEach(function (e) {
      var el = $("bs-extra-" + e.id);
      if (el) el.checked = !!S.extras[e.id];
    });
    if ($("bs-max-clip-sec")) $("bs-max-clip-sec").value = S.maxClipSec || 60;
    if ($("bs-listen-order")) $("bs-listen-order").value = S.listenScanOrder || "priority";
    if ($("bs-show-new-only")) $("bs-show-new-only").checked = !!S.showNewOnly;
    if ($("bs-show-diff-only")) $("bs-show-diff-only").checked = !!S.showDiffOnly;
  }

  function extrasSettingsHtml() {
    var rows = EXTRAS_DEFS.map(function (e) {
      return '<label class="bs-chk" title="' + escapeHtml(e.tip) + ' · shows on ' + escapeHtml(e.where) +
        '"><input type="checkbox" class="bs-extra-tog" id="bs-extra-' + e.id + '" data-extra-id="' + e.id +
        '"> ' + escapeHtml(e.label) +
        ' <span class="bs-hint">(' + escapeHtml(e.where) + ')</span></label>';
    }).join("");
    return '<details class="bs-tab-opts" id="bs-extras-wrap" open>' +
      '<summary title="Optional features — all off by default. Tick to add controls on existing tabs.">Extras</summary>' +
      '<p class="bs-hint">Optional add-ons. Off by default. Tick one and its controls appear on the tab in parentheses — no new tabs.</p>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-tiny bs-primary" id="bs-extras-all" title="Turn on every extra except Public / shared receiver mode (that extra greys out Factory reset).">Add all extras</button>' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-extras-none" title="Turn every extra off.">Clear extras</button>' +
      "</div>" +
      '<div class="bs-row bs-chk-grid" id="bs-extras">' + rows + "</div>" +
      '<div class="bs-row" data-extra="idlePresets">' +
      '<button type="button" class="bs-tiny bs-btn-util" id="bs-quiet-night" title="Set quiet hours 22:00–06:00.">Quiet · night</button>' +
      '<button type="button" class="bs-tiny bs-btn-util" id="bs-quiet-eve" title="Set quiet hours 18:00–08:00.">Quiet · evening</button>' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-quiet-clear" title="Clear quiet hours.">Clear quiet hours</button>' +
      "</div>" +
      '<div class="bs-row" data-extra="publicMode">' +
      '<span class="bs-hint">Public mode: alone-only on, Own radio off, Factory reset hidden.</span>' +
      "</div></details>";
  }

  function applyExtrasUi() {
    Array.prototype.forEach.call(document.querySelectorAll("#bs-panel [data-extra]"), function (el) {
      var id = el.getAttribute("data-extra");
      if (!id) return;
      el.hidden = !extraOn(id);
    });
    applyPublicModeExtra();
    if (typeof renderSessionLogPane === "function") renderSessionLogPane();
    if (typeof renderWatchlistPane === "function") renderWatchlistPane();
    if (typeof updateSpectrumHistoryUi === "function") updateSpectrumHistoryUi();
    if (extraOn("occHeatmap")) {
      if (S.peaksView === "heatmap") setPeaksView("heatmap");
      else setPeaksView("list");
    } else if ($("bs-hitwrap")) {
      $("bs-hitwrap").hidden = false;
      if ($("bs-occ-heat")) $("bs-occ-heat").hidden = true;
    }
  }

  function applyPublicModeExtra() {
    var on = extraOn("publicMode");
    if (on) {
      S.aloneOnly = true;
      S.ownRadio = false;
      syncAloneUi(true);
      syncOwnRadioUi(false);
      applyOwnerLock();
    }
    var clientsOk = true;
    try { clientsOk = !!(caps() && caps().clients); } catch (e) { clientsOk = true; }
    ["bs-band-alone", "bs-range-alone"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var lab = el.parentElement;
      if (on) {
        el.disabled = true;
        el.checked = true;
        if (lab) {
          if (!lab.getAttribute("data-tip-alone") && lab.getAttribute("title")) {
            lab.setAttribute("data-tip-alone", lab.getAttribute("title"));
          }
          lab.title = "Locked on while Public / shared receiver mode extra is enabled (Settings → Extras).";
          if (lab.classList) lab.classList.add("bs-off");
        }
      } else {
        if (lab && lab.getAttribute("data-tip-alone")) {
          lab.title = lab.getAttribute("data-tip-alone");
          lab.removeAttribute("data-tip-alone");
        }
        /* Restore clickability when client-count bar exists; applyCaps owns the missing-bar case. */
        if (clientsOk) {
          el.disabled = false;
          if (lab && lab.classList) lab.classList.remove("bs-off");
        }
      }
    });
    var frs = [$("bs-factory-reset"), $("bs-factory-reset-2")];
    frs.forEach(function (fr) {
      if (!fr) return;
      fr.hidden = false;
      fr.disabled = on;
    });
    var pubNote = $("bs-factory-public");
    if (pubNote) pubNote.hidden = !on;
  }

  var freqNotesMap = {};
  var sessionLog = [];
  var surveySnapPeaks = null;
  var spectrumHist = [];
  var spectrumHistIdx = -1;

  function loadFreqNotes() {
    try {
      var o = JSON.parse(window.localStorage.getItem(LS_FREQ_NOTES) || "{}");
      freqNotesMap = (o && typeof o === "object") ? o : {};
    } catch (e) { freqNotesMap = {}; }
  }
  function saveFreqNotes() {
    try { window.localStorage.setItem(LS_FREQ_NOTES, JSON.stringify(freqNotesMap)); } catch (e) {}
  }
  function noteForFreq(freq) {
    var k = String(Math.round(Number(freq) || 0));
    return freqNotesMap[k] || "";
  }
  function setNoteForFreq(freq, text) {
    var k = String(Math.round(Number(freq) || 0));
    text = String(text || "").trim().slice(0, 120);
    if (!text) delete freqNotesMap[k];
    else freqNotesMap[k] = text;
    saveFreqNotes();
  }

  function loadSessionLog() {
    try {
      var o = JSON.parse(window.localStorage.getItem(LS_SESSION_LOG) || "[]");
      sessionLog = Array.isArray(o) ? o.slice(-200) : [];
    } catch (e) { sessionLog = []; }
  }
  function saveSessionLog() {
    try { window.localStorage.setItem(LS_SESSION_LOG, JSON.stringify(sessionLog.slice(-200))); } catch (e) {}
  }
  function pushSessionLog(row) {
    if (!extraOn("sessionLog")) return;
    sessionLog.push(row);
    if (sessionLog.length > 200) sessionLog = sessionLog.slice(-200);
    saveSessionLog();
    renderSessionLogPane();
  }
  function clearSessionLog() {
    sessionLog = [];
    saveSessionLog();
    renderSessionLogPane();
    setStatus("Session log cleared.");
  }
  function exportSessionLogCsv() {
    if (!sessionLog.length) {
      setStatus("Session log is empty.");
      return;
    }
    var lines = ["when,freq_mhz,name,busy,clip,db"];
    sessionLog.forEach(function (r) {
      lines.push([
        new Date(r.at || 0).toISOString(),
        ((r.freq || 0) / 1e6).toFixed(3),
        JSON.stringify(String(r.name || "")),
        r.busy ? "yes" : "no",
        r.clip ? "yes" : "no",
        r.db != null ? Math.round(r.db) : ""
      ].join(","));
    });
    downloadFile("band-survey-session-log.csv", lines.join("\n"), "text/csv");
    setStatus("Exported " + sessionLog.length + " session log row(s).");
  }
  function renderSessionLogPane() {
    var host = $("bs-session-log");
    if (!host) return;
    if (!extraOn("sessionLog")) {
      host.innerHTML = "";
      return;
    }
    if (!sessionLog.length) {
      host.innerHTML = '<p class="bs-empty">No hops logged yet. Run Scan bookmarks with Session log on.</p>';
      return;
    }
    var rows = sessionLog.slice().reverse().slice(0, 80).map(function (r) {
      return '<div class="bs-skip-row">' +
        '<span class="bs-hint">' + escapeHtml(new Date(r.at || 0).toLocaleTimeString()) + "</span>" +
        '<button type="button" class="bs-tune" data-log-tune="' + (r.freq || 0) + '">' + fmtMhz(r.freq) + "</button>" +
        '<span class="bs-bm-name">' + escapeHtml(r.name || "") + "</span>" +
        '<span class="bs-hint">' + (r.busy ? "busy" : "quiet") + (r.clip ? " · clip" : "") +
        (r.db != null ? " · " + Math.round(r.db) + " dB" : "") + "</span></div>";
    }).join("");
    host.innerHTML = rows;
  }

  function renderWatchlistPane() {
    var ta = $("bs-watchlist-freqs");
    if (ta && extraOn("watchlist") && document.activeElement !== ta) {
      ta.value = S.alertFreqs || "";
    }
  }

  function loadSurveySnap() {
    try {
      var o = JSON.parse(window.localStorage.getItem(LS_SURVEY_SNAP) || "null");
      surveySnapPeaks = (o && Array.isArray(o.freqs)) ? o : null;
    } catch (e) { surveySnapPeaks = null; }
  }
  function saveSurveySnapNow() {
    var freqs = hits.filter(function (h) { return !isSpur(h); }).map(function (h) { return Math.round(h.freq); });
    surveySnapPeaks = { when: Date.now(), freqs: freqs };
    try { window.localStorage.setItem(LS_SURVEY_SNAP, JSON.stringify(surveySnapPeaks)); } catch (e) {}
    setStatus("Survey snapshot saved (" + freqs.length + " peaks). New peaks vs this snap show as changed.");
    renderHits();
  }
  function peakChangedVsSnap(h) {
    if (!surveySnapPeaks || !surveySnapPeaks.freqs || !surveySnapPeaks.freqs.length) return false;
    var f = Math.round(h.freq);
    for (var i = 0; i < surveySnapPeaks.freqs.length; i++) {
      if (Math.abs(surveySnapPeaks.freqs[i] - f) < 2500) return false;
    }
    return true;
  }

  function loadSpectrumHist() {
    try {
      var o = JSON.parse(window.localStorage.getItem(LS_SPEC_HIST) || "[]");
      spectrumHist = Array.isArray(o) ? o.slice(-8) : [];
      spectrumHistIdx = spectrumHist.length ? spectrumHist.length - 1 : -1;
    } catch (e) { spectrumHist = []; spectrumHistIdx = -1; }
  }
  function pushSpectrumHist(entry) {
    if (!extraOn("spectrumHistory") || !entry) return;
    spectrumHist.push(entry);
    if (spectrumHist.length > 8) spectrumHist = spectrumHist.slice(-8);
    spectrumHistIdx = spectrumHist.length - 1;
    try { window.localStorage.setItem(LS_SPEC_HIST, JSON.stringify(spectrumHist)); } catch (e) {}
    updateSpectrumHistoryUi();
  }
  function updateSpectrumHistoryUi() {
    var lab = $("bs-spec-hist-lab");
    if (!lab) return;
    if (!extraOn("spectrumHistory") || !spectrumHist.length) {
      lab.textContent = "";
      return;
    }
    lab.textContent = (spectrumHistIdx + 1) + "/" + spectrumHist.length;
  }
  function showSpectrumHist(delta) {
    if (!spectrumHist.length) return;
    spectrumHistIdx = Math.max(0, Math.min(spectrumHist.length - 1, spectrumHistIdx + delta));
    var e = spectrumHist[spectrumHistIdx];
    if (!e || !e.payload) return;
    try {
      if (typeof applyRangeSpectrumPayload === "function") applyRangeSpectrumPayload(e.payload);
      else if (typeof restoreRangeSpectrum === "function") {
        /* fall through to stored LS restore path by writing then reload */
        window.localStorage.setItem(LS_RANGE_SPECTRUM, JSON.stringify(e.payload));
        if (typeof loadRangeSpectrum === "function") loadRangeSpectrum();
      }
    } catch (err) {}
    updateSpectrumHistoryUi();
    setStatus("Range spectrum history " + (spectrumHistIdx + 1) + "/" + spectrumHist.length);
  }


  function loadOccHeat() {
    try {
      var o = JSON.parse(window.localStorage.getItem(LS_OCC_HEAT) || "[]");
      occHeatLog = Array.isArray(o) ? o.slice(-4000) : [];
    } catch (e) { occHeatLog = []; }
  }
  function saveOccHeat() {
    try { window.localStorage.setItem(LS_OCC_HEAT, JSON.stringify(occHeatLog.slice(-4000))); } catch (e) {}
  }
  function bandKeyFromProfile(pid, label) {
    var s = String(pid || label || "").toLowerCase();
    var m = s.match(/(80m|40m|30m|20m|17m|15m|12m|10m|6m|4m|2m|70c|air|fm|marine|pmr|cb|mw|lf|hf)/);
    if (m) return m[1];
    var dig = s.match(/(ft8|ft4|wspr|jt65|jt9|fst4|q65|msk144)/);
    if (dig) return dig[1];
    var head = (String(pid || "other").split("_")[0] || "other").replace(/[^a-z0-9]/gi, "");
    return (head || "other").slice(0, 10);
  }
  function isDigiProfile(pid, label) {
    var s = String(pid || "") + " " + String(label || "");
    return /(ft8|ft4|wspr|jt65|jt9|fst4|q65|msk144|digi|js8|psk|rtty|olivia)/i.test(s);
  }
  function countDigiSpotsOnPage() {
    var n = 0;
    try {
      var roots = document.querySelectorAll(
        ".openwebrx-digi-message, .openwebrx-message-content, #openwebrx-panel-digi-modes, " +
        ".openwebrx-panel-digimodes, .message-panel, .wsjt-panel, [class*='digi']"
      );
      for (var i = 0; i < roots.length; i++) {
        var t = roots[i].innerText || "";
        var lines = t.split(/\n+/);
        for (var j = 0; j < lines.length; j++) {
          if (/[A-Z0-9]{1,2}[0-9][A-Z0-9]{1,3}/.test(lines[j]) && lines[j].length < 120) n++;
        }
      }
    } catch (e) {}
    return n;
  }
  function recordOccupancy(pid, label, peakN, digiN) {
    if (!extraOn("occHeatmap") && !extraOn("digiSurvey")) return;
    var now = new Date();
    var score = Math.max(0, Number(peakN) || 0) + Math.max(0, Number(digiN) || 0) * 3;
    if (score <= 0 && !(Number(peakN) > 0)) return;
    occHeatLog.push({
      t: now.getTime(),
      day: now.toISOString().slice(0, 10),
      hour: now.getHours(),
      band: bandKeyFromProfile(pid, label),
      peaks: Math.max(0, Number(peakN) || 0),
      digi: Math.max(0, Number(digiN) || 0),
      score: score
    });
    if (occHeatLog.length > 4000) occHeatLog = occHeatLog.slice(-4000);
    saveOccHeat();
  }
  function clearOccHeat() {
    occHeatLog = [];
    saveOccHeat();
    renderOccHeatmap();
    setStatus("Occupancy heatmap cleared.");
  }
  function occHeatMatrix(daysBack) {
    daysBack = Math.max(1, Math.min(30, Number(daysBack) || 7));
    var cut = Date.now() - daysBack * 86400000;
    var bands = {};
    var cells = {};
    occHeatLog.forEach(function (r) {
      if (!r || (r.t && r.t < cut)) return;
      var b = r.band || "other";
      var h = Number(r.hour);
      if (!(h >= 0 && h <= 23)) return;
      bands[b] = true;
      var k = b + "|" + h;
      cells[k] = (cells[k] || 0) + (Number(r.score) || Number(r.peaks) || 0);
    });
    var bandList = Object.keys(bands).sort();
    return { bands: bandList, cells: cells };
  }
  function renderOccHeatmap() {
    var host = $("bs-occ-heat");
    if (!host) return;
    if (!extraOn("occHeatmap") || S.peaksView !== "heatmap") {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    var days = Number(($("bs-occ-days") && $("bs-occ-days").value) || S.occDays || 7);
    S.occDays = days;
    var mat = occHeatMatrix(days);
    if (!mat.bands.length) {
      host.innerHTML = '<p class="bs-empty">No occupancy yet. Run Scan bands with <b>Band × hour heatmap</b> (and/or Digi survey) enabled under Settings → Extras.</p>';
      return;
    }
    var max = 1;
    Object.keys(mat.cells).forEach(function (k) { if (mat.cells[k] > max) max = mat.cells[k]; });
    var html = '<table class="bs-heat-table"><thead><tr><th>Band</th>';
    for (var h = 0; h < 24; h++) html += "<th>" + h + "</th>";
    html += "</tr></thead><tbody>";
    mat.bands.forEach(function (b) {
      html += "<tr><th>" + escapeHtml(b) + "</th>";
      for (var hr = 0; hr < 24; hr++) {
        var v = mat.cells[b + "|" + hr] || 0;
        var a = v ? Math.min(0.92, 0.12 + 0.8 * (v / max)) : 0;
        html += '<td title="' + escapeHtml(b) + " @ " + hr + ":00 · score " + v +
          '" style="background:rgba(249,115,22,' + a + ')">' + (v ? "" : "") + "</td>";
      }
      html += "</tr>";
    });
    html += "</tbody></table>";
    host.innerHTML = html;
  }
  function setPeaksView(mode) {
    S.peaksView = mode === "heatmap" ? "heatmap" : "list";
    saveSettings();
    var listOn = S.peaksView === "list";
    if ($("bs-hitwrap")) $("bs-hitwrap").hidden = !listOn;
    if ($("bs-peaks-view-list")) $("bs-peaks-view-list").classList.toggle("bs-on", listOn);
    if ($("bs-peaks-view-heat")) $("bs-peaks-view-heat").classList.toggle("bs-on", !listOn);
    if (listOn) renderHits();
    else renderOccHeatmap();
  }
  function applyDigiModeIfNeeded(pid, label) {
    if (!extraOn("digiSurvey") || !S.digiForceOn) return;
    var mod = String(S.digiForceMode || "ft8").trim();
    if (!mod) return;
    if (!isDigiProfile(pid, label) && !/ft8|ft4|wspr|jt/i.test(mod)) {
      /* still allow force when user asked */
    }
    try {
      if (window.UI && typeof UI.setModulation === "function") UI.setModulation(mod, "");
    } catch (e) {}
  }
  function digiDwellForProfile(pid, label, baseDwell) {
    var d = Number(baseDwell) || 2.5;
    if (!extraOn("digiSurvey") || !S.digiLongDwell) return d;
    if (!isDigiProfile(pid, label)) return d;
    return Math.max(d, Math.min(180, Number(S.digiDwellSec) || 90));
  }
  function markBookmarksScannable(onlyAuto) {
    if (typeof BookmarkLocalStorage !== "function" && !(window.bookmarks && bookmarks.localBookmarks)) {
      setStatus("Local bookmarks API missing — cannot mark scannable.");
      return 0;
    }
    var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
    var list = store.getBookmarks() || [];
    var n = 0;
    list.forEach(function (b) {
      if (onlyAuto && !b.auto && !/^\[auto\]/i.test(b.name || "")) return;
      if (!b.scannable) { b.scannable = true; n++; }
      else b.scannable = true;
    });
    store.setBookmarks(list);
    if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
      try { bookmarks.loadLocalBookmarks(); } catch (e) {}
    }
    return n;
  }
  function startExternalScanner() {
    var started = false;
    try {
      if (window.fs_scanner_state && !fs_scanner_state.running && typeof fs_start_scanner === "function") {
        fs_start_scanner();
        started = true;
      }
    } catch (e) {}
    if (!started) {
      try {
        if (window.UI && typeof UI.toggleScanner === "function") {
          UI.toggleScanner(true);
          started = true;
        }
      } catch (e2) {}
    }
    return started;
  }
  function sendToScannerAction() {
    if (!extraOn("sendToScanner")) return;
    var n = markBookmarksScannable(false);
    var ok = startExternalScanner();
    setStatus((ok ? "Scanner started" : "Could not start scanner (is freq_scanner / OWRX+ scanner available?)") +
      " · scannable bookmarks updated (" + n + " newly marked).");
    toast(ok ? "Sent to scanner" : "Marked scannable — start scanner from SQ / freq_scanner");
  }
  function shareSurveyReport() {
    if (!extraOn("shareReport")) return;
    var top = sortedHits().filter(function (h) { return !isSpur(h); }).slice(0, 18);
    var w = 720;
    var h = 420 + (extraOn("occHeatmap") ? 160 : 0);
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("OpenWebRX Band survey", 24, 36);
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(new Date().toLocaleString() + " · " + hits.length + " peaks stored · top " + top.length, 24, 58);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px monospace";
    var y = 84;
    top.forEach(function (hit, i) {
      var line = (i + 1) + ". " + fmtMhz(hit.freq) + "  seen " + hit.seen + "×  " +
        Math.round(hit.maxDb || 0) + " dB  " + (hit.name || hit.label || hit.pid || "");
      ctx.fillText(line.slice(0, 88), 24, y);
      y += 16;
    });
    if (extraOn("occHeatmap") && occHeatLog.length) {
      y += 10;
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Occupancy (last surveys) — darker = busier hour", 24, y);
      y += 12;
      var mat = occHeatMatrix(Number(S.occDays) || 7);
      var cellW = Math.floor((w - 100) / 24);
      var cellH = 12;
      mat.bands.slice(0, 8).forEach(function (b, bi) {
        var max = 1;
        for (var hr = 0; hr < 24; hr++) max = Math.max(max, mat.cells[b + "|" + hr] || 0);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "10px sans-serif";
        ctx.fillText(b, 24, y + bi * (cellH + 4) + 10);
        for (var hr2 = 0; hr2 < 24; hr2++) {
          var v = mat.cells[b + "|" + hr2] || 0;
          var a = v ? Math.min(0.95, 0.15 + 0.8 * (v / max)) : 0.06;
          ctx.fillStyle = "rgba(249,115,22," + a + ")";
          ctx.fillRect(90 + hr2 * cellW, y + bi * (cellH + 4), cellW - 1, cellH);
        }
      });
    }
    try {
      c.toBlob(function (blob) {
        if (!blob) {
          setStatus("Share report failed (canvas).");
          return;
        }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "band-survey-report-" + Date.now() + ".png";
        a.click();
        setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 2000);
        setStatus("Survey report PNG downloaded.");
      }, "image/png");
    } catch (err) {
      setStatus(friendlyError(err, "Share report"));
    }
  }


  function copyTuneText(freq, mode) {
    var mhz = fmtMhzNum(freq);
    var text = mhz + " MHz" + (mode ? (" " + mode) : "");
    function ok() { setStatus("Copied: " + text); }
    function fail() { try { prompt("Copy:", text); } catch (e) {} }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else fail();
  }

  function addNamedBookmarkFromPeak(freq) {
    var hit = null;
    for (var i = 0; i < hits.length; i++) {
      if (Math.abs(hits[i].freq - freq) < 2500) { hit = hits[i]; break; }
    }
    if (!hit) {
      setStatus("Peak not found.");
      return;
    }
    var name = window.prompt("Bookmark name:", hit.name || existingName(hit.freq) || fmtMhz(hit.freq));
    if (name == null) return;
    name = String(name).trim();
    if (!name) return;
    hit.name = name;
    hit.auto = false;
    var r = addBookmark(hit);
    if (r && !r.already) {
      /* force non-auto name */
      try {
        var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
        var list = store.getBookmarks() || [];
        for (var j = 0; j < list.length; j++) {
          if (Math.abs(list[j].frequency - hit.freq) < 2500) {
            list[j].name = name;
            list[j].auto = false;
            store.setBookmarks(list);
            if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") bookmarks.loadLocalBookmarks();
            break;
          }
        }
      } catch (e) {}
    }
    refreshBookmarks();
    setStatus("Saved named bookmark: " + name);
  }

  function captureWaterfallPng() {
    var canvases = document.querySelectorAll("canvas");
    var best = null;
    var bestA = 0;
    for (var i = 0; i < canvases.length; i++) {
      var c = canvases[i];
      var a = (c.width || 0) * (c.height || 0);
      if (a > bestA && c.width > 100 && c.height > 40) {
        bestA = a;
        best = c;
      }
    }
    if (!best) {
      setStatus("No waterfall canvas found to snapshot.");
      return;
    }
    try {
      best.toBlob(function (blob) {
        if (!blob) {
          setStatus("Could not export waterfall PNG.");
          return;
        }
        downloadBlob("sv-waterfall-" + Date.now() + ".png", blob);
        setStatus("Waterfall snapshot saved.");
      }, "image/png");
    } catch (e) {
      setStatus("Waterfall snapshot blocked (canvas tainted or unsupported).");
    }
  }

  function nearbyTrafficHint(freq) {
    if (!extraOn("nearbyTraffic")) return "";
    try {
      if (window.Planes && typeof Planes.getPlanes === "function") {
        var planes = Planes.getPlanes() || [];
        if (planes.length) return '<span class="bs-hint" title="Aircraft data present on page">✈' + planes.length + "</span> ";
      }
    } catch (e) {}
    try {
      if (document.getElementById("openwebrx-map") || document.querySelector(".aircraft, .adsb, #aircraft")) {
        return '<span class="bs-hint" title="Map/traffic UI detected on page">map</span> ';
      }
    } catch (e2) {}
    return "";
  }

  function sortListenItemsExtra(items) {
    var order = S.listenScanOrder || "priority";
    if (!extraOn("scanOrder") || order === "priority") return sortListenPriority(items);
    var copy = (items || []).slice();
    if (order === "freq") copy.sort(function (a, b) { return (a.freq || a.frequency || 0) - (b.freq || b.frequency || 0); });
    else if (order === "name") copy.sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
    else if (order === "random") {
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
      }
    }
    return copy;
  }

  function bindExtrasKeyboard() {
    if (bindExtrasKeyboard._on) return;
    bindExtrasKeyboard._on = true;
    window.addEventListener("keydown", function (ev) {
      if (!extraOn("keyboard")) return;
      if (!$("bs-panel") || $("bs-panel").hidden) return;
      var tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (ev.target && ev.target.isContentEditable)) return;
      var k = (ev.key || "").toLowerCase();
      if (k === "s") {
        ev.preventDefault();
        if ($("bs-stop") && !$("bs-stop").hidden) $("bs-stop").click();
        else if ($("bs-stop-bm") && !$("bs-stop-bm").hidden) $("bs-stop-bm").click();
      }
      else if (k === "b") { ev.preventDefault(); if ($("bs-listen-top")) $("bs-listen-top").click(); }
      else if (k === "h") { ev.preventDefault(); if ($("bs-hold")) $("bs-hold").click(); }
      else if (k === "k" || ev.key === "ArrowRight") {
        ev.preventDefault();
        if ($("bs-skip")) $("bs-skip").click();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        if (listenScanRunning) {
          listenCmd = "prev";
          setStatus("Previous bookmark…");
        }
      }
    });
  }

  function tryTranscribeClip(id) {
    if (!extraOn("speechToText")) return;
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      setStatus("Speech recognition not available in this browser (try Chrome).");
      return;
    }
    var clip = null;
    for (var i = 0; i < audioClips.length; i++) if (audioClips[i].id === id) clip = audioClips[i];
    if (!clip || !clip.url) return;
    playAudioClip(id);
    var rec = new Rec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = function (ev) {
      var text = "";
      for (var i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript + " ";
      text = text.trim();
      clip.transcript = text;
      setStatus("Transcript: " + text.slice(0, 120));
      renderAudioClips();
    };
    rec.onerror = function () { setStatus("Transcribe failed or mic/permission issue."); };
    try { rec.start(); } catch (e) { setStatus("Could not start speech recognition."); }
  }

  function sanitizeLayoutSettings(d) {
    var layoutDefaults = {
      panelW: 0, panelH: 0, splitPct: 62, leftSplitPct: 58,
      rightSplit1: 28, rightSplit2: 52, rightSplit3: 76
    };
    Object.keys(layoutDefaults).forEach(function (k) {
      var v = Number(d[k]);
      if (!isFinite(v)) d[k] = layoutDefaults[k];
    });
    if (typeof d.panelLeft !== "number" || !isFinite(d.panelLeft)) d.panelLeft = null;
    if (typeof d.panelTop !== "number" || !isFinite(d.panelTop)) d.panelTop = null;
    if (!Array.isArray(d.hiddenTabs)) d.hiddenTabs = [];
    d.hiddenTabs = d.hiddenTabs.filter(function (id) {
      if (!id || id === "settings") return false;
      if (!TAB_IDS || !TAB_IDS.length) return id !== "freq";
      return TAB_IDS.indexOf(id) >= 0;
    });
    /* Analyzer tab is experimental — default off for new + existing installs. */
    if (!d.analyzerTabMigrated) {
      if (d.hiddenTabs.indexOf("analyzer") < 0) d.hiddenTabs.push("analyzer");
      d.analyzerTabMigrated = true;
    }
    /* Drop removed Freq tab from saved hidden lists */
    d.hiddenTabs = d.hiddenTabs.filter(function (id) { return id !== "freq"; });
    delete d.freqTabMigrated;
    if (typeof d.hideToolbar !== "boolean") d.hideToolbar = false;
    if (!Array.isArray(d.loadUserBmBands)) {
      d.loadUserBmBands = [];
      var old = d.loadUserBmScope;
      if (typeof old === "string" && old.indexOf("p:") === 0) {
        d.loadUserBmBands = [old.slice(2)];
      }
    }
    delete d.loadUserBmScope;
    d.extras = sanitizeExtras(d.extras);
    d.maxClipSec = Math.max(5, Math.min(600, Number(d.maxClipSec) || 60));
    if (!d.listenScanOrder) d.listenScanOrder = "priority";
    if (typeof d.digiLongDwell !== "boolean") d.digiLongDwell = true;
    d.digiDwellSec = Math.max(15, Math.min(180, Number(d.digiDwellSec) || 90));
    if (!d.digiForceMode) d.digiForceMode = "ft8";
    if (typeof d.digiForceOn !== "boolean") d.digiForceOn = false;
    if (typeof d.dayNightBeforeSched !== "boolean") d.dayNightBeforeSched = false;
    if (d.peaksView !== "heatmap") d.peaksView = "list";
    d.occDays = Math.max(1, Math.min(30, Number(d.occDays) || 7));
    if (typeof d.showNewOnly !== "boolean") d.showNewOnly = false;
    if (typeof d.showDiffOnly !== "boolean") d.showDiffOnly = false;
    if (typeof saDefaultsPatch === "function") saDefaultsPatch(d);
    delete d.leftTopSplit1;
    delete d.leftTopSplit2;
    return d;
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(LS, JSON.stringify(S));
    } catch (e) {}
  }

  /* Button colour roles — right-click a button to pick a shade (applies to every button of that role). */
  var BTN_ROLE_META = [
    { id: "primary", cls: "bs-primary", label: "Start scan" },
    { id: "stop", cls: "bs-stop", label: "Stop" },
    { id: "fresh", cls: "bs-btn-fresh", label: "Fresh scan" },
    { id: "jump", cls: "bs-btn-jump", label: "Jump / nudge" },
    { id: "hold", cls: "bs-btn-hold", label: "Hold" },
    { id: "skip", cls: "bs-btn-skip", label: "Skip" },
    { id: "lock", cls: "bs-btn-lock", label: "Always skip / Lockout" },
    { id: "go", cls: "bs-btn-go", label: "Go" },
    { id: "play", cls: "bs-btn-play", label: "Play" },
    { id: "bm", cls: "bs-btn-bm", label: "Bookmark" },
    { id: "export", cls: "bs-btn-export", label: "Export / Save" },
    { id: "import", cls: "bs-btn-import", label: "Import / Load" },
    { id: "clear", cls: "bs-btn-clear", label: "Clear" },
    { id: "info", cls: "bs-btn-info", label: "Check / Info" },
    { id: "util", cls: "bs-btn-util", label: "Utility" },
    { id: "preset", cls: "bs-btn-preset", label: "Presets" },
    { id: "tune", cls: "bs-tune", label: "Tune MHz" }
  ];

  var BTN_SHADES = {
    blue: { bg: "#1d4ed8", hover: "#2563eb", border: "#93c5fd", fg: "#ffffff" },
    indigo: { bg: "#4338ca", hover: "#4f46e5", border: "#a5b4fc", fg: "#eef2ff" },
    violet: { bg: "#6d28d9", hover: "#7c3aed", border: "#c4b5fd", fg: "#f5f3ff" },
    purple: { bg: "#5b21b6", hover: "#7c3aed", border: "#c4b5fd", fg: "#ede9fe" },
    teal: { bg: "#0f766e", hover: "#0d9488", border: "#5eead4", fg: "#ecfdf5" },
    green: { bg: "#15803d", hover: "#16a34a", border: "#86efac", fg: "#f0fdf4" },
    emerald: { bg: "#047857", hover: "#059669", border: "#6ee7b7", fg: "#ecfdf5" },
    cyan: { bg: "#0e7490", hover: "#0891b2", border: "#67e8f9", fg: "#ecfeff" },
    amber: { bg: "#b45309", hover: "#d97706", border: "#fcd34d", fg: "#fffbeb" },
    orange: { bg: "#c2410c", hover: "#ea580c", border: "#fdba74", fg: "#fff7ed" },
    rose: { bg: "#9f1239", hover: "#e11d48", border: "#fda4af", fg: "#ffe4e6" },
    red: { bg: "#991b1b", hover: "#dc2626", border: "#fca5a5", fg: "#ffffff" },
    slate: { bg: "#334155", hover: "#475569", border: "#94a3b8", fg: "#f8fafc" },
    zinc: { bg: "#1e293b", hover: "#334155", border: "#64748b", fg: "#e2e8f0" }
  };

  var BTN_DEFAULT_SHADE = {
    primary: "blue",
    stop: "red",
    fresh: "teal",
    jump: "violet",
    hold: "amber",
    skip: "slate",
    lock: "orange",
    go: "green",
    play: "green",
    bm: "emerald",
    export: "blue",
    import: "purple",
    clear: "rose",
    info: "cyan",
    util: "zinc",
    preset: "indigo",
    tune: "violet"
  };

  function btnRoleFromEl(el) {
    if (!el || !el.classList) return null;
    if (el.classList.contains("bs-tab") || el.classList.contains("bs-x") || el.classList.contains("bs-check-dismiss")) return null;
    if (el.classList.contains("bs-ex-mode")) return null;
    var i, meta;
    for (i = 0; i < BTN_ROLE_META.length; i++) {
      meta = BTN_ROLE_META[i];
      if (el.classList.contains(meta.cls)) return meta;
      if (meta.id === "jump" && el.classList.contains("bs-ex-nudge")) return meta;
      if (meta.id === "jump" && el.classList.contains("bs-ex-arrow")) return meta;
    }
    return null;
  }

  function ensureBtnShadesObj() {
    if (!S.btnShades || typeof S.btnShades !== "object") S.btnShades = {};
    return S.btnShades;
  }

  function applyBtnShades() {
    var style = $("bs-btn-shade-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "bs-btn-shade-style";
      document.head.appendChild(style);
    }
    var map = ensureBtnShadesObj();
    var css = "";
    var i, meta, key, shade, sel;
    for (i = 0; i < BTN_ROLE_META.length; i++) {
      meta = BTN_ROLE_META[i];
      key = map[meta.id];
      if (!key || !BTN_SHADES[key]) continue;
      if (BTN_DEFAULT_SHADE[meta.id] === key) continue;
      shade = BTN_SHADES[key];
      sel = "#bs-panel button." + meta.cls + ":not(.bs-on)";
      if (meta.id === "jump") {
        sel = "#bs-panel button.bs-btn-jump:not(.bs-on), #bs-panel button.bs-ex-nudge:not(.bs-on), #bs-panel button.bs-ex-arrow:not(.bs-on)";
      }
      css += sel + "{background:" + shade.bg + " !important;color:" + shade.fg +
        " !important;border-color:" + shade.border + " !important;}" +
        sel + ":hover{background:" + shade.hover + " !important;}";
    }
    style.textContent = css;
  }

  function closeBtnShadeMenu() {
    var menu = $("bs-shade-menu");
    if (menu) menu.hidden = true;
  }

  function openBtnShadeMenu(ev, meta) {
    var menu = $("bs-shade-menu");
    if (!menu) return;
    var map = ensureBtnShadesObj();
    var cur = map[meta.id] || BTN_DEFAULT_SHADE[meta.id] || "";
    var title = menu.querySelector(".bs-shade-title");
    if (title) title.textContent = meta.label + " — choose shade";
    var grid = menu.querySelector(".bs-shade-swatches");
    if (grid) {
      grid.innerHTML = Object.keys(BTN_SHADES).map(function (key) {
        var sh = BTN_SHADES[key];
        var on = key === cur ? " bs-shade-on" : "";
        return '<button type="button" class="bs-shade-swatch' + on + '" data-shade="' + key +
          '" title="' + key + '" style="background:' + sh.bg + ';border-color:' + sh.border +
          ';color:' + sh.fg + '">' + key.charAt(0).toUpperCase() + "</button>";
      }).join("");
    }
    menu.setAttribute("data-role", meta.id);
    menu.hidden = false;
    var x = ev.clientX;
    var y = ev.clientY;
    menu.style.left = "0px";
    menu.style.top = "0px";
    var w = menu.offsetWidth || 220;
    var h = menu.offsetHeight || 160;
    var left = Math.min(x, window.innerWidth - w - 8);
    var top = Math.min(y, window.innerHeight - h - 8);
    menu.style.left = Math.max(8, left) + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function bindBtnShadePicker(panel) {
    if (!panel || panel.getAttribute("data-bs-shade-bound")) return;
    panel.setAttribute("data-bs-shade-bound", "1");
    panel.addEventListener("contextmenu", function (ev) {
      var btn = ev.target && ev.target.closest && ev.target.closest("#bs-panel button");
      if (!btn) return;
      var meta = btnRoleFromEl(btn);
      if (!meta) return;
      ev.preventDefault();
      ev.stopPropagation();
      openBtnShadeMenu(ev, meta);
    });
    if (!$("bs-shade-menu")) {
      var menu = document.createElement("div");
      menu.id = "bs-shade-menu";
      menu.hidden = true;
      menu.innerHTML =
        '<div class="bs-shade-title">Choose shade</div>' +
        '<div class="bs-shade-swatches"></div>' +
        '<div class="bs-shade-actions">' +
        '<button type="button" class="bs-tiny bs-btn-util" data-shade-default="1" title="Restore the default colour for this button type.">Default</button>' +
        '<button type="button" class="bs-tiny bs-btn-clear" data-shade-reset-all="1" title="Restore default colours for every button type.">Reset all</button>' +
        "</div>" +
        '<p class="bs-shade-hint">Applies to every button of this type</p>';
      document.body.appendChild(menu);
      menu.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var t = ev.target && ev.target.closest && ev.target.closest("[data-shade], [data-shade-default], [data-shade-reset-all]");
        if (!t) return;
        var role = menu.getAttribute("data-role");
        var map = ensureBtnShadesObj();
        if (t.getAttribute("data-shade-reset-all")) {
          S.btnShades = {};
          saveSettings();
          applyBtnShades();
          closeBtnShadeMenu();
          setStatus("Button colours reset to defaults.");
          return;
        }
        if (!role) return;
        if (t.getAttribute("data-shade-default")) {
          delete map[role];
        } else {
          var key = t.getAttribute("data-shade");
          if (!BTN_SHADES[key]) return;
          if (BTN_DEFAULT_SHADE[role] === key) delete map[role];
          else map[role] = key;
        }
        S.btnShades = map;
        saveSettings();
        applyBtnShades();
        closeBtnShadeMenu();
        var lab = "";
        for (var i = 0; i < BTN_ROLE_META.length; i++) {
          if (BTN_ROLE_META[i].id === role) { lab = BTN_ROLE_META[i].label; break; }
        }
        setStatus((lab || "Buttons") + " colour updated.");
      });
      document.addEventListener("click", function () { closeBtnShadeMenu(); });
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") closeBtnShadeMenu();
      });
    }
  }

  function resetBtnShades() {
    S.btnShades = {};
    saveSettings();
    applyBtnShades();
    setStatus("Button colours reset to defaults.");
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

  function slimHitSamplesIfHuge() {
    if (hits.length < 600) return;
    hits.forEach(function (h) {
      if (h.samples && h.samples.length > 8) h.samples = h.samples.slice(-8);
    });
  }

  function ensureHitsLoaded(done) {
    if (S.keepPeaks === false) {
      _hitsLoaded = true;
      if (done) done(0);
      return;
    }
    if (_hitsLoaded) {
      if (done) done(hits.length);
      return;
    }
    if (done) _hitsLoadQueue.push(done);
    if (_hitsLoading) return;
    _hitsLoading = true;
    setTimeout(function () {
      try {
        loadHits();
        trimPeaksIfNeeded();
        slimHitSamplesIfHuge();
      } catch (e) {}
      _hitsLoaded = true;
      _hitsLoading = false;
      var n = hits.length;
      var q = _hitsLoadQueue.slice();
      _hitsLoadQueue = [];
      q.forEach(function (cb) { cb(n); });
    }, 0);
  }

  function ensureHitsLoadedPromise() {
    return new Promise(function (resolve) {
      ensureHitsLoaded(resolve);
    });
  }

  function ensureHitsClassified() {
    if (_hitsClassified || !hits.length) return;
    classifyAll();
    _hitsClassified = true;
  }

  function saveHits() {
    if (S.keepPeaks === false) return;
    try {
      hits.forEach(function (h) {
        if (h.samples && h.samples.length > 48) h.samples = h.samples.slice(-48);
      });
      window.localStorage.setItem(LS_HITS, JSON.stringify({ hits: hits, tileLooks: tileLooks }));
    } catch (e) {}
  }

  function alwaysOnBand(pid, label) {
    if (/^(fm_|dab_|ais|adsb|vdl2|pocsag|tetra|ism)/.test(pid || "")) return true;
    return isFmBroadcastProfile(pid, label) || isHfBroadcastProfile(pid, label);
  }

  function deferPanelHeavyWork(includeHealth) {
    if (_panelHeavyTimer) clearTimeout(_panelHeavyTimer);
    _panelHeavyTimer = setTimeout(function () {
      _panelHeavyTimer = null;
      fillBands();
      var peaksOpen = document.querySelector('#bs-tabs .bs-tab.bs-tab-on[data-tab="peaks"]');
      if (peaksOpen) {
        ensureHitsClassified();
        renderHits();
      } else {
        var host = $("bs-hitwrap");
        if (host && hits.length && !host.querySelector("table")) {
          host.innerHTML = '<p class="bs-empty">' + hits.length +
            " peaks stored. Open the Peaks tab to load the table (keeps SV snappy).</p>";
        }
      }
      renderBookmarkPane();
      updateTabLabels();
      if (includeHealth) renderHealth();
      requestAnimationFrame(function () { applyPanelLayout(); });
    }, 0);
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

  function continuousBmScanOn() {
    return S.continuousBmScan !== false;
  }

  function listenScanIdleTitle() {
    return continuousBmScanOn()
      ? "Loop through bookmarks continuously until Stop. New auto bookmarks first, then all local and loaded."
      : "Loop bookmarks until Stop — pauses on busy channels (Continue / Skip / Hold). New auto bookmarks first, then all local and loaded.";
  }

  function setListenScanRunning(on) {
    listenScanRunning = !!on;
    if (on && listenPaused && !continuousBmScanOn()) {
      setListenPaused(true);
      applyToolbarVisibility();
      return;
    }
    var label = listenScanRunning
      ? (listenPaused && !continuousBmScanOn() ? "Continue scan bookmarks" : "Scanning bookmarks")
      : "Scan bookmarks";
    var title = listenScanRunning
      ? (listenPaused && !continuousBmScanOn()
        ? "Leave this busy channel and continue hopping through bookmarks."
        : "Bookmark scan is running — click Stop to end.")
      : listenScanIdleTitle();
    var btn = $("bs-listen-top");
    if (btn) {
      btn.textContent = label;
      btn.title = title;
      btn.disabled = listenScanRunning && (continuousBmScanOn() || !listenPaused);
      btn.classList.toggle("bs-on", listenScanRunning || listenPaused);
      btn.classList.toggle("bs-running", listenScanRunning && (continuousBmScanOn() || !listenPaused));
    }
    applyToolbarVisibility();
  }

  function setSurveyRunning(on) {
    surveyRunning = !!on;
    var label = surveyRunning ? "Scanning bands" : "Scan bands";
    var title = surveyRunning
      ? "Band survey is running — click Stop to end."
      : "Walk ticked bands and add to Seen counts.";
    var btn = $("bs-start");
    if (btn) {
      btn.textContent = label;
      btn.title = title;
      btn.disabled = surveyRunning;
      btn.classList.toggle("bs-on", surveyRunning);
      btn.classList.toggle("bs-running", surveyRunning);
    }
    applyToolbarVisibility();
  }

  function setListenPaused(on) {
    listenPaused = !!on;
    if (listenScanRunning && continuousBmScanOn()) return;
    var listenLabel = listenPaused
      ? "Continue scan bookmarks"
      : (listenScanRunning ? "Scanning bookmarks" : "Scan bookmarks");
    var listenTitle = listenPaused
      ? "Leave this busy channel and continue hopping through bookmarks."
      : (listenScanRunning ? "Bookmark scan is running — click Stop to end." : listenScanIdleTitle());
    var btn = $("bs-listen-top");
    if (!btn) return;
    btn.textContent = listenLabel;
    btn.title = listenTitle;
    btn.disabled = listenScanRunning && !listenPaused;
    btn.classList.toggle("bs-on", listenPaused || listenScanRunning);
    btn.classList.toggle("bs-running", listenScanRunning && !listenPaused);
    applyToolbarVisibility();
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
    var msg = "Other listeners online (" + n + ") — untick Only if alone (Range / Bands / Settings).";
    setStatus(msg);
    toast(msg);
    return true;
  }

  function notify(msg) {
    notifyNewPeak(msg, null);
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

  function askNotifyPerm() {
    try {
      if ((S.notifyNew || S.notifyScanDone) && window.Notification && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } catch (e) {}
  }

  function getHopSettleMs() {
    var v = Number(S.profileSettleMs);
    return (isFinite(v) && v >= 100) ? Math.min(5000, v) : HOP_SETTLE_MS;
  }

  function maxAudioClipsCap() {
    var n = Number(S.maxAudioClips);
    return (isFinite(n) && n >= 5) ? Math.min(200, Math.round(n)) : 40;
  }

  function getMagicKey() {
    try {
      if (window.UI && typeof UI.getDemodulatorPanel === "function") {
        var dp = UI.getDemodulatorPanel();
        if (dp && typeof dp.getMagicKey === "function") {
          var k = dp.getMagicKey();
          if (k) return k;
        }
      }
    } catch (e) {}
    try {
      var m = (window.location.hash || "").match(/(?:^|[&#])key=([^&]*)/);
      if (m && m[1]) return decodeURIComponent(m[1]);
    } catch (e2) {}
    return Plugins.band_survey.magic_key || "";
  }

  function pluginSetFrequency(freq) {
    freq = Math.round(freq);
    if (!isFinite(freq) || freq < 0) return;
    bsInternalTune = true;
    try {
      var sock = window.ws;
      var key = getMagicKey();
      if (sock && sock.readyState === 1 && key) {
        sock.send(JSON.stringify({
          type: "setfrequency",
          params: { frequency: freq, key: key }
        }));
      }
      if (window.UI && typeof UI.setFrequency === "function") {
        UI.setFrequency(freq);
      }
      if (window.UI && typeof UI.toggleScanner === "function") {
        UI.toggleScanner(false);
      }
    } finally {
      setTimeout(function () { bsInternalTune = false; }, 0);
    }
  }

  function hookTuneApi() {
    if (window._bs_tune_hooked || !window.UI || typeof UI.setFrequency !== "function") return;
    var orig = UI.setFrequency.bind(UI);
    UI.setFrequency = function (freq) {
      if (running && S.pauseOnManualTune && !bsInternalTune) {
        stopFlag = true;
        setStatus("Paused — you tuned manually.");
      }
      if (!bsInternalTune && !running && !listenScanRunning) lastManualTuneAt = Date.now();
      return orig(freq);
    };
    window._bs_tune_hooked = true;
  }

  function parseTimeHm(s) {
    var m = String(s || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    var h = Number(m[1]);
    var min = Number(m[2]);
    if (!isFinite(h) || !isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
  }

  function inQuietHours() {
    var sm = parseTimeHm(S.quietStart);
    var em = parseTimeHm(S.quietEnd);
    if (sm === null || em === null) return false;
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    if (sm <= em) return mins >= sm && mins < em;
    return mins >= sm || mins < em;
  }

  function receiverRecentlyActive() {
    if (!S.schedIdleOnly) return false;
    return lastManualTuneAt && (Date.now() - lastManualTuneAt) < SCHED_IDLE_MS;
  }

  function isAlertFreq(freq) {
    var list = parseHzList(S.alertFreqs);
    if (!list.length) return false;
    var offset = Math.max(1, Number(S.alertOffsetKhz) || 25) * 1000;
    for (var i = 0; i < list.length; i++) {
      if (Math.abs(list[i] - freq) <= offset) return true;
    }
    return false;
  }

  function fireWebhook(hit) {
    var url = String(S.webhookUrl || "").trim();
    if (!url || !hit) return;
    var payload = {
      freq: hit.freq,
      name: hit.name || existingName(hit.freq) || "",
      db: hit.maxDb || hit.lastDb || 0,
      band: hit.label || hit.pid || ""
    };
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function notifyScanComplete(msg) {
    if (!S.notifyScanDone || !msg) return;
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

  function notifyNewPeak(msg, hit) {
    if (!S.notifyNew || !msg) return;
    var alertHit = hit && isAlertFreq(hit.freq);
    if (S.soundNewPeak !== false || alertHit) beep();
    if (alertHit && S.notifyNew) {
      msg = "Alert " + msg;
      if (S.soundNewPeak !== false) beep();
    }
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
    if (hit) fireWebhook(hit);
  }

  function trimPeaksIfNeeded() {
    var max = Number(S.maxPeaks);
    if (!isFinite(max) || max < 1 || hits.length <= max) return;
    hits.sort(function (a, b) { return (a.last || 0) - (b.last || 0); });
    while (hits.length > max) hits.shift();
  }

  function resolveOpenTab() {
    var tab = "bands";
    if (S.defaultTab && S.defaultTab !== "last" && TAB_IDS.indexOf(S.defaultTab) >= 0) {
      tab = S.defaultTab;
    } else {
      try {
        var saved = null;
        if (S.rememberTab !== false) saved = window.localStorage.getItem(SS_TAB);
        if (!saved) saved = sessionStorage.getItem(SS_TAB);
        if (saved && TAB_IDS.indexOf(saved) >= 0) tab = saved;
      } catch (e) {}
    }
    if (isTabHidden(tab)) return firstVisibleTab();
    return tab;
  }

  function isTabHidden(id) {
    if (!id || id === "settings") return false;
    var list = S.hiddenTabs;
    return Array.isArray(list) && list.indexOf(id) >= 0;
  }

  function firstVisibleTab() {
    var i;
    for (i = 0; i < TAB_IDS.length; i++) {
      if (!isTabHidden(TAB_IDS[i])) return TAB_IDS[i];
    }
    return "settings";
  }

  function fillVisibleTabsForm() {
    var box = $("bs-visible-tabs");
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll("input.bs-tab-vis[data-tab]"), function (inp) {
      var id = inp.getAttribute("data-tab");
      inp.checked = !isTabHidden(id);
      inp.disabled = id === "settings";
    });
  }

  function readHiddenTabsFromForm() {
    var box = $("bs-visible-tabs");
    if (!box) return;
    var hidden = [];
    Array.prototype.forEach.call(box.querySelectorAll("input.bs-tab-vis[data-tab]"), function (inp) {
      var id = inp.getAttribute("data-tab");
      if (id === "settings") return;
      if (!inp.checked) hidden.push(id);
    });
    S.hiddenTabs = hidden;
  }

  function applyHiddenTabs() {
    var bar = $("bs-tabs");
    if (bar) {
      Array.prototype.forEach.call(bar.querySelectorAll(".bs-tab"), function (btn) {
        var id = btn.getAttribute("data-tab");
        var hide = isTabHidden(id);
        btn.hidden = hide;
        if (hide) btn.classList.remove("bs-tab-on");
      });
    }
    fillVisibleTabsForm();
    var on = bar && bar.querySelector(".bs-tab.bs-tab-on:not([hidden])");
    var cur = on && on.getAttribute("data-tab");
    if (!cur || isTabHidden(cur)) switchTab(firstVisibleTab(), true);
  }

  function currentPanelTab() {
    var on = document.querySelector("#bs-tabs .bs-tab.bs-tab-on");
    return (on && on.getAttribute("data-tab")) || "";
  }

  function setElHidden(el, hide) {
    if (!el) return;
    el.hidden = !!hide;
  }

  function applyToolbarVisibility() {
    var tb = $("bs-toolbar");
    var p = $("bs-panel");
    var hidePref = !!S.hideToolbar;
    var tab = currentPanelTab();
    var survey = !!(running || surveyRunning);
    var listen = !!listenScanRunning;
    var busy = survey || listen;
    if (p) p.classList.toggle("bs-hide-toolbar", hidePref);

    var showBand = !hidePref && tab === "bands";
    var showBm = !hidePref && (tab === "bookmarks" || listen);
    var showBusyStop = !hidePref && busy && !showBand && !showBm;
    var showStatus = !hidePref && (showBand || showBm || showBusyStop || busy);
    var showAny = showBand || showBm || showBusyStop || showStatus;

    setElHidden($("bs-tb-bands-note"), !showBand);
    setElHidden($("bs-tb-band-row"), !(showBand || showBusyStop));
    setElHidden($("bs-start"), !showBand);
    setElHidden($("bs-fresh"), !showBand);
    setElHidden($("bs-jump"), !showBand);
    setElHidden($("bs-selcount"), !showBand);
    setElHidden($("bs-stop"), !(showBand || showBusyStop));
    setElHidden($("bs-tb-bm-row"), !showBm);
    setElHidden($("bs-status"), !showStatus);
    setElHidden($("bs-tb-progress"), !showStatus);
    if (tb) tb.hidden = hidePref || !showAny;
    if ($("bs-hide-toolbar")) $("bs-hide-toolbar").checked = hidePref;
  }

  function applyUiTextSize() {
    var p = $("bs-panel");
    if (!p) return;
    p.classList.remove("bs-text-sm", "bs-text-lg");
    var sz = S.uiTextSize || "default";
    if (sz === "small") p.classList.add("bs-text-sm");
    else if (sz === "large") p.classList.add("bs-text-lg");
  }

  function resetPanelLayoutDefaults() {
    if (restorePanelLayoutSnapshot()) {
      saveSettings();
      setStatus("Panel layout restored from last save.");
      return;
    }
    S.panelW = 0;
    S.panelH = 0;
    S.panelLeft = null;
    S.panelTop = null;
    panelLayoutUserSet = false;
    saveSettings();
    applyPanelLayout();
    setStatus("No saved layout — using waterfall default.");
  }

  function writePanelLayoutSnapshot() {
    try {
      if (!(Number(S.panelW) > 40 && Number(S.panelH) > 40)) return;
      window.localStorage.setItem(LS_PANEL_LAYOUT, JSON.stringify({
        panelW: Math.round(S.panelW),
        panelH: Math.round(S.panelH),
        panelLeft: typeof S.panelLeft === "number" ? Math.round(S.panelLeft) : null,
        panelTop: typeof S.panelTop === "number" ? Math.round(S.panelTop) : null
      }));
    } catch (e) {}
  }

  function readPanelLayoutSnapshot() {
    try {
      var raw = window.localStorage.getItem(LS_PANEL_LAYOUT);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !(Number(o.panelW) > 40) || !(Number(o.panelH) > 40)) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function restorePanelLayoutSnapshot() {
    var o = readPanelLayoutSnapshot();
    if (!o) return false;
    S.panelW = Number(o.panelW);
    S.panelH = Number(o.panelH);
    S.panelLeft = typeof o.panelLeft === "number" && isFinite(o.panelLeft) ? o.panelLeft : null;
    S.panelTop = typeof o.panelTop === "number" && isFinite(o.panelTop) ? o.panelTop : null;
    panelLayoutUserSet = true;
    applyPanelLayout();
    return true;
  }

  function savePanelLayoutManual() {
    savePanelLayout();
    writePanelLayoutSnapshot();
    setStatus("Panel layout saved — factory reset will restore this size and position.");
  }

  function applyWaterfallPanelDefault() {
    S.panelW = 0;
    S.panelH = 0;
    S.panelLeft = null;
    S.panelTop = null;
    panelLayoutUserSet = false;
    saveSettings();
    applyPanelLayout();
    setStatus("Panel layout set to waterfall default.");
  }

  function settingsDefaults() {
    return {
      selected: null,
      passes: 2,
      dwell: 2.5,
      minHits: 3,
      threshDb: 7,
      autoBm: true,
      hideAuto: false,
      mute: true,
      hideSpurs: true,
      widebandPeaks: true,
      ignoredFreqs: [],
      scanAfter: false,
      listenSec: 4,
      holdBusy: true,
      continuousBmScan: true,
      recordBusy: false,
      recMode: REC_MODE_ORIGINAL,
      recSquelchOnly: true,
      recMinSnrDb: 0,
      recSquelchHeadroomDb: 0,
      recMinClipRatioPct: 0,
      recDebounceMs: 0,
      recQuietMs: 0,
      notifyNew: true,
      aloneOnly: true,
      lockoutMin: 30,
      scheduleHrs: 0,
      priority: "121.5",
      ownRadio: false,
      seenHelp: false,
      autoOpenPanel: false,
      panelW: 0,
      panelH: 0,
      panelLeft: null,
      panelTop: null,
      splitPct: 62,
      leftSplitPct: 58,
      rightSplit1: 28,
      rightSplit2: 52,
      rightSplit3: 76,
      rangeStartMhz: 109,
      rangeEndMhz: 200,
      rangeStepKhz: 0,
      rangeOffsetKhz: 0,
      rangeChannelGrid: false,
      rangeGridPreset: "auto",
      rangeMode: "full",
      exploreStepKhz: 12.5,
      exploreOffsetKhz: 0,
      rememberTab: true,
      defaultTab: "last",
      switchPeaksOnDone: false,
      notifyScanDone: false,
      soundNewPeak: true,
      schedAction: "band",
      schedIdleOnly: false,
      quietStart: "",
      quietEnd: "",
      pauseOnManualTune: false,
      profileSettleMs: 0,
      maxPeaks: 0,
      keepPeaks: true,
      maxAudioClips: 40,
      clipPreviewSec: 3,
      clipVolume: 80,
      loadUserBmBands: [],
      extras: null,
      maxClipSec: 60,
      listenScanOrder: "priority",
      showNewOnly: false,
      showDiffOnly: false,
      webhookUrl: "",
      copyPeaksOnDone: false,
      alertFreqs: "",
      alertOffsetKhz: 25,
      digiLongDwell: true,
      digiDwellSec: 90,
      digiForceMode: "ft8",
      digiForceOn: false,
      dayNightBeforeSched: false,
      peaksView: "list",
      occDays: 7,
      uiTextSize: "default",
      hideToolbar: false,
      saStartMhz: 88,
      saEndMhz: 108,
      saFollowTile: false,
      saPeakHold: true,
      saAvg: true,
      saAvgN: 6,
      saAutoDb: true,
      saDbMin: -100,
      saDbMax: -20,
      saHopMs: 450,
      saLiveOnOpen: false,
      hiddenTabs: ["analyzer"],
      analyzerTabMigrated: true
    };
  }

  function exportSettingsJson() {
    readForm();
    var out = {};
    var d = settingsDefaults();
    Object.keys(d).forEach(function (k) {
      if (k === "ignoredFreqs") out[k] = (S.ignoredFreqs || []).slice();
      else if (k === "hiddenTabs") out[k] = (S.hiddenTabs || []).slice();
      else out[k] = S[k];
    });
    downloadFile(LS_SETTINGS_FILE, JSON.stringify(out, null, 2), "application/json");
    setStatus("Exported settings JSON.");
  }

  function fillSettingsForm() {
    if ($("bs-remember-tab")) $("bs-remember-tab").checked = S.rememberTab !== false;
    if ($("bs-default-tab")) $("bs-default-tab").value = S.defaultTab || "last";
    syncPairChk("bs-switch-peaks", "bs-range-switch-peaks", !!S.switchPeaksOnDone);
    syncPairChk("bs-notify-done", "bs-range-notify-done", !!S.notifyScanDone);
    syncPairChk("bs-sound-peak", "bs-range-sound-peak", S.soundNewPeak !== false);
    syncPairChk("bs-copy-done", "bs-range-copy-done", !!S.copyPeaksOnDone);
    syncPairChk("bs-notify", "bs-range-notify", S.notifyNew !== false);
    syncPairChk("bs-pause-tune", "bs-range-pause-tune", !!S.pauseOnManualTune);
    syncPairNum("bs-settle-ms", "bs-range-settle-ms", S.profileSettleMs || 0);
    if ($("bs-sched-action")) $("bs-sched-action").value = S.schedAction || "band";
    if ($("bs-sched-idle")) $("bs-sched-idle").checked = !!S.schedIdleOnly;
    if ($("bs-quiet-start")) $("bs-quiet-start").value = S.quietStart || "";
    if ($("bs-quiet-end")) $("bs-quiet-end").value = S.quietEnd || "";
    if ($("bs-max-peaks")) $("bs-max-peaks").value = S.maxPeaks || 0;
    if ($("bs-keep-peaks")) $("bs-keep-peaks").checked = S.keepPeaks !== false;
    if ($("bs-max-clips")) $("bs-max-clips").value = S.maxAudioClips || 40;
    if ($("bs-webhook")) $("bs-webhook").value = S.webhookUrl || "";
    if ($("bs-alert-freqs")) $("bs-alert-freqs").value = S.alertFreqs || "";
    if ($("bs-alert-offset")) $("bs-alert-offset").value = S.alertOffsetKhz || 25;
    if ($("bs-digi-long")) $("bs-digi-long").checked = S.digiLongDwell !== false;
    if ($("bs-digi-force")) $("bs-digi-force").checked = !!S.digiForceOn;
    if ($("bs-digi-dwell")) $("bs-digi-dwell").value = S.digiDwellSec || 90;
    if ($("bs-digi-mode")) $("bs-digi-mode").value = S.digiForceMode || "ft8";
    if ($("bs-daynight-sched")) $("bs-daynight-sched").checked = !!S.dayNightBeforeSched;
    if ($("bs-occ-days")) $("bs-occ-days").value = S.occDays || 7;
    if ($("bs-text-size")) $("bs-text-size").value = S.uiTextSize || "default";
    if ($("bs-autoopen")) $("bs-autoopen").checked = !!S.autoOpenPanel;
    if ($("bs-hide-toolbar")) $("bs-hide-toolbar").checked = !!S.hideToolbar;
    if ($("bs-ex-step")) $("bs-ex-step").value = S.exploreStepKhz > 0 ? S.exploreStepKhz : 12.5;
    if ($("bs-ex-offset")) $("bs-ex-offset").value = S.exploreOffsetKhz || 0;
    fillExtrasForm();
    fillVisibleTabsForm();
    applyToolbarVisibility();
    applyExtrasUi();
    syncAloneUi(S.aloneOnly !== false);
    if ($("bs-sched")) $("bs-sched").value = S.scheduleHrs || 0;
    applyUiTextSize();
  }

  function importSettingsMerge(obj) {
    if (!obj || typeof obj !== "object") return false;
    var d = settingsDefaults();
    Object.keys(d).forEach(function (k) {
      if (typeof obj[k] === "undefined") return;
      if (k === "ignoredFreqs") {
        S.ignoredFreqs = Array.isArray(obj[k]) ? obj[k].slice() : S.ignoredFreqs;
      } else if (k === "hiddenTabs") {
        S.hiddenTabs = Array.isArray(obj[k]) ? obj[k].slice() : S.hiddenTabs;
      } else if (k === "extras") {
        S.extras = sanitizeExtras(obj[k]);
      } else {
        S[k] = obj[k];
      }
    });
    S = sanitizeLayoutSettings(S);
    saveSettings();
    fillSettingsForm();
    applyHiddenTabs();
    applyToolbarVisibility();
    applySchedule();
    renderBookmarkPane();
    updateTabLabels();
    return true;
  }

  function resetSettingsToDefaults() {
    if (!window.confirm("Reset all Band survey settings to defaults? Peak list and bookmarks are kept.")) return;
    var keepSelected = S.selected;
    var keepIgnored = (S.ignoredFreqs || []).slice();
    var d = settingsDefaults();
    Object.keys(d).forEach(function (k) {
      if (k === "ignoredFreqs") S.ignoredFreqs = keepIgnored;
      else S[k] = d[k];
    });
    if (keepSelected) S.selected = keepSelected;
    saveSettings();
    fillSettingsForm();
    if ($("bs-passes")) $("bs-passes").value = S.passes;
    if ($("bs-range-passes")) $("bs-range-passes").value = S.passes;
    if ($("bs-dwell")) $("bs-dwell").value = S.dwell;
    if ($("bs-minhits")) $("bs-minhits").value = S.minHits;
    if ($("bs-thresh")) $("bs-thresh").value = S.threshDb;
    syncRangeScanOptsUi();
    applySchedule();
    applyPanelLayout();
    applyHiddenTabs();
    applyToolbarVisibility();
    applyBtnShades();
    setStatus("Settings reset to defaults.");
  }

  function factoryReset() {
    if (!window.confirm(
      "Factory reset Band survey (SV)?\n\n" +
      "This browser will lose peaks, bookmarks, audio clips, skip list, Explore state, and settings. Saved panel layout (position/size) and the last range spectrum chart are kept. OpenWebRX server bookmarks are not changed.\n\n" +
      "Export settings first if you want a backup."
    )) return;
    doFactoryReset();
  }

  function doFactoryReset() {
    if (typeof saStop === "function") saStop();
    if (typeof stopClipPreview === "function") stopClipPreview({ silent: true });
    else if (typeof stopClipPlayback === "function") stopClipPlayback();
    hits = [];
    tileLooks = {};
    _hitsLoaded = false;
    _hitsClassified = false;
    loadedBookmarks = [];
    audioClips = [];
    try {
      if (typeof BookmarkLocalStorage === "function") {
        var store = (window.bookmarks && bookmarks.localBookmarks) || new BookmarkLocalStorage();
        store.setBookmarks([]);
        if (window.bookmarks && typeof bookmarks.loadLocalBookmarks === "function") {
          bookmarks.loadLocalBookmarks();
        }
      }
    } catch (eBm) {}
    try {
      window.localStorage.removeItem(LS);
      window.localStorage.removeItem(LS_HITS);
      window.localStorage.removeItem(LS_SNAP);
      window.localStorage.removeItem(LS_LOCK);
      window.localStorage.removeItem(LS_BM_FIRST);
      window.localStorage.removeItem(LS_BM_LAST);
      window.localStorage.removeItem(LS_LOADED_BM);
      window.localStorage.removeItem(LS_CLIP_SEQ);
      window.localStorage.removeItem(LS_CHECK_DISMISS);
      window.localStorage.removeItem(LS_REC_MIGRATE);
      window.localStorage.removeItem(LS_EXPLORE);
      window.localStorage.removeItem(LS_EXPLORE_MM);
      window.localStorage.removeItem(SS_TAB);
      sessionStorage.removeItem(SS_TAB);
    } catch (e) {}
    clearAllPersistedAudioClips().then(function () {
      S = loadSettings();
      panelLayoutUserSet = false;
      explore.on = false;
      explore.minimapOn = false;
      explore.overview = null;
      fillSettingsForm();
      if ($("bs-passes")) $("bs-passes").value = S.passes;
      if ($("bs-range-passes")) $("bs-range-passes").value = S.passes;
      if ($("bs-dwell")) $("bs-dwell").value = S.dwell;
      if ($("bs-minhits")) $("bs-minhits").value = S.minHits;
      if ($("bs-thresh")) $("bs-thresh").value = S.threshDb;
      syncRangeScanOptsUi();
      renderHits();
      renderBookmarkPane();
      renderAudioClips();
      updateTabLabels();
      if (!restorePanelLayoutSnapshot()) applyPanelLayout();
      restoreRangeSpectrumView();
      applySchedule();
      if (typeof setExploreMode === "function") setExploreMode(false);
      if (typeof setExploreMinimap === "function") setExploreMinimap(false);
      applyBtnShades();
      switchTab("bands");
      setStatus("Factory reset complete — SV restored to defaults (panel layout from last save).");
    });
  }

  function clearAllPluginData() {
    factoryReset();
  }

  function onSurveyComplete(fin, stopped) {
    if (stopped) return;
    if (S.notifyScanDone) notifyScanComplete(fin.doneStatus);
    if (S.switchPeaksOnDone) switchTab("peaks");
    if (S.copyPeaksOnDone) copyResults();
    if (extraOn("occHeatmap") && S.peaksView === "heatmap") renderOccHeatmap();
  }

  function runScheduledScan() {
    if (running || listenScanRunning) return;
    if (inQuietHours()) return;
    if (receiverRecentlyActive()) return;
    if (extraOn("dayNightBands") && S.dayNightBeforeSched) {
      var hour = new Date().getHours();
      var day = hour >= 8 && hour < 20;
      applyPreset(day ? "hfday" : "hfnight");
      setStatus("Scheduled: applied HF " + (day ? "day" : "night") + " band set.");
    }
    var action = S.schedAction || "band";
    if (action === "bookmark" || action === "both") {
      if (action === "both") {
        runSurvey(false).then(function () {
          if (!running && !listenScanRunning) startListenScan();
        }).catch(function () {});
        return;
      }
      startListenScan();
      return;
    }
    runSurvey(false);
  }

  var recordingOn = false;
  var audioClips = [];
  var clipSeq = 1;
  var clipPlaying = null;
  var clipPreview = { running: false, index: 0, timer: null, gen: 0 };
  var recCap = { rec: null, chunks: [], meta: null, mime: "", usingOwrx: false };
  var IDB_AUDIO = "owrx_band_survey_audio_v1";
  var IDB_AUDIO_STORE = "clips";
  var LS_CLIP_SEQ = "owrx_band_survey_clip_seq_v1";
  var MAX_AUDIO_CLIPS = 40;
  var MAX_AUDIO_STORE_BYTES = 48 * 1024 * 1024;
  var idbAudioPromise = null;
  var pendingAudioWrites = [];

  try {
    var csRaw = window.localStorage.getItem(LS_CLIP_SEQ);
    if (csRaw) {
      var cs = parseInt(csRaw, 10);
      if (cs > 0) clipSeq = cs;
    }
  } catch (eCs) {}

  function warnAudioIdb(msg, err) {
    try {
      if (err) console.warn("[band_survey] " + msg, err);
      else console.warn("[band_survey] " + msg);
    } catch (eLog) {}
  }

  function idbReq(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("IndexedDB request failed")); };
    });
  }

  function idbTxDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error || new Error("IndexedDB transaction failed")); };
      tx.onabort = function () { reject(tx.error || new Error("IndexedDB transaction aborted")); };
    });
  }

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

  function openAudioDb() {
    if (idbAudioPromise) return idbAudioPromise;
    idbAudioPromise = new Promise(function (resolve) {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      try {
        var req = indexedDB.open(IDB_AUDIO, 1);
        req.onupgradeneeded = function (ev) {
          var db = ev.target.result;
          if (!db.objectStoreNames.contains(IDB_AUDIO_STORE)) {
            db.createObjectStore(IDB_AUDIO_STORE, { keyPath: "id" });
          }
        };
        req.onsuccess = function (ev) { resolve(ev.target.result); };
        req.onerror = function (ev) {
          warnAudioIdb("audio IndexedDB open failed", ev && ev.target && ev.target.error);
          resolve(null);
        };
        req.onblocked = function () {
          warnAudioIdb("audio IndexedDB open blocked — close other tabs using this site");
        };
      } catch (e) {
        warnAudioIdb("audio IndexedDB unavailable", e);
        resolve(null);
      }
    });
    return idbAudioPromise;
  }

  function saveClipSeq() {
    try { window.localStorage.setItem(LS_CLIP_SEQ, String(clipSeq)); } catch (e) {}
  }

  function clipToRecord(clip) {
    return {
      id: clip.id,
      freq: clip.freq || 0,
      name: clip.name || "",
      pid: clip.pid || "",
      at: clip.at || Date.now(),
      file: clip.file || "",
      mime: clip.mime || "audio/webm",
      ext: clip.ext || "webm",
      loaded: !!clip.loaded,
      blob: clip.blob
    };
  }

  function persistAudioClip(clip) {
    if (!clip || !clip.blob) return Promise.resolve(false);
    var p = openAudioDb().then(function (db) {
      if (!db) {
        warnAudioIdb("audio clip not saved — IndexedDB unavailable");
        return false;
      }
      try {
        var tx = db.transaction(IDB_AUDIO_STORE, "readwrite");
        tx.objectStore(IDB_AUDIO_STORE).put(clipToRecord(clip));
        return idbTxDone(tx).then(function () { return true; });
      } catch (e) {
        warnAudioIdb("audio clip save failed", e);
        return false;
      }
    }).catch(function (e) {
      warnAudioIdb("audio clip save failed", e);
      return false;
    });
    pendingAudioWrites.push(p);
    p.finally(function () {
      pendingAudioWrites = pendingAudioWrites.filter(function (x) { return x !== p; });
    });
    return p;
  }

  function deletePersistedClip(id) {
    return openAudioDb().then(function (db) {
      if (!db) return false;
      try {
        var tx = db.transaction(IDB_AUDIO_STORE, "readwrite");
        tx.objectStore(IDB_AUDIO_STORE).delete(id);
        return idbTxDone(tx).then(function () { return true; });
      } catch (e) {
        warnAudioIdb("audio clip delete failed", e);
        return false;
      }
    }).catch(function (e) {
      warnAudioIdb("audio clip delete failed", e);
      return false;
    });
  }

  function clearAllPersistedAudioClips() {
    return openAudioDb().then(function (db) {
      if (!db) return false;
      try {
        var tx = db.transaction(IDB_AUDIO_STORE, "readwrite");
        tx.objectStore(IDB_AUDIO_STORE).clear();
        return idbTxDone(tx).then(function () { return true; });
      } catch (e) {
        warnAudioIdb("audio clip clear failed", e);
        return false;
      }
    }).catch(function (e) {
      warnAudioIdb("audio clip clear failed", e);
      return false;
    });
  }

  function totalAudioBytes() {
    var n = 0;
    for (var i = 0; i < audioClips.length; i++) {
      if (audioClips[i].blob) n += audioClips[i].blob.size || 0;
    }
    return n;
  }

  function trimAudioStorage() {
    while (audioClips.length > maxAudioClipsCap() || totalAudioBytes() > MAX_AUDIO_STORE_BYTES) {
      var drop = audioClips.pop();
      if (!drop) break;
      if (drop.url) {
        try { URL.revokeObjectURL(drop.url); } catch (e) {}
      }
      deletePersistedClip(drop.id);
    }
  }

  function blobFromRecord(r) {
    if (!r) return null;
    var b = r.blob;
    if (!b) return null;
    if (b instanceof Blob) return b;
    var mime = r.mime || "audio/webm";
    if (b instanceof ArrayBuffer) return new Blob([b], { type: mime });
    if (typeof Uint8Array !== "undefined" && b instanceof Uint8Array) {
      return new Blob([b], { type: mime });
    }
    return null;
  }

  function clipFromRecord(r) {
    var blob = blobFromRecord(r);
    if (!r || !blob) return null;
    var url = URL.createObjectURL(blob);
    return {
      id: r.id,
      freq: r.freq || 0,
      name: r.name || "",
      pid: r.pid || "",
      at: r.at || Date.now(),
      file: r.file || "",
      blob: blob,
      url: url,
      mime: r.mime || "audio/webm",
      ext: r.ext || "webm",
      loaded: !!r.loaded
    };
  }

  function loadPersistedAudioClips(cb) {
    openAudioDb().then(function (db) {
      if (!db) {
        warnAudioIdb("audio clips not restored — IndexedDB unavailable");
        if (cb) cb();
        return;
      }
      var tx;
      try {
        tx = db.transaction(IDB_AUDIO_STORE, "readonly");
      } catch (e) {
        warnAudioIdb("audio clip load failed", e);
        if (cb) cb();
        return;
      }
      idbReq(tx.objectStore(IDB_AUDIO_STORE).getAll()).then(function (rows) {
        rows = rows || [];
        rows.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
        audioClips = [];
        var maxId = clipSeq - 1;
        var skipped = 0;
        rows.forEach(function (r) {
          var c = clipFromRecord(r);
          if (!c) {
            skipped++;
            return;
          }
          audioClips.push(c);
          if (c.id >= maxId) maxId = c.id;
        });
        if (skipped) warnAudioIdb("skipped " + skipped + " audio clip(s) with missing blob data");
        if (maxId >= clipSeq) clipSeq = maxId + 1;
        saveClipSeq();
        trimAudioStorage();
        if (cb) cb();
      }).catch(function (e) {
        warnAudioIdb("audio clip load failed", e);
        if (cb) cb();
      });
    });
  }

  function addAudioClip(clip) {
    audioClips.unshift(clip);
    saveClipSeq();
    trimAudioStorage();
    renderAudioClips();
    return persistAudioClip(clip);
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
    var activeMs = Number(meta.activeMs) || 0;
    var durationMs = Number(meta.durationMs) || 0;
    var gate = recGateParams();
    if (gate.discardWeak) {
      if (activeMs < gate.minActiveMs) return;
      if (durationMs > 0 && activeMs / durationMs < gate.minActiveRatio) return;
    }
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
      loaded: false,
      durationMs: durationMs,
      activeMs: activeMs
    };
    addAudioClip(clip).then(function (ok) {
      if (!ok) setStatus("Clip added but browser storage failed — use Save on the clip before refresh.");
    });
    setStatus("Saved clip · " + (clip.name || fmtMhz(clip.freq)) + " · Audio clips on the right.");
  }

  function pauseBusyCapture() {
    var rec = recCap.rec;
    if (rec && rec.state === "recording" && typeof rec.pause === "function") {
      try { rec.pause(); } catch (e) {}
    }
  }

  function resumeBusyCapture() {
    var rec = recCap.rec;
    if (rec && rec.state === "paused" && typeof rec.resume === "function") {
      try { rec.resume(); } catch (e) {}
    }
  }

  function stopBusyCapture() {
    var rec = recCap.rec;
    if (rec) {
      recCap.rec = null;
      try {
        rec.onstop = function () { finishClipFromChunks(); };
        if (rec.state === "paused" && typeof rec.resume === "function") rec.resume();
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
      runScheduledScan();
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
      setStatus("No user bookmarks to clear.");
      return;
    }
    if (!window.confirm("Remove all " + loadedBookmarks.length + " user/[load] bookmark(s)? Local blue bookmarks are not touched.")) return;
    loadedBookmarks = [];
    saveLoadedBookmarks();
    renderBookmarkPane();
    setStatus("Cleared user bookmarks.");
  }

  function scanTargetItems(allBookmarks) {
    if (!allBookmarks && lastCreated.length) return lastCreated.slice();
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

  function bandSurveyAssetUrl(name) {
    try {
      var scripts = document.getElementsByTagName("script");
      var i;
      for (i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || "";
        if (/\/band_survey\.js(\?|$)/.test(src)) {
          return src.replace(/band_survey\.js(\?.*)?$/, name);
        }
      }
    } catch (e) {}
    return "static/plugins/receiver/band_survey/" + name;
  }

  function collectOwrxClientBookmarks() {
    var rows = [];
    var seen = {};
    function add(list) {
      (list || []).forEach(function (b) {
        var n = normalizeLoadedBookmark(b);
        if (!n || seen[n.frequency]) return;
        seen[n.frequency] = true;
        rows.push(n);
      });
    }
    add(localBookmarkList());
    try {
      if (window.bookmarks && bookmarks.bookmarks) {
        add(bookmarks.bookmarks.server);
        add(bookmarks.bookmarks.local);
      }
    } catch (e) {}
    try {
      if (window.bookmarks && typeof bookmarks.getAllBookmarks === "function") {
        add(bookmarks.getAllBookmarks());
      }
    } catch (e2) {}
    try {
      var raw = window.localStorage.getItem("bookmarks");
      if (raw) add(JSON.parse(raw));
    } catch (e3) {}
    return rows;
  }

  function loadUserBmSelectedValues() {
    var box = $("bs-bm-loaduser-bands");
    if (box) {
      var allCb = $("bs-bm-lu-allbands");
      if (allCb && allCb.checked) return [];
      return Array.prototype.map.call(box.querySelectorAll("input.bs-bm-lu-band:checked"), function (el) {
        return el.value;
      }).filter(Boolean);
    }
    return Array.isArray(S.loadUserBmBands) ? S.loadUserBmBands.slice() : [];
  }

  function setLoadUserBmSelection(values) {
    var box = $("bs-bm-loaduser-bands");
    var allCb = $("bs-bm-lu-allbands");
    var set = {};
    (values || []).forEach(function (v) { set[v] = true; });
    var useAll = !values || !values.length;
    if (allCb) allCb.checked = useAll;
    if (box) {
      Array.prototype.forEach.call(box.querySelectorAll("input.bs-bm-lu-band"), function (el) {
        el.checked = !useAll && !!set[el.value];
        el.disabled = useAll;
      });
    }
    S.loadUserBmBands = useAll ? [] : Object.keys(set);
  }

  function fillLoadUserBmBandSelect() {
    var box = $("bs-bm-loaduser-bands");
    if (!box) return;
    var prev = Array.isArray(S.loadUserBmBands) ? S.loadUserBmBands.slice() : [];
    var useAll = !prev.length;
    var list = profiles();
    var allCb = $("bs-bm-lu-allbands");
    if (allCb) allCb.checked = useAll;
    if (!list.length) {
      box.innerHTML = '<p class="bs-empty">No profiles yet — wait for the radio to connect.</p>';
      return;
    }
    var set = {};
    prev.forEach(function (v) { set[v] = true; });
    box.innerHTML = "";
    list.forEach(function (p) {
      var lab = document.createElement("label");
      lab.className = "bs-chk";
      lab.title = "Include bookmarks in this band when loading user bookmarks.";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "bs-bm-lu-band";
      cb.value = p.value;
      cb.checked = !useAll && !!set[p.value];
      cb.disabled = useAll;
      var id = document.createElement("span");
      id.className = "bs-id";
      id.textContent = p.id || "";
      var name = document.createElement("span");
      name.textContent = p.label || p.value;
      lab.appendChild(cb);
      if (p.id) lab.appendChild(id);
      lab.appendChild(name);
      box.appendChild(lab);
    });
    S.loadUserBmBands = useAll ? [] : prev.filter(function (v) { return set[v]; });
  }

  function onLoadUserBmBandsClick(ev) {
    var t = ev.target;
    if (!t) return;
    if (t.id === "bs-bm-lu-allbands") {
      if (t.checked) setLoadUserBmSelection([]);
      else {
        /* turning All off with nothing else ticked — leave empty until user ticks */
        var box = $("bs-bm-loaduser-bands");
        if (box) {
          Array.prototype.forEach.call(box.querySelectorAll("input.bs-bm-lu-band"), function (el) {
            el.disabled = false;
          });
        }
        S.loadUserBmBands = [];
      }
      saveSettings();
      return;
    }
    if (t.classList && t.classList.contains("bs-bm-lu-band")) {
      var allCb = $("bs-bm-lu-allbands");
      if (allCb) allCb.checked = false;
      S.loadUserBmBands = loadUserBmSelectedValues();
      saveSettings();
    }
  }

  function applyLoadUserBmPreset(kind) {
    if (kind === "all") {
      setLoadUserBmSelection([]);
      try { saveSettings(); } catch (e) {}
      return;
    }
    if (kind === "current") {
      var cur = currentProfileValue();
      setLoadUserBmSelection(cur ? [cur] : []);
      try { saveSettings(); } catch (e2) {}
      return;
    }
    if (kind === "ticked") {
      var chosen = selectedValues();
      if (!chosen.length && S.selected && S.selected.length) chosen = S.selected.slice();
      setLoadUserBmSelection(chosen.length ? chosen : []);
      try { saveSettings(); } catch (e3) {}
    }
  }

  function rangesForLoadUserBmBands(values) {
    values = values || [];
    if (!values.length) return { ranges: null, label: "all bands" };
    var list = profiles();
    var byVal = {};
    list.forEach(function (p) { byVal[p.value] = p; });
    var ranges = [];
    var labels = [];
    values.forEach(function (v) {
      var p = byVal[v];
      if (!p) return;
      var r = parseMhzRange(p.label);
      if (!r) return;
      ranges.push(r);
      labels.push(p.id || p.label || p.value);
    });
    if (!ranges.length) {
      return { ranges: [], label: values.length + " band(s) (no MHz ranges)" };
    }
    if (labels.length <= 3) {
      return { ranges: ranges, label: labels.join(", ") };
    }
    return {
      ranges: ranges,
      label: labels.length + " bands (" + labels.slice(0, 2).join(", ") + "…)"
    };
  }

  function filterBookmarksByRanges(rows, ranges) {
    if (!ranges) return rows.slice();
    return (rows || []).filter(function (b) {
      var f = Number(b && b.frequency);
      if (!f) return false;
      for (var i = 0; i < ranges.length; i++) {
        var lo = ranges[i].lo * 1e6;
        var hi = ranges[i].hi * 1e6;
        if (f >= lo && f <= hi) return true;
      }
      return false;
    });
  }

  function loadUserBookmarksFromStore() {
    fillLoadUserBmBandSelect();
    var allCb = $("bs-bm-lu-allbands");
    var values = loadUserBmSelectedValues();
    if ((!allCb || !allCb.checked) && !values.length) {
      setStatus("Tick All bands, or tick one or more bands below, then Load user bookmarks.");
      return;
    }
    S.loadUserBmBands = values.slice();
    try { saveSettings(); } catch (eSave) {}
    var scopeInfo = rangesForLoadUserBmBands(values);
    function finish(rows, source) {
      var filtered = filterBookmarksByRanges(rows, scopeInfo.ranges);
      if (!rows || !rows.length) {
        setStatus("No OpenWebRX user bookmarks found (browser localStorage / server list empty).");
        return;
      }
      if (!filtered.length) {
        setStatus("No bookmarks in " + scopeInfo.label + " (" + rows.length + " total available). Tick other bands or All bands.");
        return;
      }
      applyLoadedBookmarks(filtered, (source || "OpenWebRX") + " · " + scopeInfo.label);
      if (filtered.length < rows.length) {
        setStatus("Loaded " + filtered.length + " of " + rows.length + " bookmark(s) for " + scopeInfo.label + ".");
      }
    }
    var clientRows = collectOwrxClientBookmarks();
    var url = bandSurveyAssetUrl("owrx-bookmarks.json");
    if (typeof fetch !== "function") {
      finish(clientRows, "OpenWebRX");
      return;
    }
    setStatus("Loading OpenWebRX bookmarks (" + scopeInfo.label + ")…");
    fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("no file");
      return r.json();
    }).then(function (data) {
      var arr = Array.isArray(data) ? data : (data && Array.isArray(data.bookmarks) ? data.bookmarks : []);
      var rows = arr.map(normalizeLoadedBookmark).filter(Boolean);
      var seen = {};
      rows.forEach(function (b) { seen[b.frequency] = true; });
      clientRows.forEach(function (b) {
        if (!seen[b.frequency]) rows.push(b);
      });
      finish(rows, "OpenWebRX storage");
    }).catch(function () {
      finish(clientRows, "OpenWebRX");
    });
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
        "Wait ~10 seconds for the radio to connect, then click Settings → Check install. If it stays empty, add SDR profiles in OpenWebRX settings (admin).");
    }
    if (sel && !c.profileHop) {
      add("warn", "Cannot hop profiles from the plugin.",
        "Survey can still count peaks on the current tile. Profile hopping needs a stock OpenWebRX+ receiver page (sdr_profile_changed).");
    }
    if (!c.waterfall) {
      add(c.receiver ? "warn" : "error", "No waterfall data yet.",
        "Wait a few seconds after the radio connects, then click Settings → Check install again. A black waterfall usually means the SDR is not started. Stay on the receiver page (not the map hub).");
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

  function buildDiagnosticReport() {
    var lines = [];
    function L(s) { lines.push(String(s || "")); }
    L("Band survey — browser diagnostic report");
    L("Generated: " + new Date().toISOString());
    L("Plugin v" + (Plugins.band_survey._version || "?"));
    L("Page: " + (location.href || ""));
    L("User-Agent: " + (navigator.userAgent || ""));
    L("Platform: " + (navigator.platform || "") + "  language=" + (navigator.language || ""));
    L("Viewport: " + window.innerWidth + "x" + window.innerHeight);
    L("");
    var issues = diagnose();
    L("=== Checks ===");
    issues.forEach(function (x) {
      L((x.level || "info").toUpperCase() + ": " + x.title);
      L("  Fix: " + x.fix);
    });
    L("");
    L("=== Page state ===");
    L("SV panel: " + ($("bs-panel") ? "present" : "missing"));
    L("SV toggle: " + ($("bs-toggle-btn") ? "present" : "missing"));
    L("Receiver panel: " + ($("openwebrx-panel-receiver") ? "present" : "missing"));
    L("Profiles: " + (profiles().length || 0));
    L("Stored peaks: " + hits.length + " (loaded=" + (_hitsLoaded ? "yes" : "no") + ")");
    L("Plugins loader: " + !!(window.Plugins && Plugins.load));
    L("");
    L("Send with server report from: ./install.sh --report");
    return lines.join("\n");
  }

  function copyDiagnosticReport() {
    var text = buildDiagnosticReport();
    function ok() { setStatus("Diagnostic report copied. Paste into email or chat."); }
    function fail() {
      setStatus("Could not copy — use the prompt to copy manually.");
      try { prompt("Copy this diagnostic report:", text); } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else {
      fail();
    }
  }

  function renderIssueP(x) {
    var tag = x.level === "error" ? "Needs a fix: " : x.level === "warn" ? "Note: " : "Optional: ";
    return "<p><b>" + tag + escapeHtml(x.title) + "</b><br>" + escapeHtml(x.fix) + "</p>";
  }

  function runCheckInstall() {
    var issues = renderHealth({ all: true, toast: true, ok: true });
    var hard = issues.filter(function (x) { return x.level === "error"; }).length;
    var warns = issues.filter(function (x) { return x.level === "warn"; }).length;
    var extras = issues.filter(function (x) { return x.level === "info"; }).length;
    if (!hard && !warns) {
      setStatus("Install looks good. Top-bar Survey is this plugin. Orange SV only appears if the top bar is missing.");
    } else {
      setStatus((hard ? hard + " problem" + (hard === 1 ? "" : "s") + " to fix. " : "No blockers. ") +
        (warns ? warns + " note" + (warns === 1 ? "" : "s") + ". " : "") +
        (extras ? extras + " optional extra" + (extras === 1 ? "" : "s") + ". " : "") +
        "Read the box on Settings, or open Help.");
    }
    return issues;
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
      html += "<p><b>Install looks good.</b> Top-bar <b>Survey</b> is this plugin (orange <b>SV</b> only if the top bar is missing). Tick bands (or Air / VHF voice / All VHF / All UHF / Ham) and press Scan bands. Help is on the Help tab.</p>";
    }
    html += hard.concat(warns).map(renderIssueP).join("");
    if (showExtra && extras.length) {
      html += "<p class=\"bs-health-opt-h\">Optional extras (not required)</p>" + extras.map(renderIssueP).join("");
    }
    html += '<p><button type="button" class="bs-tiny bs-btn-info" id="bs-health-help" title="Open the Help tab.">Open Help</button></p>';
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
    return (action || "That") + " failed: " + msg + ". Open Settings → Check install, or the Help tab.";
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
    setOpt("bs-band-alone", c.clients, "Courtesy / alone check unavailable — client count bar not found.");
    setOpt("bs-range-alone", c.clients, "Courtesy / alone check unavailable — client count bar not found.");
    applyOwnerLock();
  }

  function applyOwnerLock() {
    var el = $("bs-ownradio");
    var rangeEl = $("bs-range-ownradio");
    var lab = el && el.parentElement;
    var rangeLab = rangeEl && rangeEl.parentElement;
    var hint = $("bs-hophint");
    if (!ownerOverrideAllowed()) {
      S.ownRadio = false;
      if (el) {
        el.checked = false;
        el.disabled = true;
      }
      if (rangeEl) {
        rangeEl.checked = false;
        rangeEl.disabled = true;
      }
      if (lab) {
        lab.hidden = true;
        lab.title = "The site operator locked fast hops on this receiver.";
      }
      if (rangeLab) {
        rangeLab.hidden = true;
        rangeLab.title = "The site operator locked fast hops on this receiver.";
      }
      if (hint) hint.textContent = "busy channel waits here · same-band ~1s · other band 11s (operator locked fast hops)";
    } else if (el && lab) {
      el.disabled = false;
      lab.hidden = false;
      lab.title = "Skip the 11s wait between bands. Only on a receiver you run. Public sites can lock this off.";
      if (rangeEl && rangeLab) {
        rangeEl.disabled = false;
        rangeLab.hidden = false;
        rangeLab.title = "Skip the 11s wait between profiles. Only on a receiver you run. Public sites can lock this off.";
      }
      if (hint) hint.textContent = "busy channel waits here · same-band ~1s · other band 11s unless Own radio is on";
    }
  }

  function helpContentHtml() {
    var fastHops = ownerOverrideAllowed()
      ? "<li><b>Own radio — fast hops</b> (Bands / Range) — ~1s between profile changes instead of ~11s. Only on a receiver you run yourself; public sites can ban the client.</li>"
      : "<li><b>Fast hops locked</b> — this public receiver keeps the ~11s profile gap. Same-band hops are still ~1s.</li>";
    return (
      "<h2>Band survey — help (v126)</h2>" +
      "<h3>First 30 seconds</h3>" +
      "<ol>" +
      "<li>Hard-refresh this receiver page (<b>Ctrl+Shift+R</b> / Mac <b>Cmd+Shift+R</b>) after install or update.</li>" +
      "<li>Click <b>Survey</b> in the top bar (between <b>Help</b> and <b>Status</b>). An orange <b>SV</b> chip appears only if that top-bar button is missing (legacy / no toolbar).</li>" +
      "<li>Open <b>Settings</b> and click <b>Check install</b>. Green = ready. Red or yellow shows the fix on that tab.</li>" +
      "<li>Tick bands (or a preset) and press <b>Scan bands</b> — or use <b>Range</b> / <b>Explore</b>.</li>" +
      "<li>Hover any control for a tip (one tip at a time). Drag panel edges or the corner to resize — position and size are remembered in this browser.</li>" +
      "</ol>" +
      '<p><button type="button" class="bs-btn-info" id="bs-help-check" title="Run the same checks as Check install on the panel.">Check install now</button> ' +
      '<button type="button" class="bs-btn-util" id="bs-copy-diag" title="Copy browser/OS/page checks for troubleshooting (Mac cache issues, wrong page, etc.).">Copy diagnostic report</button></p>' +
      "<h3>What this is</h3>" +
      "<p>Standalone <b>OpenWebRX+ receiver plugin</b>. Walks ticked bands or a MHz range, counts waterfall peaks, ranks the busiest, and can bookmark them in <em>this browser</em>. Does <b>not</b> need freq_scanner, scan_hunt, uikit, or notify — those are optional if already loaded.</p>" +
      "<h3>SDR hardware (HackRF, RTL-SDR, Airspy, Lime, …)</h3>" +
      "<p>This plugin does <b>not</b> talk to USB radios directly. It uses the OpenWebRX+ receiver page: SDR <b>profiles</b>, the live <b>waterfall</b>, retune / profile hop, and local bookmarks. If OpenWebRX already drives your SDR (HackRF via Soapy, RTL-SDR, Airspy, LimeSDR, etc.) and you see a normal waterfall + profile list, Band survey works on that radio.</p>" +
      "<ul>" +
      "<li><b>Profiles must cover the MHz you scan</b> — Range / Explore / Analyzer only hop where profiles allow. One wide HackRF profile behaves differently from many narrow RTL slices.</li>" +
      "<li><b>Bandwidth comes from OpenWebRX</b> (<code>window.bandwidth</code>) — hop step and “tile” size follow the active profile, not a fixed HackRF sweep width.</li>" +
      "<li><b>Presets</b> (Air, FM, …) match common profile id/name patterns. Custom names still work — tick bands manually.</li>" +
      "<li><b>Analyzer</b> is experimental and only as good as the live OWRX waterfall (relative dB). It is <b>not</b> a standalone <code>hackrf_sweep</code> console.</li>" +
      "<li>Requires <b>OpenWebRX+</b> (plugin loader). Vanilla OpenWebRX cannot load this plugin.</li>" +
      "</ul>" +
      "<h3>Install</h3>" +
      "<p>Preferred: run <code>./install.sh</code> on the radio host (SSH). Smart checks: <code>./install.sh --check</code> or <code>./install.sh --report</code> writes a full log (Pi/Docker/Mac hints). Public site: <code>./install.sh --public</code>. On Mac: install on the Pi/server, then Cmd+Shift+R on the receiver page — use <b>Copy diagnostic report</b> below if stuck.</p>" +
      "<h3>Title bar tabs</h3>" +
      "<p><b>Bands</b> · <b>Range</b> · <b>Explore</b> · <b>Analyzer</b> (experimental, off by default) · <b>Peaks</b> · <b>Bookmarks</b> · <b>Audio</b> · <b>Skip</b> · <b>Settings</b> · <b>Help</b>. Enable Analyzer under Settings → <b>Visible tabs</b>. Settings always stays on. Drag the title bar to move the panel.</p>" +
      "<h3>Toolbar (top strip — can hide in Settings)</h3>" +
      "<ul>" +
      "<li><b>Scan bands</b> / <b>Fresh scan</b> / <b>Stop</b> / <b>Jump loudest</b> — one row on the Bands tab.</li>" +
      "<li><b>Scan bookmarks</b> / <b>Stop</b> / <b>Hold</b> / <b>Skip</b> / <b>Always skip</b> / <b>Lockout</b> — one row on the Bookmarks tab.</li>" +
      "<li><b>Scan bands</b> / <b>Scanning bands</b> — walk ticked bands; adds to Seen counts. Label changes while a band or range scan runs.</li>" +
      "<li><b>Fresh scan</b> — clear the peak list, then scan ticked bands from scratch.</li>" +
      "<li><b>Stop</b> — halt band survey, range survey, or bookmark scan. Qualified peaks found so far are auto-bookmarked when <b>Auto-bookmark actives</b> is on (same as normal scan end).</li>" +
      "<li><b>Scan bookmarks</b> / <b>Scanning bookmarks</b> — loop local and loaded bookmarks until Stop. With <b>Continuous bookmark scan</b> off and a busy channel, becomes <b>Continue scan bookmarks</b>.</li>" +
      "<li><b>Jump loudest</b> — retune to the strongest peak on <em>this waterfall tile only</em>.</li>" +
      "<li><b>Hold</b> · <b>Skip</b> · <b>Always skip</b> · <b>Lockout</b> — during bookmark scan: stay, move on, skip forever, or skip for Lockout minutes (Skip tab).</li>" +
      "</ul>" +
      "<h3>Bands tab</h3>" +
      "<ul>" +
      "<li><b>Presets</b> — <b>Air</b>, <b>VHF voice</b>, <b>All VHF</b> (30–300&nbsp;MHz), <b>All UHF</b> (300–1000&nbsp;MHz), <b>Ham</b>, <b>All</b>, <b>None</b>. Presets are <b>additive</b> (combine VHF+UHF; <b>None</b> clears all).</li>" +
      "<li><b>Band table</b> — tick each SDR profile to include when scanning. Columns: Id, Name, <b>Freq</b> (from the profile label), <b>Mode</b> (demod guess from the profile id). Filter box hides non-matching rows.</li>" +
      "<li><b>Band scan options</b> — <b>Passes</b> (walks per run), <b>Dwell s</b> (seconds per band), <b>Min seen</b> (qualify for auto-bookmark / Bookmark qualified), <b>dB over noise</b> (peak threshold).</li>" +
      "<li><b>Hide birdies</b> — hide always-skipped rows from the peak list.</li>" +
      "<li><b>Mute while running</b> — silence audio during band/range survey walks.</li>" +
      "<li><b>Only if alone</b> — do not retune when other listeners are online (also on Range; same setting).</li>" +
      "<li><b>After scan</b> (also on Range): Switch to Peaks, notify/copy when done, sound on new peak, notify new peak.</li>" +
      "<li><b>Scheduled scan</b> — every N hours while this browser tab stays open (band scan, bookmark scan, or both). Quiet hours and idle skip live here.</li>" +
      "<li><b>Extras (Settings)</b> — Digi/FT8 survey, HF day/night sets, band×hour heatmap, share report PNG, send-to-scanner, ←/→ during bookmark scan (with Keyboard).</li>" +
      "<li><b>Pause when I tune</b> / <b>Profile settle ms</b> — also on Range (synced).</li>" +
      fastHops +
      "</ul>" +
      "<h3>Range tab</h3>" +
      "<ul>" +
      "<li><b>Start MHz</b> / <b>End MHz</b> — sweep span (e.g. 109–200). Not tied to ticked bands; plugin picks covering profiles.</li>" +
      "<li><b>Step kHz</b> — hop size. In <b>Auto coverage</b>, <b>0</b> = ~88% of waterfall span (min 12.5&nbsp;kHz). In <b>Channel grid</b>, this is the channel spacing (e.g. 12.5 for PMR446).</li>" +
      "<li><b>Offset kHz</b> — with Channel grid on: first tune = Start + offset (PMR446: Start 446, Offset 6.25 → 446.00625).</li>" +
      "<li><b>Channel grid</b> — hop exact channel centres instead of waterfall-coverage tiles. Pick a <b>Grid preset</b> (Airband, PMR446, LPD433, Marine, 2m, 70cm, CB, FM, MW) or choose Custom and set Step/Offset yourself.</li>" +
      "<li><b>Full range (Explorer)</b> vs <b>Ticked bands only</b> — full span hops every step; bands mode only covers overlapping ticked profiles (grid N/A).</li>" +
      "<li><b>Scan range</b> — add peaks to Seen. <b>Fresh range scan</b> — clear peak list first.</li>" +
      "<li><b>Range spectrum</b> bar chart appears after a scan — kept across page reload and factory reset. Axis shows ≥12 frequency labels. <b>Save PNG</b> / <b>Save CSV</b> on the Range tab.</li>" +
      "<li><b>Passes</b>, <b>Dwell s</b>, <b>Min seen</b>, <b>dB over noise</b>, <b>Hide birdies</b>, <b>Mute while running</b>, <b>Only if alone</b>, <b>Own radio — fast hops</b>, and after-scan / pause-on-tune options on this tab (synced with Bands). <b>Stop</b> auto-bookmarks like band scan.</li>" +
      "<li><b>Spectrum map</b> — after finish or Stop: green = new, amber = seen, pink = priority; bar height = dB; click a bar to tune.</li>" +
      "</ul>" +
      "<h3>Explore tab</h3>" +
      "<ul>" +
      "<li>Grouped boxes: <b>Tune</b> (counter), <b>Profile</b> (Explore on + ◀ ▶ list — all SDR profiles, not Bands ticks), <b>VFO</b> (−/+ · step · Go MHz), <b>Receiver</b> (mode / vol / SQL / NR), <b>Actions</b>.</li>" +
      "<li>Large <b>frequency counter</b> shows the demodulator tune (and waterfall center). <b>Step</b> / <b>Off</b> set the VFO grid. <b>− / +</b> nudge one step; <b>Snap</b> lands on the grid; <b>Go</b> jumps to a MHz (switches profile if needed).</li>" +
      "<li><b>Explore on</b> then drag the waterfall sideways (≥⅓ width) to hop tiles, short-click to tune. Wheel steps the VFO (Shift = ×10, Alt = next/previous profile).</li>" +
      "<li><b>Copy</b>, <b>Bookmark</b>, <b>Jump loudest</b> on the Actions box.</li>" +
      "<li>For automated sweeps use <b>Range → Full range (Explorer)</b>.</li>" +
      "</ul>" +
      "<h3>Analyzer tab (experimental)</h3>" +
      "<ul>" +
      "<li><b>Experimental</b> — off by default. Enable under Settings → <b>Visible tabs</b> → <b>Analyzer · experimental</b>. <b>Show all tabs</b> does not turn it on.</li>" +
      "<li>Basic live spectrum + waterfall from the OpenWebRX waterfall (relative dB), not a full HackRF sweep console.</li>" +
      "<li>Set <b>Start</b>/<b>End</b> MHz (or presets), press <b>Live on</b>. Wide spans hop tiles; <b>Follow tile</b> stays on the current waterfall only.</li>" +
      "<li>Click the plot to tune. Analyzer settings (peak hold, averaging, dB scale, hop ms) are on the Analyzer tab.</li>" +
      "</ul>" +
      "<h3>Peaks tab</h3>" +
      "<ul>" +
      "<li>Ranked table — sort by Seen, MHz, or dB. Click MHz to tune; click name to rename; <b>ign</b> / <b>un-ign</b> to always skip a birdie.</li>" +
      "<li><b>Bookmark qualified</b> — save every peak with Seen ≥ Min seen as blue bookmark.</li>" +
      "<li><b>Copy list</b> · <b>Export CSV</b> · <b>Export JSON</b> — log or merge yellow server bookmarks (admin merges <code>bookmarks</code> on host).</li>" +
      "<li><b>Import CSV</b> · <b>Import JSON</b> — restore Peaks/Seen in this browser (file picker; Shift-click to paste). Does not change bookmarks.</li>" +
      "<li><b>Clear list</b> — wipe peak table. Bookmarks stay.</li>" +
      "<li>Large lists (1000+ peaks) can make the Peaks tab slow. The table shows the top " + RENDER_HITS_CAP +
      " rows; Export CSV has all. Set <b>Max peaks</b> or untick <b>Keep peaks between sessions</b> on this tab for faster opens.</li>" +
      "</ul>" +
      "<h3>Bookmarks tab</h3>" +
      "<ul>" +
      "<li><b>Blue</b> local bookmarks — <b>[auto]</b> from surveys vs named. <b>Amber [load]</b> — imported list (separate from blue).</li>" +
      "<li><b>Save bookmarks</b> · <b>Load bookmarks</b> · <b>Load user bookmarks</b> (tick <b>All bands</b> or band checkboxes; optional Current / Ticked via Extras) · <b>Clear user bookmarks</b> · <b>Clear bookmarks</b> · <b>Clear auto bookmarks</b> · <b>ren</b> to rename.</li>" +
      "<li><b>Listen s</b> — minimum seconds on each bookmark after ~0.7s tune settle.</li>" +
      "<li><b>Priority</b> — MHz list (e.g. 121.5); guard/tower/ATIS names added automatically; listened first.</li>" +
      "<li><b>Auto-bookmark actives</b> — save busy peaks as <b>[auto]</b> bookmarks (on scan end and Stop).</li>" +
      "<li><b>Scan new bookmarks when done</b> — one-shot bookmark scan after a band survey.</li>" +
      "<li><b>Hide auto bookmarks</b> — hide <b>[auto]</b> from OpenWebRX bookmark bar (still on Bookmarks tab).</li>" +
      "<li><b>Continuous bookmark scan</b> (default on) — loop without pausing on busy; auto-hop after Listen s unless you press <b>Hold</b>.</li>" +
      "<li><b>Hold while busy</b> — when continuous is off: stay until ~1.5s quiet after activity; orange button becomes <b>Continue scan bookmarks</b>.</li>" +
      "<li><b>Alert MHz list</b> + <b>± kHz</b> — extra notify and sound when a new peak is within tolerance.</li>" +
      "</ul>" +
      "<h3>Audio tab</h3>" +
      "<ul>" +
      "<li><b>Save all</b> · <b>Save all · ZIP</b> · <b>Preview all</b> (first N seconds of each clip in order; highlights the playing row) · <b>Load audio</b> · <b>Clear all</b> — manage clips (IndexedDB; nothing uploaded).</li>" +
      "<li><b>Vol</b> — clip playback / preview volume (0–100%, remembered). Does not change OpenWebRX receiver volume.</li>" +
      "<li><b>First s</b> (next to Preview all) — how many seconds of each clip to hear (1–15, default 3). Click <b>Stop preview</b> or Play on a row to interrupt.</li>" +
      "<li><b>Record mode</b> — <b>Original</b> (default): record on first waterfall-busy sample; no squelch/voice gating. <b>Balanced</b>: squelch open + light debounce. <b>Strict voice</b>: squelch + S-meter + SNR, pause on quiet, discard hiss.</li>" +
      "<li>Fine-tune (Balanced/Strict; Original ignores): <b>Squelch open only</b>, <b>Debounce ms</b>, <b>Quiet pause ms</b>, <b>Min SNR dB</b>, <b>Squelch headroom dB</b>, <b>Min clip voice %</b> (0 = mode default).</li>" +
      "<li>Clips persist across refresh/restart (default cap 40 clips or ~48&nbsp;MB; set <b>Max audio clips</b> on this tab). Scanner waits ≥2s before hopping so clips are not cut off.</li>" +
      "</ul>" +
      "<h3>Skip tab</h3>" +
      "<ul>" +
      "<li><b>Always skip</b> list — frequencies skipped forever during scans. Add via <b>ign</b> on peaks/bookmarks or toolbar <b>Always skip</b>. Undo with <b>un-ign</b> or <b>Clear always-skip</b>.</li>" +
      "<li><b>Lockout min</b> — how long a toolbar <b>Lockout</b> skip lasts (default 30&nbsp;min).</li>" +
      "</ul>" +
      "<h3>Settings tab</h3>" +
      "<p>Panel-wide preferences only. Scan options live on Bands / Range; bookmark scan on Bookmarks; peak limits on Peaks; clip cap on Audio.</p>" +
      "<p><b>Extras</b> — optional features, all off by default. <b>Add all extras</b> turns them on (Public / shared mode is left off so Factory reset stays available). Tick one and its controls appear on the tab named in parentheses.</p>" +
      "<p><b>Panel &amp; UI</b></p><ul>" +
      "<li><b>Open panel on startup</b> — open Survey when OpenWebRX loads (waits for band profiles).</li>" +
      "<li><b>Remember last tab</b> — restore the tab you last used.</li>" +
      "<li><b>Default tab</b> — which tab on open (Last used, Bands, Range, Peaks, Bookmarks, Audio, Skip, Settings, Help).</li>" +
      "<li><b>UI text size</b> — Small / Default / Large.</li>" +
      "<li><b>Button colours</b> — right-click any coloured button and pick a shade; every button of that type updates. Settings → <b>Reset button colours</b>.</li>" +
      "<li><b>Visible tabs</b> — untick tabs for a minimal bar. <b>Analyzer</b> is experimental and off by default; <b>Show all tabs</b> still leaves Analyzer off. Settings cannot be hidden.</li>" +
      "<li><b>Check install</b> — verify the plugin and receiver. Result box appears on this tab. Help also has <b>Check install now</b>.</li>" +
      "<li><b>Hide top toolbar</b> — never show the scan strip. Normally it only appears on <b>Bands</b> (Scan bands) and <b>Bookmarks</b> (Scan bookmarks / Hold / Skip), plus <b>Stop</b> and status on any tab while a scan is running. Range has Scan range / Stop on that tab.</li>" +
      "<li><b>Reset panel layout</b> — default / waterfall / restore saved position.</li>" +
      "</ul><p><b>Data &amp; housekeeping</b></p><ul>" +
      "<li><b>Factory reset</b> — red button at the <b>top of Settings</b> and again under Data &amp; housekeeping. Wipes peaks, bookmarks, audio, skip list, Explore, and settings in this browser. If the button is greyed out, turn off the <b>Public / shared receiver mode</b> extra.</li>" +
      "<li><b>Export settings</b> · <b>Import settings</b> · <b>Reset settings</b> — settings JSON only (not peaks or audio).</li>" +
      "</ul><p><b>Homelab</b></p><ul>" +
      "<li><b>Webhook URL</b> — POST JSON <code>{freq, name, db, band}</code> on each new peak.</li>" +
      "</ul>" +
      "<h3>Scan behaviour</h3>" +
      "<ul>" +
      "<li><b>Band survey</b> — walks ticked profiles; same-band hops ~1s; other-band ~11s" + (ownerOverrideAllowed() ? " (or ~1s with Own radio — fast hops)" : "") + ".</li>" +
      "<li><b>Range survey</b> — hops MHz steps across profiles; shares peak list and scan options with band survey.</li>" +
      "<li><b>Bookmark scan</b> — continuous mode loops until Stop; pause mode waits on busy unless you Continue/Skip/release Hold.</li>" +
      "<li><b>Stop + auto-bookmark</b> — qualified peaks (Seen ≥ Min seen) saved as <b>[auto]</b> when Auto-bookmark actives is on.</li>" +
      "<li><b>Recording</b> — only while parked on a bookmark (Record busy); not during survey walks.</li>" +
      "</ul>" +
      "<h3>What is saved where</h3>" +
      "<ul>" +
      "<li><b>localStorage</b> — settings, peak list (Seen), bookmark backups, skip list, panel position/size.</li>" +
      "<li><b>IndexedDB</b> — audio clips (survives refresh and browser restart).</li>" +
      "<li><b>Blue bookmarks</b> — OpenWebRX local bookmark store in this browser.</li>" +
      "<li>Nothing is uploaded except optional webhook POSTs you configure. Clearing site data removes everything.</li>" +
      "</ul>" +
      "<h3>Bookmark backups</h3>" +
      '<p><button type="button" class="bs-btn-import" id="bs-restore-first" title="Replace this browser\u2019s blue bookmarks with the copy taken on first run.">Restore first-run bookmarks</button> ' +
      '<button type="button" class="bs-btn-import" id="bs-restore-last" title="Replace this browser\u2019s blue bookmarks with the copy taken on the most recent backup.">Restore last backup</button> ' +
      '<button type="button" class="bs-btn-export" id="bs-dl-backup" title="Download the last bookmark backup as JSON.">Download bookmark backup</button></p>' +
      "<p>Yellow <b>server</b> bookmarks are admin-only. Export JSON and merge on the radio host.</p>" +
      "<h3>Troubleshooting</h3>" +
      "<ul>" +
      "<li><b>No Survey / SV button</b> — plugin not loaded or cached old file. Run <code>./install.sh --check</code>, hard-refresh.</li>" +
      "<li><b>No profile list</b> — open the receiver page (not map/settings only); wait for OpenWebRX+ to load.</li>" +
      "<li><b>No waterfall data</b> — wait after connect; check SDR is started.</li>" +
      "<li><b>Local bookmarks API missing</b> — auto-bookmark disabled; Export JSON still works.</li>" +
      "<li><b>Other listeners online</b> — untick <b>Only if alone</b> on Range or Bands.</li>" +
      "<li><b>Nothing counted</b> — lower dB over noise, pick a busier band, wait for waterfall activity.</li>" +
      "<li><b>Slow panel / sluggish open</b> — hundreds or thousands of stored peaks. Peaks load when you open Survey, not on page load. Set <b>Max peaks</b> (1000–2000) or untick <b>Keep peaks between sessions</b> on the Peaks tab, or Peaks → Export CSV then Clear list.</li>" +
      (ownerOverrideAllowed()
        ? "<li><b>Banned / kicked</b> — leave <b>Own radio — fast hops</b> off on shared receivers.</li>"
        : "<li><b>Banned / kicked</b> — fast hops locked here (~11s gap). Server bot-ban may still apply.</li>") +
      "</ul>" +
      "<p>Settings → <b>Check install</b> and Help → <b>Check install now</b> run the same checks.</p>"
    );
  }

  function bindHelpTabActions() {
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
        switchTab("settings");
        runCheckInstall();
      };
    }
    if ($("bs-copy-diag")) {
      $("bs-copy-diag").onclick = function () { copyDiagnosticReport(); };
    }
  }

  function setPanelMinimized(min) {
    var p = $("bs-panel");
    if (!p) return;
    p.classList.toggle("bs-minimized", !!min);
    var btn = $("bs-minimize");
    if (btn) {
      btn.textContent = min ? "+" : "−";
      btn.title = min
        ? "Restore the full panel."
        : "Minimize to tab bar only — scans keep running.";
    }
  }

  function togglePanelMinimized() {
    var p = $("bs-panel");
    if (!p || p.hidden) return;
    setPanelMinimized(!p.classList.contains("bs-minimized"));
  }

  function clampPanelOnScreen(w, h, left, top, vw, vh) {
    var edge = 72;
    if (left + w < edge) left = Math.max(4, vw - w - 4);
    if (top + h < edge) top = Math.max(4, vh - h - 4);
    if (left > vw - edge) left = 4;
    if (top > vh - edge) top = Math.max(4, vh - h - 4);
    return { left: left, top: top };
  }

  function showPanel() {
    var p = $("bs-panel");
    if (!p) return;
    p.hidden = false;
    setPanelMinimized(false);
    applyPanelLayout();
    if ($("bs-hideauto") && S.hideAuto !== $("bs-hideauto").checked) $("bs-hideauto").checked = !!S.hideAuto;
    applyCaps();
    ensureSvAccessChip();
    ensureHitsLoaded(function (n) {
      if (n >= PEAKS_LOAD_WARN) {
        setStatus("Loaded " + n + " stored peaks. For faster opens try Max peaks 1000–2000 on Settings, or untick Keep peaks between sessions.");
      }
      updateTabLabels();
      deferPanelHeavyWork(true);
    });
    if (!profiles().length) {
      setStatus("Waiting for band profiles… if this stays empty, click Settings → Check install or open the Help tab.");
    }
  }

  function watchProfiles() {
    if (watchProfiles._on) return;
    watchProfiles._on = true;
    function refreshIfNeeded() {
      if (!profiles().length) return;
      fillBands();
    }
    function attach() {
      var sel = $("openwebrx-sdr-profiles-listbox");
      if (!sel) return false;
      if (watchProfiles._sel === sel) return true;
      watchProfiles._sel = sel;
      if (typeof MutationObserver !== "undefined") {
        var mo = new MutationObserver(refreshIfNeeded);
        mo.observe(sel, { childList: true, subtree: true, attributes: true });
        watchProfiles._mo = mo;
      }
      sel.addEventListener("change", refreshIfNeeded);
      refreshIfNeeded();
      return true;
    }
    if (!attach()) {
      var tries = 0;
      var iv = setInterval(function () {
        if (attach() || ++tries > 60) clearInterval(iv);
      }, 500);
    }
  }

  function maintainStartupPanelOpen() {
    if (window._bs_user_closed_panel) return;
    if (!window._bs_startup_open_done) return;
    if (!window._bs_startup_grace_until || Date.now() > window._bs_startup_grace_until) return;
    var p = $("bs-panel");
    if (p && p.hidden) showPanel();
  }

  function runStartupPanelOpen() {
    if (window._bs_user_closed_panel) return;
    var wantWelcome = !S.seenHelp && !window._bs_welcomed;
    var wantAuto = !!S.autoOpenPanel;
    if (!wantWelcome && !wantAuto) return;
    if (window._bs_startup_open_done) {
      maintainStartupPanelOpen();
      return;
    }

    makePanel();
    var p = $("bs-panel");
    if (!p) return;

    function finishOpen() {
      if (window._bs_user_closed_panel || window._bs_startup_open_done) return;
      window._bs_startup_open_done = true;
      window._bs_startup_grace_until = Date.now() + 2500;
      if (wantWelcome) {
        window._bs_welcomed = true;
        showPanel();
        switchTab("help", true);
        setStatus("Welcome. Your blue bookmarks were copied into a browser backup. See the Help tab for the full guide — this only auto-opens once.");
      } else {
        showPanel();
        switchTab(resolveOpenTab());
      }
      ensureSvAccessChip();
    }

    finishOpen();
    if (profiles().length) return;
    if (runStartupPanelOpen._wait) return;
    runStartupPanelOpen._wait = true;
    setStatus("Waiting for band profiles…");
    var t0 = Date.now();
    (function waitProfiles() {
      if (profiles().length || Date.now() - t0 > 30000) {
        runStartupPanelOpen._wait = false;
        fillBands();
        return;
      }
      setTimeout(waitProfiles, 250);
    })();
  }

  function openHelp() {
    showPanel();
    switchTab("help", true);
    S.seenHelp = true;
    saveSettings();
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

  function fmtProfileMhz(v) {
    v = Number(v);
    if (!isFinite(v)) return "—";
    if (v >= 1000) {
      var g = v / 1000;
      return (Math.abs(g - Math.round(g)) < 1e-6 ? String(Math.round(g)) : g.toFixed(3).replace(/\.?0+$/, "")) + " GHz";
    }
    if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
    if (v >= 30) return (Math.round(v * 1000) / 1000).toString();
    return (Math.round(v * 10000) / 10000).toString();
  }

  function profileFreqLabel(p) {
    var r = parseMhzRange(p && p.label);
    if (!r) return "—";
    if (Math.abs(r.lo - r.hi) < 1e-9) return fmtProfileMhz(r.lo);
    return fmtProfileMhz(r.lo) + "–" + fmtProfileMhz(r.hi);
  }

  function profileModeLabel(p) {
    var m = guessMode(p && p.id);
    return m ? String(m).toUpperCase() : "—";
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

  function profileForFreq(freqHz) {
    var list = profiles();
    var best = null;
    var bestSpan = Infinity;
    var near = null;
    var nearDist = Infinity;
    var i, p, r, lo, hi, span, mid, d;
    for (i = 0; i < list.length; i++) {
      p = list[i];
      r = parseMhzRange(p.label);
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

  function profileOverlapsRange(p, startHz, endHz) {
    var r = parseMhzRange(p && p.label);
    if (!r) return false;
    var lo = r.lo * 1e6;
    var hi = r.hi * 1e6;
    return hi >= startHz && lo <= endHz;
  }

  function buildRangeBandSteps(startHz, endHz) {
    var selected = selectedValues();
    var selectedSet = {};
    selected.forEach(function (v) { selectedSet[v] = true; });
    var steps = [];
    profiles().forEach(function (p) {
      if (!selectedSet[p.value]) return;
      if (!profileOverlapsRange(p, startHz, endHz)) return;
      var r = parseMhzRange(p.label);
      var centerHz = r ? Math.round(((r.lo + r.hi) / 2) * 1e6) : null;
      if (!centerHz) return;
      steps.push({ freqHz: centerHz, profile: p });
    });
    steps.sort(function (a, b) { return a.freqHz - b.freqHz; });
    return steps;
  }

  function rangeStepHz() {
    var userKhz = Number(S.rangeStepKhz);
    if (isFinite(userKhz) && userKhz > 0) return userKhz * 1000;
    var bw = window.bandwidth;
    var step = bw && bw > 10000 ? Math.max(12500, Math.floor(bw * (1 - 2 * EDGE_FRAC))) : 12500;
    var startHz = (Number(S.rangeStartMhz) || 0) * 1e6;
    var endHz = (Number(S.rangeEndMhz) || 0) * 1e6;
    if (S.widebandPeaks !== false && isBroadcastFmRange(startHz, endHz)) {
      step = Math.min(step, 250000);
    } else if (S.widebandPeaks !== false && isHfBroadcastRange(startHz, endHz)) {
      step = Math.min(step, 500000);
    }
    return step;
  }

  function rangeOffsetHz() {
    var khz = Number(S.rangeOffsetKhz);
    if (!isFinite(khz) || khz < 0) return 0;
    return khz * 1000;
  }

  function rangeUsesChannelGrid() {
    return !!S.rangeChannelGrid && S.rangeMode !== "bands";
  }

  /** Channel centres: start + offset, then + step … while ≤ end (PMR446 / airband style). */
  function buildChannelGridCenters(startHz, endHz, stepHz, offsetHz) {
    var centers = [];
    if (!stepHz || stepHz <= 0) return centers;
    var off = Math.max(0, offsetHz || 0);
    var f = startHz + off;
    var guard = 0;
    while (f < startHz - 0.5 && guard++ < 100000) f += stepHz;
    while (f <= endHz + 0.5 && centers.length < 100000) {
      if (f >= startHz - 0.5) centers.push(Math.round(f));
      f += stepHz;
    }
    return centers;
  }

  function buildRangeCenters(startHz, endHz, stepHz) {
    if (rangeUsesChannelGrid()) {
      return buildChannelGridCenters(startHz, endHz, stepHz, rangeOffsetHz());
    }
    var bw = window.bandwidth || stepHz * 1.15;
    var halfUsable = (bw * (1 - 2 * EDGE_FRAC)) / 2;
    var centers = [];
    var f = startHz + halfUsable;
    if (f > endHz) f = (startHz + endHz) / 2;
    while (f <= endHz + halfUsable && centers.length < 100000) {
      if (f >= startHz - halfUsable) centers.push(Math.round(f));
      f += stepHz;
    }
    if (!centers.length) centers.push(Math.round((startHz + endHz) / 2));
    return centers;
  }

  /** Presets for channelised bands (step + offset from Start). */
  function rangeGridPresets() {
    var air833 = 25 / 3; // 8.333… kHz
    return [
      { id: "auto", label: "Auto coverage (waterfall tiles)", grid: false },
      { id: "custom", label: "Custom channel grid…", grid: true },
      { id: "air25", label: "Airband 25 kHz (118–137)", grid: true,
        start: 118, end: 137, step: 25, offset: 0 },
      { id: "air833", label: "Airband 8.33 kHz (118–137)", grid: true,
        start: 118, end: 137, step: air833, offset: 0 },
      { id: "pmr446", label: "PMR446 12.5 kHz (16 ch)", grid: true,
        start: 446, end: 446.2, step: 12.5, offset: 6.25 },
      { id: "pmr446-625", label: "PMR446 6.25 kHz (digital)", grid: true,
        start: 446, end: 446.2, step: 6.25, offset: 6.25 },
      { id: "lpd433", label: "LPD433 25 kHz (69 ch)", grid: true,
        start: 433.075, end: 434.775, step: 25, offset: 0 },
      { id: "marine25", label: "Marine VHF ~25 kHz (156–162)", grid: true,
        start: 156, end: 162.025, step: 25, offset: 0 },
      { id: "2m12", label: "2m FM 12.5 kHz (144–146)", grid: true,
        start: 144, end: 146, step: 12.5, offset: 0 },
      { id: "2m25", label: "2m FM 25 kHz (144–146)", grid: true,
        start: 144, end: 146, step: 25, offset: 0 },
      { id: "2m12-us", label: "2m FM 12.5 kHz (144–148)", grid: true,
        start: 144, end: 148, step: 12.5, offset: 0 },
      { id: "70cm12", label: "70cm FM 12.5 kHz (430–440)", grid: true,
        start: 430, end: 440, step: 12.5, offset: 0 },
      { id: "70cm25", label: "70cm FM 25 kHz (430–440)", grid: true,
        start: 430, end: 440, step: 25, offset: 0 },
      { id: "cb10", label: "CB 10 kHz (26.965–27.405)", grid: true,
        start: 26.965, end: 27.405, step: 10, offset: 0 },
      { id: "fm100", label: "FM broadcast 100 kHz (EU)", grid: true,
        start: 87.5, end: 108, step: 100, offset: 0 },
      { id: "fm200", label: "FM broadcast 200 kHz (US)", grid: true,
        start: 88.1, end: 107.9, step: 200, offset: 0 },
      { id: "mw9", label: "MW AM 9 kHz (EU)", grid: true,
        start: 0.531, end: 1.602, step: 9, offset: 0 },
      { id: "mw10", label: "MW AM 10 kHz (US)", grid: true,
        start: 0.530, end: 1.700, step: 10, offset: 0 }
    ];
  }

  function rangeGridPresetById(id) {
    var list = rangeGridPresets();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return list[0];
  }

  function applyRangeGridPreset(id, fromUi) {
    var p = rangeGridPresetById(id || "auto");
    S.rangeGridPreset = p.id;
    if (p.id === "auto") {
      S.rangeChannelGrid = false;
      if (fromUi) {
        /* keep user's start/end/step; only leave channel mode */
      }
    } else if (p.id === "custom") {
      S.rangeChannelGrid = true;
      if (!(Number(S.rangeStepKhz) > 0)) S.rangeStepKhz = 12.5;
    } else {
      S.rangeChannelGrid = !!p.grid;
      if (p.start != null) S.rangeStartMhz = p.start;
      if (p.end != null) S.rangeEndMhz = p.end;
      if (p.step != null) S.rangeStepKhz = p.step;
      if (p.offset != null) S.rangeOffsetKhz = p.offset;
      S.rangeMode = "full";
    }
    if (fromUi) {
      if ($("bs-range-start")) $("bs-range-start").value = S.rangeStartMhz;
      if ($("bs-range-end")) $("bs-range-end").value = S.rangeEndMhz;
      if ($("bs-range-step")) $("bs-range-step").value = S.rangeStepKhz || 0;
      if ($("bs-range-offset")) $("bs-range-offset").value = S.rangeOffsetKhz || 0;
      if ($("bs-range-grid")) $("bs-range-grid").checked = !!S.rangeChannelGrid;
      if ($("bs-range-grid-preset")) $("bs-range-grid-preset").value = S.rangeGridPreset || "auto";
      if ($("bs-range-mode-full")) $("bs-range-mode-full").checked = true;
      if ($("bs-range-mode-bands")) $("bs-range-mode-bands").checked = false;
    }
    updateRangeModeUi();
    updateRangeEstimate();
    saveSettings();
  }

  function syncRangeGridPresetSelect() {
    var sel = $("bs-range-grid-preset");
    if (!sel || sel.options.length) return;
    rangeGridPresets().forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      sel.appendChild(opt);
    });
  }

  function rangeLabel() {
    return Number(S.rangeStartMhz).toFixed(3) + "–" + Number(S.rangeEndMhz).toFixed(3) + " MHz";
  }

  function readRangeForm() {
    if ($("bs-range-start")) S.rangeStartMhz = Number($("bs-range-start").value) || S.rangeStartMhz;
    if ($("bs-range-end")) S.rangeEndMhz = Number($("bs-range-end").value) || S.rangeEndMhz;
    if ($("bs-range-step")) S.rangeStepKhz = Number($("bs-range-step").value);
    if (!isFinite(S.rangeStepKhz) || S.rangeStepKhz < 0) S.rangeStepKhz = 0;
    if ($("bs-range-offset")) S.rangeOffsetKhz = Number($("bs-range-offset").value);
    if (!isFinite(S.rangeOffsetKhz) || S.rangeOffsetKhz < 0) S.rangeOffsetKhz = 0;
    if ($("bs-range-grid")) S.rangeChannelGrid = !!$("bs-range-grid").checked;
    if ($("bs-range-passes")) S.passes = syncPassesUi($("bs-range-passes").value);
    if ($("bs-range-dwell")) S.dwell = syncDwellUi($("bs-range-dwell").value);
    if ($("bs-range-thresh")) S.threshDb = syncThreshUi($("bs-range-thresh").value);
    if ($("bs-range-mute")) S.mute = syncMuteUi($("bs-range-mute").checked);
    if ($("bs-range-ownradio")) S.ownRadio = syncOwnRadioUi($("bs-range-ownradio").checked);
    if ($("bs-range-alone")) S.aloneOnly = syncAloneUi($("bs-range-alone").checked);
    if ($("bs-range-wideband")) S.widebandPeaks = syncWidebandUi($("bs-range-wideband").checked);
    if ($("bs-range-minhits")) S.minHits = syncMinHitsUi($("bs-range-minhits").value);
    if ($("bs-range-hidespurs")) S.hideSpurs = syncHideSpursUi($("bs-range-hidespurs").checked);
    if ($("bs-range-mode-bands") && $("bs-range-mode-bands").checked) S.rangeMode = "bands";
    else S.rangeMode = "full";
    if (S.rangeChannelGrid && S.rangeMode === "full") {
      if (S.rangeGridPreset === "auto") S.rangeGridPreset = "custom";
      if (!(Number(S.rangeStepKhz) > 0)) S.rangeStepKhz = 12.5;
      if ($("bs-range-step")) $("bs-range-step").value = S.rangeStepKhz;
      if ($("bs-range-grid-preset") && $("bs-range-grid-preset").value === "auto") {
        $("bs-range-grid-preset").value = "custom";
        S.rangeGridPreset = "custom";
      }
    } else if (!S.rangeChannelGrid && S.rangeGridPreset !== "auto" && S.rangeGridPreset !== "custom") {
      /* keep named preset id for re-apply; grid off means coverage hops */
    } else if (!S.rangeChannelGrid) {
      S.rangeGridPreset = "auto";
      if ($("bs-range-grid-preset")) $("bs-range-grid-preset").value = "auto";
    }
    saveSettings();
    updateRangeEstimate();
    updateRangeModeUi();
    if ($("bs-range-hidespurs")) {
      renderHits();
      if (rangeSpectrum.startMhz && rangeSpectrum.endMhz) {
        rangeSpectrum.peaks = peaksInRangeMhz(rangeSpectrum.startMhz, rangeSpectrum.endMhz);
        drawRangeSpectrum();
      }
    }
  }

  function updateRangeModeUi() {
    var stepEl = $("bs-range-step");
    var stepLab = $("bs-range-step-label");
    var offEl = $("bs-range-offset");
    var offLab = $("bs-range-offset-label");
    var gridEl = $("bs-range-grid");
    var gridLab = $("bs-range-grid-label");
    var presetEl = $("bs-range-grid-preset");
    var presetLab = $("bs-range-grid-preset-label");
    var bandsOnly = S.rangeMode === "bands";
    var gridOn = rangeUsesChannelGrid();
    if (stepEl) {
      stepEl.disabled = bandsOnly;
      if (gridOn && !(Number(stepEl.value) > 0)) stepEl.value = S.rangeStepKhz > 0 ? S.rangeStepKhz : 12.5;
    }
    if (stepLab) {
      stepLab.style.opacity = bandsOnly ? "0.45" : "1";
      stepLab.title = gridOn
        ? "Channel spacing in kHz (required for channel grid). Example: 12.5 for PMR446."
        : "Hop size in kHz. 0 = auto (~88% of waterfall span). Full range mode only.";
    }
    if (offEl) offEl.disabled = bandsOnly || !gridOn;
    if (offLab) offLab.style.opacity = (bandsOnly || !gridOn) ? "0.45" : "1";
    if (gridEl) gridEl.disabled = bandsOnly;
    if (gridLab) gridLab.style.opacity = bandsOnly ? "0.45" : "1";
    if (presetEl) presetEl.disabled = bandsOnly;
    if (presetLab) presetLab.style.opacity = bandsOnly ? "0.45" : "1";
  }

  function updateRangeEstimate() {
    var el = $("bs-range-est");
    if (!el) return;
    var startHz = (Number(S.rangeStartMhz) || 0) * 1e6;
    var endHz = (Number(S.rangeEndMhz) || 0) * 1e6;
    if (!startHz || !endHz || startHz >= endHz) {
      el.textContent = "Set start < end MHz.";
      return;
    }
    var passes = passesFromUi();
    if (S.rangeMode === "bands") {
      var bandSteps = buildRangeBandSteps(startHz, endHz);
      var ticked = selectedValues().length;
      if (!bandSteps.length) {
        el.textContent = "No ticked bands overlap " + rangeLabel() +
          (ticked ? " — tick bands on the Bands tab or switch to Full range." : " — tick bands on the Bands tab first.");
        return;
      }
      el.textContent = bandSteps.length + " ticked band" + (bandSteps.length === 1 ? "" : "s") +
        " in range · ×" + passes + " pass(es) · dwell " + dwellFromUi() + "s · dB " + threshFromUi();
      return;
    }
    if (rangeUsesChannelGrid() && !(Number(S.rangeStepKhz) > 0)) {
      el.textContent = "Channel grid needs Step kHz > 0 (or pick a grid preset).";
      return;
    }
    var stepHz = rangeStepHz();
    var n = buildRangeCenters(startHz, endHz, stepHz).length;
    var stepTxt;
    if (rangeUsesChannelGrid()) {
      var first = startHz + rangeOffsetHz();
      stepTxt = "channel grid · " + (S.rangeStepKhz) + " kHz · offset " +
        (Number(S.rangeOffsetKhz) || 0) + " kHz · first " + fmtMhz(first);
    } else {
      stepTxt = S.rangeStepKhz > 0
        ? (S.rangeStepKhz + " kHz coverage hops")
        : ("auto ~" + (stepHz / 1000).toFixed(1) + " kHz from waterfall span");
    }
    el.textContent = n + " tune point" + (n === 1 ? "" : "s") + " · " + stepTxt +
      " · ×" + passes + " pass(es) · dwell " + dwellFromUi() + "s · dB " + threshFromUi();
  }

  function peaksInRangeMhz(loMhz, hiMhz) {
    var lo = Math.min(loMhz, hiMhz) * 1e6;
    var hi = Math.max(loMhz, hiMhz) * 1e6;
    return hits.filter(function (h) {
      if (h.freq < lo - 1 || h.freq > hi + 1) return false;
      if (S.hideSpurs !== false && isSpur(h)) return false;
      return true;
    });
  }

  function hideRangeSpectrum() {
    var wrap = $("bs-range-spectrum-wrap");
    if (wrap) wrap.hidden = true;
  }

  function rangeSpectrumPeakRows() {
    return (rangeSpectrum.peaks || []).map(function (h) {
      return {
        freq: h.freq,
        seen: h.seen,
        maxDb: h.maxDb,
        lastDb: h.lastDb,
        name: h.name || "",
        pid: h.pid || "",
        label: h.label || "",
        isNew: !!h.isNew,
        mode: h.mode || ""
      };
    });
  }

  function saveRangeSpectrum() {
    if (!rangeSpectrum.startMhz || !rangeSpectrum.endMhz || rangeSpectrum.startMhz >= rangeSpectrum.endMhz) return;
    var payload = {
      startMhz: rangeSpectrum.startMhz,
      endMhz: rangeSpectrum.endMhz,
      savedAt: Date.now(),
      peaks: rangeSpectrumPeakRows()
    };
    try {
      window.localStorage.setItem(LS_RANGE_SPECTRUM, JSON.stringify(payload));
    } catch (e) {}
    pushSpectrumHist({ at: payload.savedAt, payload: payload });
  }

  function applyRangeSpectrumPayload(o) {
    if (!o) return;
    try { window.localStorage.setItem(LS_RANGE_SPECTRUM, JSON.stringify(o)); } catch (e) {}
    restoreRangeSpectrumView();
  }

  function loadRangeSpectrumStore() {
    try {
      var raw = window.localStorage.getItem(LS_RANGE_SPECTRUM);
      if (!raw) return false;
      var o = JSON.parse(raw);
      var lo = Number(o.startMhz);
      var hi = Number(o.endMhz);
      if (!o || !isFinite(lo) || !isFinite(hi) || lo >= hi) return false;
      rangeSpectrum.startMhz = lo;
      rangeSpectrum.endMhz = hi;
      if (Array.isArray(o.peaks) && o.peaks.length) {
        rangeSpectrum.peaks = o.peaks;
      } else {
        rangeSpectrum.peaks = peaksInRangeMhz(lo, hi);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function restoreRangeSpectrumView() {
    if (!loadRangeSpectrumStore()) return;
    var wrap = $("bs-range-spectrum-wrap");
    if (!wrap) return;
    var startMhz = rangeSpectrum.startMhz;
    var endMhz = rangeSpectrum.endMhz;
    var cap = $("bs-range-spectrum-cap");
    var n = rangeSpectrum.peaks.length;
    var newN = rangeSpectrum.peaks.filter(function (h) { return h.isNew; }).length;
    if (cap) {
      cap.textContent = n
        ? (n + " peak" + (n === 1 ? "" : "s") + " in " + Number(startMhz).toFixed(3) + "–" +
          Number(endMhz).toFixed(3) + " MHz" + (newN ? " · " + newN + " new" : ""))
        : "No peaks in " + Number(startMhz).toFixed(3) + "–" + Number(endMhz).toFixed(3) +
          " MHz (try lower dB — wideband on helps FM/AM broadcast; ~2–8 dB).";
    }
    wrap.hidden = false;
    drawRangeSpectrum();
  }

  function exportRangeSpectrumPng() {
    var wrap = $("bs-range-spectrum-wrap");
    var cv = $("bs-range-spectrum");
    if (!cv || !wrap || wrap.hidden) {
      setStatus("No range spectrum to save — run a range scan first.");
      return;
    }
    drawRangeSpectrum();
    try {
      var lo = Number(rangeSpectrum.startMhz).toFixed(3);
      var hi = Number(rangeSpectrum.endMhz).toFixed(3);
      if (cv.toBlob) {
        cv.toBlob(function (blob) {
          if (!blob) {
            setStatus("Could not save spectrum PNG.");
            return;
          }
          downloadBlob("range-spectrum-" + lo + "-" + hi + "MHz.png", blob);
          setStatus("Saved range spectrum PNG.");
        }, "image/png");
        return;
      }
      var dataUrl = cv.toDataURL("image/png");
      var bin = atob(dataUrl.split(",")[1]);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      downloadBlob("range-spectrum-" + lo + "-" + hi + "MHz.png", new Blob([arr], { type: "image/png" }));
      setStatus("Saved range spectrum PNG.");
    } catch (err) {
      setStatus(friendlyError(err, "Save spectrum PNG"));
    }
  }

  function exportRangeSpectrumCsv() {
    if (!$("bs-range-spectrum-wrap") || $("bs-range-spectrum-wrap").hidden) {
      if (!loadRangeSpectrumStore()) {
        setStatus("No range spectrum to save — run a range scan first.");
        return;
      }
    }
    if (!rangeSpectrum.peaks.length) {
      setStatus("Range spectrum has no peaks to export.");
      return;
    }
    try {
      var lo = Number(rangeSpectrum.startMhz).toFixed(3);
      var hi = Number(rangeSpectrum.endMhz).toFixed(3);
      var lines = ["seen,MHz,dB,band,name,new,pid,mode"];
      rangeSpectrum.peaks.slice().sort(function (a, b) {
        return a.freq - b.freq;
      }).forEach(function (h) {
        lines.push([
          h.seen || 0,
          fmtMhzNum(h.freq),
          Math.round(h.maxDb || h.lastDb || 0),
          JSON.stringify(h.label || h.pid || ""),
          JSON.stringify(h.name || ""),
          h.isNew ? "yes" : "",
          JSON.stringify(h.pid || ""),
          JSON.stringify(h.mode || "")
        ].join(","));
      });
      downloadFile("range-spectrum-" + lo + "-" + hi + "MHz.csv", lines.join("\n"), "text/csv");
      setStatus("Saved range spectrum CSV (" + rangeSpectrum.peaks.length + " peaks).");
    } catch (err) {
      setStatus(friendlyError(err, "Save spectrum CSV"));
    }
  }

  function showRangeSpectrum(startMhz, endMhz) {
    if (!startMhz || !endMhz || startMhz >= endMhz) return;
    rangeSpectrum.startMhz = startMhz;
    rangeSpectrum.endMhz = endMhz;
    rangeSpectrum.peaks = peaksInRangeMhz(startMhz, endMhz);
    var wrap = $("bs-range-spectrum-wrap");
    if (!wrap) return;
    var cap = $("bs-range-spectrum-cap");
    var n = rangeSpectrum.peaks.length;
    var newN = rangeSpectrum.peaks.filter(function (h) { return h.isNew; }).length;
    if (cap) {
      cap.textContent = n
        ? (n + " peak" + (n === 1 ? "" : "s") + " in " + Number(startMhz).toFixed(3) + "–" +
          Number(endMhz).toFixed(3) + " MHz" + (newN ? " · " + newN + " new" : ""))
        : "No peaks in " + Number(startMhz).toFixed(3) + "–" + Number(endMhz).toFixed(3) +
          " MHz (try lower dB — wideband on helps FM/AM broadcast; ~2–8 dB).";
    }
    wrap.hidden = false;
    drawRangeSpectrum();
    saveRangeSpectrum();
  }

  function rangeSpecLayout(cssW) {
    cssW = cssW || (($("bs-range-spectrum") && $("bs-range-spectrum").clientWidth) || 320);
    return {
      cssW: cssW,
      cssH: RANGE_SPEC.cssH,
      padL: RANGE_SPEC.padL,
      padR: RANGE_SPEC.padR,
      padT: RANGE_SPEC.padT,
      padB: RANGE_SPEC.padB,
      plotW: cssW - RANGE_SPEC.padL - RANGE_SPEC.padR,
      plotH: RANGE_SPEC.cssH - RANGE_SPEC.padT - RANGE_SPEC.padB
    };
  }

  function rangeSpecXForFreq(freqHz, loMhz, hiMhz, lay) {
    var frac = (freqHz / 1e6 - loMhz) / (hiMhz - loMhz);
    return lay.padL + Math.max(0, Math.min(1, frac)) * lay.plotW;
  }

  function buildRangeSpecBins(peaks, loMhz, hiMhz, nBins) {
    var bins = [];
    var i;
    for (i = 0; i < nBins; i++) bins[i] = 0;
    var span = hiMhz - loMhz;
    if (span <= 0) return bins;
    peaks.forEach(function (h) {
      var mhz = h.freq / 1e6;
      var idx = Math.round(((mhz - loMhz) / span) * (nBins - 1));
      if (idx < 0 || idx >= nBins) return;
      var db = h.maxDb || h.lastDb || 0;
      var weight = db * (1 + 0.35 * Math.log10(Math.max(1, h.seen || 1)));
      bins[idx] = Math.max(bins[idx], weight);
      if (idx > 0) bins[idx - 1] = Math.max(bins[idx - 1], weight * 0.55);
      if (idx < nBins - 1) bins[idx + 1] = Math.max(bins[idx + 1], weight * 0.55);
    });
    var out = bins.slice();
    for (i = 1; i < nBins - 1; i++) {
      out[i] = (bins[i - 1] + bins[i] * 2 + bins[i + 1]) / 4;
    }
    return out;
  }

  function peakMarkerColor(h) {
    if (isPriority(h.freq)) return { stroke: "#fb7185", fill: "#fda4af", glow: "rgba(244, 114, 182, 0.9)" };
    if (h.isNew) return { stroke: "#34d399", fill: "#6ee7b7", glow: "rgba(52, 211, 153, 0.85)" };
    return { stroke: "#fbbf24", fill: "#fde68a", glow: "rgba(251, 191, 36, 0.75)" };
  }

  function drawRangeSpectrum() {
    var cv = $("bs-range-spectrum");
    var wrap = $("bs-range-spectrum-wrap");
    if (!cv || !wrap || wrap.hidden) return;
    var peaks = rangeSpectrum.peaks;
    var loMhz = rangeSpectrum.startMhz;
    var hiMhz = rangeSpectrum.endMhz;
    if (!loMhz || !hiMhz || loMhz >= hiMhz) return;

    var dpr = window.devicePixelRatio || 1;
    var lay = rangeSpecLayout(cv.clientWidth || 320);
    cv.style.height = lay.cssH + "px";
    cv.width = Math.round(lay.cssW * dpr);
    cv.height = Math.round(lay.cssH * dpr);
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var bg = ctx.createLinearGradient(0, 0, 0, lay.cssH);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(0.55, "#0a0f1a");
    bg.addColorStop(1, "#050508");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, lay.cssW, lay.cssH);

    ctx.strokeStyle = "rgba(71, 85, 105, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(lay.padL + 0.5, lay.padT + 0.5, lay.plotW - 1, lay.plotH - 1);

    var maxDb = 0;
    var minDb = 999;
    peaks.forEach(function (h) {
      var db = h.maxDb || h.lastDb || 0;
      if (db > maxDb) maxDb = db;
      if (db < minDb) minDb = db;
    });
    if (!peaks.length) minDb = 0;
    if (maxDb <= minDb) maxDb = minDb + 1;

    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";
    var gi;
    for (gi = 0; gi <= 4; gi++) {
      var gy = lay.padT + (lay.plotH * gi / 4);
      ctx.strokeStyle = gi === 4 ? "rgba(51, 65, 85, 0.9)" : "rgba(30, 41, 59, 0.85)";
      ctx.beginPath();
      ctx.moveTo(lay.padL, gy + 0.5);
      ctx.lineTo(lay.padL + lay.plotW, gy + 0.5);
      ctx.stroke();
      if (gi < 4) {
        var gdb = Math.round(maxDb - (maxDb - minDb) * (gi / 4));
        ctx.fillText(gdb + " dB", lay.padL - 4, gy + 3);
      }
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px ui-monospace, monospace";
    var spanMhz = hiMhz - loMhz;
    var xTicks = Math.max(12, Math.min(16, Math.floor(lay.plotW / 42)));
    var decimals = spanMhz >= 100 ? 1 : (spanMhz >= 20 ? 2 : 3);
    var ti;
    for (ti = 0; ti < xTicks; ti++) {
      var tFrac = ti / (xTicks - 1);
      var tMhz = loMhz + spanMhz * tFrac;
      var tx = lay.padL + lay.plotW * tFrac;
      ctx.strokeStyle = "rgba(51, 65, 85, 0.95)";
      ctx.beginPath();
      ctx.moveTo(tx + 0.5, lay.padT + lay.plotH);
      ctx.lineTo(tx + 0.5, lay.padT + lay.plotH + 3);
      ctx.stroke();
      if (ti === 0) ctx.textAlign = "left";
      else if (ti === xTicks - 1) ctx.textAlign = "right";
      else ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(tMhz.toFixed(decimals), tx, lay.cssH - 4);
    }

    if (!peaks.length) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      ctx.fillText("No peaks in range — try a lower dB threshold", lay.padL + lay.plotW / 2, lay.padT + lay.plotH / 2 + 4);
      return;
    }

    var bins = buildRangeSpecBins(peaks, loMhz, hiMhz, RANGE_SPEC.bins);
    var maxBin = 0;
    bins.forEach(function (v) { if (v > maxBin) maxBin = v; });
    if (maxBin <= 0) maxBin = 1;

    ctx.beginPath();
    ctx.moveTo(lay.padL, lay.padT + lay.plotH);
    var bi;
    for (bi = 0; bi < bins.length; bi++) {
      var bx = lay.padL + (bi / (bins.length - 1)) * lay.plotW;
      var bfrac = bins[bi] / maxBin;
      var by = lay.padT + lay.plotH - bfrac * (lay.plotH - 6);
      ctx.lineTo(bx, by);
    }
    ctx.lineTo(lay.padL + lay.plotW, lay.padT + lay.plotH);
    ctx.closePath();
    var fillGrad = ctx.createLinearGradient(0, lay.padT, 0, lay.padT + lay.plotH);
    fillGrad.addColorStop(0, "rgba(34, 211, 238, 0.55)");
    fillGrad.addColorStop(0.35, "rgba(52, 211, 153, 0.42)");
    fillGrad.addColorStop(0.72, "rgba(245, 158, 11, 0.28)");
    fillGrad.addColorStop(1, "rgba(30, 64, 175, 0.18)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.beginPath();
    for (bi = 0; bi < bins.length; bi++) {
      bx = lay.padL + (bi / (bins.length - 1)) * lay.plotW;
      bfrac = bins[bi] / maxBin;
      by = lay.padT + lay.plotH - bfrac * (lay.plotH - 6);
      if (bi === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.strokeStyle = "rgba(125, 211, 252, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    peaks.slice().sort(function (a, b) {
      return (a.freq || 0) - (b.freq || 0);
    }).forEach(function (h) {
      var x = rangeSpecXForFreq(h.freq, loMhz, hiMhz, lay);
      var db = h.maxDb || h.lastDb || minDb;
      var fracH = (db - minDb) / (maxDb - minDb);
      var barH = Math.max(6, fracH * (lay.plotH - 8));
      var yTop = lay.padT + lay.plotH - barH;
      var yBot = lay.padT + lay.plotH;
      var colors = peakMarkerColor(h);
      ctx.shadowBlur = 8;
      ctx.shadowColor = colors.glow;
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = h.isNew || isPriority(h.freq) ? 2 : 1.25;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, yBot);
      ctx.lineTo(x + 0.5, yTop);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, yTop, isPriority(h.freq) ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    var top = peaks.slice().sort(function (a, b) { return (b.maxDb || 0) - (a.maxDb || 0); })[0];
    if (top) {
      var tx = rangeSpecXForFreq(top.freq, loMhz, hiMhz, lay);
      ctx.shadowBlur = 0;
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = tx > lay.padL + lay.plotW * 0.72 ? "right" : "left";
      var label = fmtMhz(top.freq) + " · " + Math.round(top.maxDb || top.lastDb || 0) + " dB";
      if (top.name) label += " · " + top.name;
      ctx.fillText(label, tx, lay.padT + 10);
    }
  }

  function bindRangeSpectrum() {
    var cv = $("bs-range-spectrum");
    if (!cv || rangeSpectrumBound) return;
    rangeSpectrumBound = true;
    cv.onclick = function (ev) {
      if (!rangeSpectrum.peaks.length) return;
      var rect = cv.getBoundingClientRect();
      var lay = rangeSpecLayout(rect.width);
      if (lay.plotW <= 0) return;
      var x = ev.clientX - rect.left;
      var frac = (x - lay.padL) / lay.plotW;
      if (frac < 0 || frac > 1) return;
      var mhz = rangeSpectrum.startMhz + frac * (rangeSpectrum.endMhz - rangeSpectrum.startMhz);
      var targetHz = mhz * 1e6;
      var best = null;
      var bestDx = 1e18;
      rangeSpectrum.peaks.forEach(function (h) {
        var dx = Math.abs(h.freq - targetHz);
        if (dx < bestDx) {
          bestDx = dx;
          best = h;
        }
      });
      if (!best) return;
      var tol = (rangeSpectrum.endMhz - rangeSpectrum.startMhz) * 1e6 * 0.02;
      if (bestDx > tol) return;
      tuneTo(best.freq, best.pid);
      setStatus("Tuned to " + fmtMhz(best.freq) + (best.name ? " · " + best.name : "") + ".");
    };
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () {
        if (!$("bs-range-spectrum-wrap") || $("bs-range-spectrum-wrap").hidden) return;
        drawRangeSpectrum();
      });
      ro.observe(cv);
    }
  }

  async function tuneToCenter(freqHz, profile, statusLabel) {
    if (!profile) return false;
    var needSwitch = currentProfileValue() !== profile.value;
    if (needSwitch) {
      await waitProfileGap(statusLabel || ("Range · " + fmtMhz(freqHz)));
      if (stopFlag) return false;
      await switchProfile(profile.value);
      lastProfileSwitchAt = Date.now();
    } else {
      await switchProfile(profile.value);
    }
    if (stopFlag) return false;
    pluginSetFrequency(freqHz);
    var target = freqHz;
    var settled = Date.now() + getHopSettleMs();
    while (Date.now() < settled && !stopFlag) {
      var c = typeof window.center_freq === "number" ? window.center_freq : 0;
      if (Math.abs(c - target) < 25000) break;
      await sleep(Math.min(150, settled - Date.now()));
    }
    while (Date.now() < settled && !stopFlag) {
      await sleep(Math.min(150, settled - Date.now()));
    }
    return !stopFlag;
  }

  function defaultSelected() {
    return profiles()
      .filter(function (p) { return /^air_[1-7]$/.test(p.id); })
      .map(function (p) { return p.value; });
  }


  /* —— Spectrum Analyzer tab (basic live spectrum / waterfall; OWRX tile + optional hop) —— */
  var SA_N_BINS = 512;
  var SA_WF_ROWS = 96;
  var sa = {
    running: false,
    hopGen: 0,
    bins: null,
    peakBins: null,
    avgBins: null,
    avgCount: 0,
    wf: null,
    wfRow: 0,
    dirty: false,
    hoverMhz: null,
    hoverDb: null,
    peakMhz: null,
    peakDb: null,
    bound: false
  };

  function saDefaultsPatch(d) {
    if (typeof d.saStartMhz !== "number" || !isFinite(d.saStartMhz)) d.saStartMhz = 88;
    if (typeof d.saEndMhz !== "number" || !isFinite(d.saEndMhz)) d.saEndMhz = 108;
    if (typeof d.saFollowTile !== "boolean") d.saFollowTile = false;
    if (typeof d.saPeakHold !== "boolean") d.saPeakHold = true;
    if (typeof d.saAvg !== "boolean") d.saAvg = true;
    if (typeof d.saAvgN !== "number" || !isFinite(d.saAvgN)) d.saAvgN = 6;
    if (typeof d.saAutoDb !== "boolean") d.saAutoDb = true;
    if (typeof d.saDbMin !== "number" || !isFinite(d.saDbMin)) d.saDbMin = -100;
    if (typeof d.saDbMax !== "number" || !isFinite(d.saDbMax)) d.saDbMax = -20;
    if (typeof d.saHopMs !== "number" || !isFinite(d.saHopMs)) d.saHopMs = 450;
    if (typeof d.saLiveOnOpen !== "boolean") d.saLiveOnOpen = false;
    return d;
  }

  function saEnsureBuffers() {
    if (!sa.bins || sa.bins.length !== SA_N_BINS) {
      sa.bins = new Float32Array(SA_N_BINS);
      sa.peakBins = new Float32Array(SA_N_BINS);
      sa.avgBins = new Float32Array(SA_N_BINS);
      sa.wf = new Float32Array(SA_N_BINS * SA_WF_ROWS);
      sa.avgCount = 0;
      sa.wfRow = 0;
      var i;
      for (i = 0; i < SA_N_BINS; i++) {
        sa.bins[i] = -120;
        sa.peakBins[i] = -120;
        sa.avgBins[i] = -120;
      }
      for (i = 0; i < sa.wf.length; i++) sa.wf[i] = -120;
    }
  }

  function saSpanHz() {
    if (S.saFollowTile) {
      var c = Number(window.center_freq) || 0;
      var bw = Number(window.bandwidth) || 2.4e6;
      return { lo: c - bw / 2, hi: c + bw / 2 };
    }
    var lo = (Number(S.saStartMhz) || 88) * 1e6;
    var hi = (Number(S.saEndMhz) || 108) * 1e6;
    if (hi <= lo) hi = lo + 1e6;
    return { lo: lo, hi: hi };
  }

  function saResetTraces() {
    saEnsureBuffers();
    var i;
    for (i = 0; i < SA_N_BINS; i++) {
      sa.bins[i] = -120;
      sa.peakBins[i] = -120;
      sa.avgBins[i] = -120;
    }
    for (i = 0; i < sa.wf.length; i++) sa.wf[i] = -120;
    sa.avgCount = 0;
    sa.wfRow = 0;
    sa.peakMhz = null;
    sa.peakDb = null;
    sa.dirty = true;
  }

  function saSetStatus(msg) {
    var el = $("bs-sa-status");
    if (el) el.textContent = msg || "";
  }

  function saReadForm() {
    if ($("bs-sa-start")) S.saStartMhz = Math.max(0.01, Number($("bs-sa-start").value) || S.saStartMhz);
    if ($("bs-sa-end")) S.saEndMhz = Math.max(S.saStartMhz + 0.05, Number($("bs-sa-end").value) || S.saEndMhz);
    if ($("bs-sa-follow")) S.saFollowTile = $("bs-sa-follow").checked;
    if ($("bs-sa-peak")) S.saPeakHold = $("bs-sa-peak").checked;
    if ($("bs-sa-avg")) S.saAvg = $("bs-sa-avg").checked;
    if ($("bs-sa-avgn")) S.saAvgN = Math.max(1, Math.min(32, Number($("bs-sa-avgn").value) || 6));
    if ($("bs-sa-autodb")) S.saAutoDb = $("bs-sa-autodb").checked;
    if ($("bs-sa-dbmin")) S.saDbMin = Number($("bs-sa-dbmin").value);
    if ($("bs-sa-dbmax")) S.saDbMax = Number($("bs-sa-dbmax").value);
    if ($("bs-sa-hop")) S.saHopMs = Math.max(150, Math.min(5000, Number($("bs-sa-hop").value) || 450));
    if ($("bs-sa-live-open")) S.saLiveOnOpen = $("bs-sa-live-open").checked;
    if (S.saDbMax <= S.saDbMin) S.saDbMax = S.saDbMin + 10;
    saveSettings();
  }

  function saFillForm() {
    saDefaultsPatch(S);
    if ($("bs-sa-start")) $("bs-sa-start").value = S.saStartMhz;
    if ($("bs-sa-end")) $("bs-sa-end").value = S.saEndMhz;
    if ($("bs-sa-follow")) $("bs-sa-follow").checked = !!S.saFollowTile;
    if ($("bs-sa-peak")) $("bs-sa-peak").checked = S.saPeakHold !== false;
    if ($("bs-sa-avg")) $("bs-sa-avg").checked = S.saAvg !== false;
    if ($("bs-sa-avgn")) $("bs-sa-avgn").value = S.saAvgN || 6;
    if ($("bs-sa-autodb")) $("bs-sa-autodb").checked = S.saAutoDb !== false;
    if ($("bs-sa-dbmin")) $("bs-sa-dbmin").value = S.saDbMin;
    if ($("bs-sa-dbmax")) $("bs-sa-dbmax").value = S.saDbMax;
    if ($("bs-sa-hop")) $("bs-sa-hop").value = S.saHopMs || 450;
    if ($("bs-sa-live-open")) $("bs-sa-live-open").checked = !!S.saLiveOnOpen;
    saUpdateLiveBtn();
  }

  function saUpdateLiveBtn() {
    var btn = $("bs-sa-live");
    if (!btn) return;
    btn.textContent = sa.running ? "Live on" : "Live off";
    btn.classList.toggle("bs-on", sa.running);
    btn.classList.toggle("bs-primary", sa.running);
    btn.title = sa.running
      ? "Stop live spectrum (stops hopping; leaves receiver where it is)."
      : "Start live spectrum across Start–End MHz (or current tile if Follow tile).";
  }

  function saIngestTile() {
    if (!sa.running) return;
    hookWaterfall();
    var data = wf();
    if (!data || !data.length) return;
    var center = Number(window.center_freq);
    var bw = Number(window.bandwidth);
    if (!center || !bw) return;
    saEnsureBuffers();
    var span = saSpanHz();
    var lo = span.lo;
    var hi = span.hi;
    var spanHz = hi - lo;
    if (spanHz <= 0) return;
    var tileLo = center - bw / 2;
    var tileHi = center + bw / 2;
    var i;
    var peakDb = -999;
    var peakMhz = null;
    for (i = 0; i < data.length; i++) {
      var f = tileLo + (i / data.length) * bw;
      if (f < lo || f > hi) continue;
      var bi = Math.round(((f - lo) / spanHz) * (SA_N_BINS - 1));
      if (bi < 0 || bi >= SA_N_BINS) continue;
      var db = Number(data[i]);
      if (!isFinite(db)) continue;
      /* keep loudest sample in bin this frame */
      if (db > sa.bins[bi] || sa.bins[bi] <= -119) sa.bins[bi] = db;
      if (S.saPeakHold !== false) sa.peakBins[bi] = Math.max(sa.peakBins[bi], db);
      if (S.saAvg !== false) {
        var n = Math.max(1, S.saAvgN || 6);
        if (sa.avgCount < 1) sa.avgBins[bi] = db;
        else sa.avgBins[bi] = sa.avgBins[bi] + (db - sa.avgBins[bi]) / Math.min(n, sa.avgCount + 1);
      }
    }
    sa.avgCount++;
    /* push waterfall row from displayed trace */
    var row = sa.wfRow % SA_WF_ROWS;
    for (i = 0; i < SA_N_BINS; i++) {
      var v = (S.saAvg !== false) ? sa.avgBins[i] : sa.bins[i];
      if (S.saPeakHold !== false) v = Math.max(v, sa.peakBins[i] > -119 ? sa.peakBins[i] : v);
      sa.wf[row * SA_N_BINS + i] = v;
      if (v > peakDb) {
        peakDb = v;
        peakMhz = lo / 1e6 + (i / (SA_N_BINS - 1)) * (spanHz / 1e6);
      }
    }
    sa.wfRow++;
    sa.peakDb = peakDb > -900 ? peakDb : null;
    sa.peakMhz = peakMhz;
    /* decay live bins slightly so motion shows */
    for (i = 0; i < SA_N_BINS; i++) {
      if (sa.bins[i] > -119) sa.bins[i] *= 0.92;
      if (sa.bins[i] < -120) sa.bins[i] = -120;
    }
    sa.dirty = true;
    saDraw();
  }

  function saDbRange() {
    if (S.saAutoDb !== false) {
      var i, mn = 999, mx = -999, seen = 0;
      for (i = 0; i < SA_N_BINS; i++) {
        var v = sa.avgBins[i];
        if (S.saPeakHold !== false && sa.peakBins[i] > v) v = sa.peakBins[i];
        if (v <= -119) continue;
        seen++;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      if (seen < 8) return { min: S.saDbMin, max: S.saDbMax };
      if (mx <= mn) mx = mn + 10;
      return { min: mn - 5, max: mx + 3 };
    }
    return { min: S.saDbMin, max: S.saDbMax };
  }

  function saColor(t) {
    /* simple turbo-ish: blue → cyan → yellow → red */
    t = Math.max(0, Math.min(1, t));
    var r, g, b;
    if (t < 0.25) {
      r = 0; g = Math.round(40 + t / 0.25 * 180); b = 255;
    } else if (t < 0.5) {
      r = 0; g = 255; b = Math.round(255 - (t - 0.25) / 0.25 * 255);
    } else if (t < 0.75) {
      r = Math.round((t - 0.5) / 0.25 * 255); g = 255; b = 0;
    } else {
      r = 255; g = Math.round(255 - (t - 0.75) / 0.25 * 200); b = 0;
    }
    return [r, g, b];
  }

  function saDraw() {
    if (!sa.dirty && !sa.running) return;
    var cv = $("bs-sa-spec");
    var wfCv = $("bs-sa-wf");
    if (!cv || !wfCv) return;
    saEnsureBuffers();
    var span = saSpanHz();
    var loMhz = span.lo / 1e6;
    var hiMhz = span.hi / 1e6;
    var dpr = window.devicePixelRatio || 1;
    var cssW = cv.clientWidth || 320;
    var specH = 150;
    var wfH = 110;
    var padL = 42, padR = 8, padT = 10, padB = 22;
    var plotW = cssW - padL - padR;
    var plotH = specH - padT - padB;
    cv.style.height = specH + "px";
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(specH * dpr);
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05080f";
    ctx.fillRect(0, 0, cssW, specH);
    var dbR = saDbRange();
    var i, x, y, v, t;
    ctx.strokeStyle = "rgba(51,65,85,0.7)";
    ctx.strokeRect(padL + 0.5, padT + 0.5, plotW - 1, plotH - 1);
    ctx.fillStyle = "#64748b";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    for (i = 0; i <= 4; i++) {
      y = padT + (plotH * i / 4);
      ctx.strokeStyle = "rgba(30,41,59,0.9)";
      ctx.beginPath();
      ctx.moveTo(padL, y + 0.5);
      ctx.lineTo(padL + plotW, y + 0.5);
      ctx.stroke();
      ctx.fillText(Math.round(dbR.max - (dbR.max - dbR.min) * (i / 4)) + "", padL - 4, y + 3);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    var ticks = Math.max(6, Math.min(12, Math.floor(plotW / 48)));
    for (i = 0; i < ticks; i++) {
      var frac = i / (ticks - 1);
      x = padL + frac * plotW;
      ctx.fillText((loMhz + frac * (hiMhz - loMhz)).toFixed(hiMhz - loMhz > 20 ? 1 : 3), x, specH - 6);
    }
    function trace(arr, color, width) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      var started = false;
      for (i = 0; i < SA_N_BINS; i++) {
        v = arr[i];
        if (v <= -119) continue;
        t = (v - dbR.min) / (dbR.max - dbR.min || 1);
        x = padL + (i / (SA_N_BINS - 1)) * plotW;
        y = padT + plotH - Math.max(0, Math.min(1, t)) * plotH;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      if (started) ctx.stroke();
    }
    if (S.saPeakHold !== false) trace(sa.peakBins, "rgba(248,113,113,0.85)", 1.2);
    if (S.saAvg !== false) trace(sa.avgBins, "#38bdf8", 1.6);
    else trace(sa.bins, "#38bdf8", 1.6);
    if (sa.hoverMhz != null) {
      x = padL + ((sa.hoverMhz - loMhz) / (hiMhz - loMhz || 1)) * plotW;
      ctx.strokeStyle = "rgba(250,204,21,0.8)";
      ctx.beginPath();
      ctx.moveTo(x + 0.5, padT);
      ctx.lineTo(x + 0.5, padT + plotH);
      ctx.stroke();
    }
    var read = $("bs-sa-readout");
    if (read) {
      var bits = [];
      if (sa.peakMhz != null) bits.push("Peak " + sa.peakMhz.toFixed(4) + " MHz · " + (sa.peakDb != null ? sa.peakDb.toFixed(1) + " dB" : ""));
      if (sa.hoverMhz != null) bits.push("Cursor " + sa.hoverMhz.toFixed(4) + " MHz" + (sa.hoverDb != null ? " · " + sa.hoverDb.toFixed(1) + " dB" : ""));
      bits.push("uncalibrated");
      read.textContent = bits.join("  ·  ");
    }

    /* waterfall */
    wfCv.style.height = wfH + "px";
    wfCv.width = Math.round(cssW * dpr);
    wfCv.height = Math.round(wfH * dpr);
    var wctx = wfCv.getContext("2d");
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var img = wctx.createImageData(Math.max(1, Math.floor(cssW)), Math.max(1, Math.floor(wfH)));
    var w = img.width, h = img.height;
    var row, col, srcRow, bi, c3, idx;
    for (row = 0; row < h; row++) {
      srcRow = (sa.wfRow - 1 - row + SA_WF_ROWS * 8) % SA_WF_ROWS;
      for (col = 0; col < w; col++) {
        bi = Math.floor((col / w) * SA_N_BINS);
        v = sa.wf[srcRow * SA_N_BINS + bi];
        t = (v - dbR.min) / (dbR.max - dbR.min || 1);
        c3 = saColor(t);
        idx = (row * w + col) * 4;
        img.data[idx] = c3[0];
        img.data[idx + 1] = c3[1];
        img.data[idx + 2] = c3[2];
        img.data[idx + 3] = 255;
      }
    }
    wctx.putImageData(img, 0, 0);
    sa.dirty = false;
  }

  function saMhzFromEvent(ev, canvas) {
    var span = saSpanHz();
    var r = canvas.getBoundingClientRect();
    var padL = 42, padR = 8;
    var plotW = Math.max(1, r.width - padL - padR);
    var x = ev.clientX - r.left - padL;
    var frac = Math.max(0, Math.min(1, x / plotW));
    return span.lo / 1e6 + frac * ((span.hi - span.lo) / 1e6);
  }

  function saBindUi() {
    if (sa.bound) return;
    sa.bound = true;
    function apply() {
      saReadForm();
      saResetTraces();
      saSetStatus("Span " + Number(S.saStartMhz).toFixed(3) + "–" + Number(S.saEndMhz).toFixed(3) + " MHz");
      if (sa.running && !S.saFollowTile) {
        sa.hopGen++;
        saStartHopLoop();
      }
    }
    ["bs-sa-start", "bs-sa-end", "bs-sa-follow", "bs-sa-peak", "bs-sa-avg", "bs-sa-avgn",
     "bs-sa-autodb", "bs-sa-dbmin", "bs-sa-dbmax", "bs-sa-hop", "bs-sa-live-open"].forEach(function (id) {
      if ($(id)) $(id).onchange = apply;
    });
    if ($("bs-sa-apply")) $("bs-sa-apply").onclick = apply;
    if ($("bs-sa-live")) $("bs-sa-live").onclick = function () {
      if (sa.running) saStop();
      else saStart();
    };
    if ($("bs-sa-clear-peak")) $("bs-sa-clear-peak").onclick = function () {
      saEnsureBuffers();
      var i;
      for (i = 0; i < SA_N_BINS; i++) sa.peakBins[i] = -120;
      sa.dirty = true;
      saDraw();
      saSetStatus("Peak hold cleared.");
    };
    if ($("bs-sa-presets")) {
      $("bs-sa-presets").onclick = function (ev) {
        var b = ev.target && ev.target.closest("[data-sa-preset]");
        if (!b) return;
        var p = b.getAttribute("data-sa-preset").split("-");
        if ($("bs-sa-start")) $("bs-sa-start").value = p[0];
        if ($("bs-sa-end")) $("bs-sa-end").value = p[1];
        if ($("bs-sa-follow")) $("bs-sa-follow").checked = false;
        apply();
      };
    }
    function onMove(ev) {
      var cv = $("bs-sa-spec");
      if (!cv) return;
      sa.hoverMhz = saMhzFromEvent(ev, cv);
      var span = saSpanHz();
      var bi = Math.round(((sa.hoverMhz * 1e6 - span.lo) / (span.hi - span.lo || 1)) * (SA_N_BINS - 1));
      bi = Math.max(0, Math.min(SA_N_BINS - 1, bi));
      sa.hoverDb = sa.avgBins[bi] > -119 ? sa.avgBins[bi] : sa.bins[bi];
      sa.dirty = true;
      saDraw();
    }
    function onLeave() {
      sa.hoverMhz = null;
      sa.hoverDb = null;
      sa.dirty = true;
      saDraw();
    }
    function onClick(ev) {
      var cv = $("bs-sa-spec");
      if (!cv) return;
      var mhz = saMhzFromEvent(ev, cv);
      var hz = Math.round(mhz * 1e6);
      var p = profileForFreq(hz);
      if (p) {
        bsInternalTune = true;
        tuneToCenter(hz, p, "Analyzer · tune").then(function () {
          bsInternalTune = false;
          saSetStatus("Tuned " + mhz.toFixed(4) + " MHz");
        }).catch(function () { bsInternalTune = false; });
      } else if (typeof UI !== "undefined" && UI.setFrequency) {
        UI.setFrequency(hz);
        saSetStatus("Tuned " + mhz.toFixed(4) + " MHz");
      }
    }
    var spec = $("bs-sa-spec");
    var wfc = $("bs-sa-wf");
    if (spec) {
      spec.addEventListener("mousemove", onMove);
      spec.addEventListener("mouseleave", onLeave);
      spec.addEventListener("click", onClick);
    }
    if (wfc) {
      wfc.addEventListener("mousemove", onMove);
      wfc.addEventListener("mouseleave", onLeave);
      wfc.addEventListener("click", onClick);
    }
  }

  function saBuildCenters() {
    var span = saSpanHz();
    var step = rangeStepHz();
    return buildRangeCenters(span.lo, span.hi, step);
  }

  function saStartHopLoop() {
    var gen = ++sa.hopGen;
    (async function loop() {
      while (sa.running && sa.hopGen === gen) {
        if (running || listenScanRunning) {
          saSetStatus("Survey/bookmark scan running — analyzer hop paused (still drawing current tile).");
          saIngestTile();
          await sleep(400);
          continue;
        }
        if (S.saFollowTile) {
          saIngestTile();
          saSetStatus("Follow tile · " + fmtMhz(window.center_freq || 0) + " ± " +
            ((Number(window.bandwidth) || 0) / 2e6).toFixed(3) + " MHz");
          await sleep(120);
          continue;
        }
        if (typeof courtesyBlocked === "function" && courtesyBlocked("analyzer")) {
          saSetStatus("Other listeners online — hop paused (Only if alone). Untick to hop.");
          saIngestTile();
          await sleep(800);
          continue;
        }
        var centers = saBuildCenters();
        if (!centers.length) {
          saSetStatus("No hop centers for this span — check Start/End MHz.");
          await sleep(800);
          continue;
        }
        var ci;
        for (ci = 0; ci < centers.length && sa.running && sa.hopGen === gen; ci++) {
          if (running || listenScanRunning) break;
          if (typeof courtesyBlocked === "function" && courtesyBlocked("analyzer")) break;
          var freqHz = centers[ci];
          var p = profileForFreq(freqHz);
          if (!p) continue;
          saSetStatus("Live · hop " + (ci + 1) + "/" + centers.length + " · " + fmtMhz(freqHz));
          try {
            stopFlag = false;
            await tuneToCenter(freqHz, p, "Analyzer");
          } catch (e1) {}
          var waitUntil = Date.now() + Math.max(150, S.saHopMs || 450);
          while (Date.now() < waitUntil && sa.running && sa.hopGen === gen) {
            saIngestTile();
            await sleep(80);
          }
        }
      }
    })();
  }

  function saStart() {
    saReadForm();
    hookWaterfall();
    saEnsureBuffers();
    sa.running = true;
    saUpdateLiveBtn();
    saSetStatus("Live spectrum starting…");
    saStartHopLoop();
  }

  function saStop() {
    sa.running = false;
    sa.hopGen++;
    saUpdateLiveBtn();
    saSetStatus("Live off.");
  }

  function saOnWaterfall() {
    if (!sa.running) return;
    if (S.saFollowTile || !sa.running) saIngestTile();
    else saIngestTile();
  }

  function saOnTab(name) {
    if (name === "analyzer") {
      saFillForm();
      saBindUi();
      sa.dirty = true;
      saDraw();
      if (S.saLiveOnOpen && !sa.running) saStart();
    } else if (sa.running && name !== "analyzer") {
      /* keep running in background so hop can continue; optional stop — keep running */
    }
  }

  function hookWaterfall() {
    if (window._bs_wf_hooked) return;
    if (typeof window.waterfall_add !== "function") return;
    var orig = window.waterfall_add;
    window.waterfall_add = function (data) {
      window.bs_wf_data = data;
      window.fs_wf_data = data;
      try { if (typeof saOnWaterfall === "function") saOnWaterfall(); } catch (eSa) {}
      return orig.apply(this, arguments);
    };
    window._bs_wf_hooked = true;
  }

  function wf() {
    return window.bs_wf_data || window.fs_wf_data || null;
  }

  function noiseFloor(data) {
    if (!data || data.length < 16) return -80;
    var copy = Array.prototype.slice.call(data).sort(function (a, b) { return a - b; });
    return copy[Math.floor(copy.length * 0.2)];
  }

  function profileLabelForPid(pid) {
    var list = profiles();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i].id === pid) return list[i].label || "";
    }
    return "";
  }

  function isBroadcastFmFreq(freqHz) {
    return freqHz >= 76000000 && freqHz <= 108500000;
  }

  function isHfBroadcastFreq(freqHz) {
    return freqHz >= 150000 && freqHz <= 30000000;
  }

  function isFmBroadcastProfile(pid, label) {
    if (/^fm_/i.test(pid || "")) return true;
    var s = String(label != null ? label : profileLabelForPid(pid)).toLowerCase();
    return /fm\s*broadcast|broadcast\s*fm/.test(s);
  }

  function isHfBroadcastProfile(pid, label) {
    var id = String(pid || "").toLowerCase();
    if (/^lf$|^hffax$/.test(id)) return true;
    var s = String(label != null ? label : profileLabelForPid(pid)).toLowerCase();
    return /broadcast|\bmw\b|\bsw\b|navtex|volmet|fax|wwv|shortwave|mediumwave|medium wave/.test(s);
  }

  function isBroadcastFmRange(startHz, endHz) {
    return startHz < 108e6 && endHz > 76e6;
  }

  function isHfBroadcastRange(startHz, endHz) {
    return startHz < 30e6 && endHz > 150e3;
  }

  function useWidebandPeakDetect(pid, label, freqHz) {
    if (S.widebandPeaks === false) return false;
    if (isFmBroadcastProfile(pid, label)) return true;
    if (isHfBroadcastProfile(pid, label)) return true;
    var f = freqHz || window.center_freq || 0;
    if (isBroadcastFmFreq(f)) return true;
    return isHfBroadcastFreq(f);
  }

  function noiseFloorForDetect(data, pid, label, freqHz) {
    var floor = noiseFloor(data);
    if (!useWidebandPeakDetect(pid, label, freqHz)) return floor;
    var lo = Math.floor(data.length * EDGE_FRAC);
    var hi = Math.ceil(data.length * (1 - EDGE_FRAC));
    var edge = [];
    var i;
    for (i = lo; i < Math.min(lo + 12, hi); i++) edge.push(data[i]);
    for (i = Math.max(hi - 12, lo); i < hi; i++) edge.push(data[i]);
    if (edge.length >= 4) {
      edge.sort(function (a, b) { return a - b; });
      floor = Math.min(floor, edge[Math.floor(edge.length * 0.25)]);
    }
    var copy = Array.prototype.slice.call(data).sort(function (a, b) { return a - b; });
    floor = Math.min(floor, copy[Math.floor(copy.length * 0.08)]);
    return floor;
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
    else if (isHfBroadcastProfile(pid) || (isHfBroadcastFreq(freq) && S.widebandPeaks !== false)) {
      step = freq < 3e6 ? 9000 : 5000;
    }
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

  function isFmPid(pid) {
    return /^fm_/i.test(pid || "");
  }

  function peakDetectThreshold(floor, pid, label, freqHz) {
    var t = Number(S.threshDb) || 10;
    if (useWidebandPeakDetect(pid, label, freqHz)) return floor + Math.max(t, 2);
    if (isHfBroadcastFreq(freqHz || window.center_freq || 0)) return floor + Math.max(t, 3);
    return floor + Math.max(t, 4);
  }

  function mergePeakCandidates(list, pid) {
    if (!list.length) return list;
    list.sort(function (a, b) { return a.freq - b.freq; });
    var tol = mergeHz(pid);
    var out = [];
    list.forEach(function (p) {
      var last = out[out.length - 1];
      if (last && Math.abs(last.freq - p.freq) <= tol) {
        if (p.db > last.db) {
          last.freq = p.freq;
          last.raw = p.raw;
          last.db = p.db;
          last.width = Math.max(last.width || 1, p.width || 1);
          last.offset = p.offset;
        }
        return;
      }
      out.push({
        freq: p.freq,
        raw: p.raw,
        db: p.db,
        width: p.width || 1,
        offset: p.offset
      });
    });
    return out;
  }

  function findPeaksFm(data, center, bw, thr, pid) {
    var lo = Math.floor(data.length * EDGE_FRAC);
    var hi = Math.ceil(data.length * (1 - EDGE_FRAC));
    var raw = [];
    var i = lo;
    while (i < hi) {
      if (data[i] < thr) {
        i++;
        continue;
      }
      var maxV = -999;
      var maxI = i;
      var n = 0;
      while (i < hi && data[i] >= thr) {
        n++;
        if (data[i] > maxV) {
          maxV = data[i];
          maxI = i;
        }
        i++;
      }
      if (n >= 1) {
        var f2 = freqOf(maxI, data);
        raw.push({
          freq: snapFreq(f2, pid),
          raw: f2,
          db: maxV,
          width: Math.max(n, 4),
          offset: f2 - center
        });
      }
    }
    for (i = lo + 1; i < hi - 1; i++) {
      if (data[i] < thr) continue;
      if (data[i] < data[i - 1] || data[i] < data[i + 1]) continue;
      var f = freqOf(i, data);
      raw.push({
        freq: snapFreq(f, pid),
        raw: f,
        db: data[i],
        width: Math.max(4, Math.round(bw / data.length / 80000)),
        offset: f - center
      });
    }
    var out = [];
    raw.forEach(function (p) {
      if (isIgnoredFreq(p.freq)) return;
      out.push(p);
    });
    return mergePeakCandidates(out, pid);
  }

  function findPeaks(pid, label) {
    var data = wf();
    var center = window.center_freq;
    var bw = window.bandwidth;
    if (!data || !data.length || !bw) return [];
    var floor = noiseFloorForDetect(data, pid, label, center);
    var thr = peakDetectThreshold(floor, pid, label, center);
    if (useWidebandPeakDetect(pid, label, center)) return findPeaksFm(data, center, bw, thr, pid);
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
      // n=1 would always fail max<mean+1.2; only skip flat broadband blobs (not WFM).
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
    if (isHfBroadcastProfile(pid)) return 10000;
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
    if (useWidebandPeakDetect(h.pid, h.label, h.freq)) {
      h.spur = false;
      h.spurWhy = "";
      return;
    }
    var looks = h.looks || 0;
    var duty = looks ? h.seen / looks : 0;
    var live = stddev(h.samples);
    var voice = !alwaysOnBand(h.pid, h.label);

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
    var peaks = findPeaks(pid, label);
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
      notifyNewPeak("New " + (h.name || existingName(h.freq) || icao833(h.freq) || fmtMhz(h.freq)), h);
    });
    trimPeaksIfNeeded();
  }

  function fmtMhzNum(hz) {
    if (hz == null || !isFinite(hz)) return "";
    return (hz / 1e6).toFixed(hz >= 3e7 ? 3 : 3);
  }

  function fmtMhz(hz) {
    var n = fmtMhzNum(hz);
    return n ? n + " MHz" : "";
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
        if (b.auto && !/^\[auto\]/i.test(name)) b.auto = false;
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
    askRenameBookmark(freq, "local");
  }

  function renameLoadedBookmark(freq, name) {
    name = String(name || "").trim();
    if (!name) return false;
    var found = false;
    loadedBookmarks.forEach(function (b) {
      if (Math.abs(b.frequency - freq) < 2500) {
        b.name = name;
        found = true;
      }
    });
    if (!found) return false;
    saveLoadedBookmarks();
    hits.forEach(function (h) {
      if (Math.abs(h.freq - freq) < 2500) h.name = name;
    });
    saveHits();
    renderBookmarkPane();
    renderHits();
    return true;
  }

  function askRenameBookmark(freq, kind) {
    kind = kind || "local";
    var cur = "";
    if (kind === "loaded") {
      loadedBookmarks.forEach(function (b) {
        if (Math.abs(b.frequency - freq) < 2500) cur = b.name || "";
      });
    } else {
      var list = localBookmarkList() || [];
      list.forEach(function (b) {
        if (Math.abs(b.frequency - freq) < 2500) cur = b.name || bookmarkDisplayName(b);
      });
      if (!cur) {
        hits.forEach(function (h) {
          if (Math.abs(h.freq - freq) < 2500) cur = h.name || "";
        });
      }
    }
    if (!cur) cur = existingName(freq) || fmtMhz(freq);
    var next = window.prompt("Bookmark name for " + fmtMhz(freq), cur);
    if (next == null) return;
    next = next.trim();
    if (!next) return;
    var ok = kind === "loaded" ? renameLoadedBookmark(freq, next) : renameBookmark(freq, next);
    if (ok) setStatus("Renamed to “" + next + "”.");
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

  var smeterTrack = [];

  function smeterLin() {
    var v = window.smeter_level;
    return (typeof v === "number" && isFinite(v) && v > 0) ? v : null;
  }

  function smeterDb() {
    var lin = smeterLin();
    if (lin == null) return null;
    if (typeof window.getLogSmeterValue === "function") return window.getLogSmeterValue(lin);
    return 10 * Math.log10(lin);
  }

  function squelchSliderDb() {
    try {
      if (window.UI && typeof UI.getDemodulatorPanel === "function") {
        var panel = UI.getDemodulatorPanel();
        if (panel && panel.el) {
          var raw = panel.el.find(".openwebrx-squelch-slider").val();
          var n = parseFloat(raw);
          if (isFinite(n)) return n;
        }
      }
      if (window.UI && typeof UI.getDemodulator === "function") {
        var demod = UI.getDemodulator();
        if (demod && typeof demod.getSquelch === "function") {
          var sq = demod.getSquelch();
          if (isFinite(sq)) return sq;
        }
      }
    } catch (e) {}
    return null;
  }

  function squelchOpen() {
    var db = smeterDb();
    var thr = squelchSliderDb();
    if (db == null || thr == null) return null;
    return db >= thr;
  }

  function trackSmeterSample() {
    var db = smeterDb();
    if (db == null) return;
    smeterTrack.push(db);
    if (smeterTrack.length > SMETER_TRACK_N) smeterTrack.shift();
  }

  function smeterModulation() {
    return stddev(smeterTrack);
  }

  function isAirbandPid(pid, mode) {
    var m = mode || guessMode(pid);
    return /^air_|^vor/.test(pid || "") || m === "am";
  }

  function levelAtWindow(freq, halfBins) {
    halfBins = halfBins || 1;
    var data = wf();
    var center = window.center_freq;
    var bw = window.bandwidth;
    if (!data || !data.length || !bw) return -999;
    var i = Math.floor((freq - (center - bw / 2)) / bw * data.length);
    var best = -999;
    var lo = Math.max(0, i - halfBins);
    var hi = Math.min(data.length - 1, i + halfBins);
    for (var j = lo; j <= hi; j++) {
      if (data[j] > best) best = data[j];
    }
    return best;
  }

  function localNoiseNear(freq, halfBins) {
    halfBins = halfBins || 6;
    var data = wf();
    var center = window.center_freq;
    var bw = window.bandwidth;
    if (!data || !data.length || !bw) return noiseFloor(data);
    var i = Math.floor((freq - (center - bw / 2)) / bw * data.length);
    var samples = [];
    var lo = Math.max(0, i - halfBins);
    var hi = Math.min(data.length - 1, i + halfBins);
    for (var j = lo; j <= hi; j++) {
      if (Math.abs(j - i) <= 1) continue;
      samples.push(data[j]);
    }
    if (samples.length < 4) return noiseFloor(data);
    samples.sort(function (a, b) { return a - b; });
    return samples[Math.floor(samples.length * 0.35)];
  }

  function listenRecordThreshold(floor, pid, mode) {
    var t = Number(S.threshDb) || 7;
    if (isAirbandPid(pid, mode)) return floor + Math.max(t, 9);
    if (/^fm_/.test(pid || "")) return floor + Math.max(t - 1, 5);
    return floor + Math.max(t, 6);
  }

  function normalizeRecMode(mode) {
    if (mode === REC_MODE_BALANCED || mode === REC_MODE_STRICT) return mode;
    return REC_MODE_ORIGINAL;
  }

  function recGateParams() {
    var mode = normalizeRecMode(S.recMode);
    var p = {
      mode: mode,
      debounceMs: 250,
      quietMs: 700,
      minActiveMs: 450,
      minActiveRatio: 0.1,
      minSnr: 4,
      airMinSnr: 5,
      wfMinSnr: 5,
      airWfMinSnr: 6,
      squelchHeadroom: 1.5,
      airSquelchHeadroom: 2,
      modMin: 0.5,
      airModMin: 0.7,
      pauseOnQuiet: false,
      discardWeak: true,
      squelchOnly: S.recSquelchOnly !== false
    };
    if (mode === REC_MODE_ORIGINAL) {
      p.debounceMs = 0;
      p.quietMs = 999999;
      p.minActiveMs = 0;
      p.minActiveRatio = 0;
      p.pauseOnQuiet = false;
      p.discardWeak = false;
      p.squelchOnly = false;
    } else if (mode === REC_MODE_STRICT) {
      p.debounceMs = REC_SIGNAL_DEBOUNCE_MS;
      p.quietMs = REC_SIGNAL_QUIET_MS;
      p.minActiveMs = MIN_CLIP_ACTIVE_MS;
      p.minActiveRatio = MIN_CLIP_ACTIVE_RATIO;
      p.minSnr = 6;
      p.airMinSnr = 7;
      p.wfMinSnr = 6;
      p.airWfMinSnr = 9;
      p.squelchHeadroom = 2;
      p.airSquelchHeadroom = 4;
      p.modMin = 0.9;
      p.airModMin = 1.2;
      p.pauseOnQuiet = true;
      p.discardWeak = true;
      p.squelchOnly = S.recSquelchOnly !== false;
    }
    var snr = Number(S.recMinSnrDb);
    if (isFinite(snr) && snr > 0) {
      p.minSnr = snr;
      p.airMinSnr = snr + 1;
      p.wfMinSnr = snr;
      p.airWfMinSnr = snr + 2;
    }
    var hd = Number(S.recSquelchHeadroomDb);
    if (isFinite(hd) && hd > 0) {
      p.squelchHeadroom = hd;
      p.airSquelchHeadroom = hd + 0.5;
    }
    var ratioPct = Number(S.recMinClipRatioPct);
    if (isFinite(ratioPct) && ratioPct > 0) {
      p.minActiveRatio = Math.min(0.95, ratioPct / 100);
    }
    var deb = Number(S.recDebounceMs);
    if (isFinite(deb) && deb > 0) p.debounceMs = Math.max(0, Math.min(3000, deb));
    var q = Number(S.recQuietMs);
    if (isFinite(q) && q > 0) p.quietMs = Math.max(100, Math.min(5000, q));
    return p;
  }

  function voiceSignalMetrics(freq, pid, mode) {
    var air = isAirbandPid(pid, mode);
    var lvl = levelAtWindow(freq, air ? 4 : 2);
    var floor = localNoiseNear(freq, air ? 10 : 6);
    var snr = lvl - floor;
    var thr = listenRecordThreshold(floor, pid, mode);
    trackSmeterSample();
    var sql = squelchOpen();
    var sdb = smeterDb();
    var sqlThr = squelchSliderDb();
    var smeterSnr = (sdb != null && sqlThr != null) ? sdb - sqlThr : null;
    return {
      lvl: lvl, floor: floor, snr: snr, thr: thr, sql: sql,
      sdb: sdb, smeterSnr: smeterSnr, mod: smeterModulation(), air: air
    };
  }

  function isRecordableVoice(freq, pid, mode, gate) {
    gate = gate || recGateParams();
    var m = voiceSignalMetrics(freq, pid, mode);
    if (gate.squelchOnly && m.sql === false) return false;
    if (gate.mode === REC_MODE_ORIGINAL) return true;
    var wfStrong = m.lvl >= m.thr && m.snr >= (m.air ? gate.airWfMinSnr : gate.wfMinSnr);
    var headroom = m.air ? gate.airSquelchHeadroom : gate.squelchHeadroom;
    var minSnr = m.air ? gate.airMinSnr : gate.minSnr;
    if (m.sql === true) {
      if (m.smeterSnr != null && m.smeterSnr >= headroom) return true;
      if (m.mod >= (m.air ? gate.airModMin : gate.modMin) &&
          m.smeterSnr != null && m.smeterSnr >= Math.max(0.5, headroom - 1.5)) return true;
      if (gate.mode === REC_MODE_STRICT) return false;
      return m.smeterSnr != null && m.smeterSnr >= 0.5 && m.mod >= (m.air ? gate.airModMin * 0.7 : gate.modMin * 0.7);
    }
    if (m.sql === false) return false;
    if (gate.squelchOnly) return false;
    return wfStrong && m.snr >= minSnr;
  }

  function shouldStartRecording(freq, pid, mode, isBusy, gate) {
    gate = gate || recGateParams();
    if (gate.mode === REC_MODE_ORIGINAL) return !!isBusy;
    return isRecordableVoice(freq, pid, mode, gate);
  }

  function listenActivityBusy(recGate, isBusy, recordable) {
    return recGate.mode === REC_MODE_ORIGINAL ? !!isBusy : !!recordable;
  }

  function listenActivityLabel(recGate, isBusy, recordable) {
    if (recGate.mode === REC_MODE_ORIGINAL) return isBusy ? " · busy" : " · quiet";
    return recordable ? " · voice" : (isBusy ? " · busy" : " · quiet");
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
    if (listenCmd === "prev") {
      /* leave channel; for-loop handles stepping back */
      return true;
    }
    return shouldSkipTune(freq);
  }

  function listenPassLabel(passNum) {
    return passNum > 0 ? ("Pass " + passNum + " · ") : "";
  }

  function listenBusyThreshold(floor) {
    return floor + Math.max(3, (Number(S.threshDb) || 7) - 3);
  }

  function readListenSettings() {
    if ($("bs-listensec")) S.listenSec = Math.max(1, Math.min(20, Number($("bs-listensec").value) || 4));
    if ($("bs-holdbusy")) S.holdBusy = $("bs-holdbusy").checked;
    if ($("bs-continuousbm")) S.continuousBmScan = $("bs-continuousbm").checked;
    if ($("bs-record")) S.recordBusy = $("bs-record").checked;
    readRecSettings();
  }

  function readRecSettings() {
    if ($("bs-recmode")) {
      var m = $("bs-recmode").value;
      S.recMode = normalizeRecMode(m);
    }
    if ($("bs-recsquelch")) S.recSquelchOnly = $("bs-recsquelch").checked;
    if ($("bs-recminsnr")) S.recMinSnrDb = Math.max(0, Number($("bs-recminsnr").value) || 0);
    if ($("bs-recheadroom")) S.recSquelchHeadroomDb = Math.max(0, Number($("bs-recheadroom").value) || 0);
    if ($("bs-recminratio")) S.recMinClipRatioPct = Math.max(0, Math.min(95, Number($("bs-recminratio").value) || 0));
    if ($("bs-recdebounce")) S.recDebounceMs = Math.max(0, Number($("bs-recdebounce").value) || 0);
    if ($("bs-recquiet")) S.recQuietMs = Math.max(0, Number($("bs-recquiet").value) || 0);
  }

  async function listenBookmarks(items, passNum, loopMode) {
    passNum = passNum || 0;
    loopMode = !!loopMode;
    var passLab = listenPassLabel(passNum);
    try {
    if (!items || !items.length) {
      setStatus(passLab + "Nothing to listen to yet.");
      return 0;
    }
    if (courtesyBlocked("listening / retuning")) return 0;
    readListenSettings();
    items = sortListenItemsExtra(items.filter(function (row) {
      var f = (row.hit || row).freq || row.frequency;
      return !shouldSkipTune(f);
    }));
    if (!items.length) {
      setStatus(passLab + "Everything is locked out or always-skipped right now.");
      return 0;
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
      if (listenCmd === "prev") {
        listenCmd = "";
        if (i > 0) i = Math.max(-1, i - 2);
        continue;
      }
      var it = items[i].hit || items[i];
      var freq = it.freq || it.frequency;
      var pid = it.pid;
      var name = it.name || existingName(freq) || icao833(freq) || fmtMhz(freq);
      listenFreq = freq;
      if (shouldSkipTune(freq)) continue;
      var value = profileValueForPid(pid);
      var prof = profileForFreq(freq);
      if (!prof && value) prof = profileByValue(value);
      if (!prof && value) prof = { id: pid || value, value: value, label: pid || value };
      if (consumeListenAbort(freq, name)) continue;
      if (prof) {
        if (!(await tuneToCenter(freq, prof, passLab + "Listen " + (i + 1) + "/" + items.length + " · " + name))) {
          if (stopFlag) break;
          continue;
        }
      } else {
        pluginSetFrequency(freq);
        var settled = Date.now() + getHopSettleMs();
        var abortHop = false;
        while (Date.now() < settled && !stopFlag) {
          if (consumeListenAbort(freq, name)) { abortHop = true; break; }
          await sleep(Math.min(LISTEN_SAMPLE_MS, Math.max(50, settled - Date.now())));
        }
        if (abortHop || stopFlag) continue;
      }
      if (consumeListenAbort(freq, name)) continue;
      if (it.mode && window.UI && typeof UI.setModulation === "function") {
        try { UI.setModulation(it.mode, ""); } catch (e3) {}
      }
      setStatus(passLab + "Listen " + (i + 1) + "/" + items.length + " · " + name + " · " + fmtMhz(freq) + "  [Hold / Skip / Always skip / Stop]");
      var holdBusy = loopMode ? false : (S.holdBusy !== false);
      var listenMs = Math.max(1000, (Number(S.listenSec) || 4) * 1000);
      var listenStart = Date.now();
      var minUntil = listenStart + listenMs;
      var busySeen = listenCmd === "hold";
      var recOn = false;
      var recPaused = false;
      var recStartedAt = 0;
      var recActiveMs = 0;
      var signalSince = 0;
      var recQuietSince = 0;
      var lastSampleAt = Date.now();
      var modeStr = it.mode || guessMode(pid);
      smeterTrack = [];
      var recGate = recGateParams();
      var quietSince = 0;
      var floor = noiseFloor(wf());
      var busyThr = listenBusyThreshold(floor);
      while (!stopFlag) {
        if (consumeListenAbort(freq, name)) break;
        floor = noiseFloor(wf());
        busyThr = listenBusyThreshold(floor);
        var lvl = levelAt(freq);
        var isBusy = lvl >= busyThr || listenCmd === "hold";
        var recordable = shouldStartRecording(freq, pid, modeStr, isBusy, recGate);
        var recordingActive = listenActivityBusy(recGate, isBusy, recordable);
        var now = Date.now();
        var dt = Math.min(LISTEN_SAMPLE_MS, Math.max(20, now - lastSampleAt));
        lastSampleAt = now;
        if (isBusy) {
          busySeen = true;
          quietSince = 0;
        } else if (busySeen && holdBusy) {
          if (!quietSince) quietSince = now;
        }
        if (recordingActive) {
          if (!signalSince) signalSince = now;
          recQuietSince = 0;
        } else if (recOn) {
          if (!recQuietSince) recQuietSince = now;
        } else {
          signalSince = 0;
        }
        if (S.recordBusy) {
          var debounceMs = recGate.debounceMs;
          if (!recOn && recordingActive && signalSince && (debounceMs <= 0 || (now - signalSince >= debounceMs))) {
            setRecording(true, { freq: freq, name: name, pid: pid, activeMs: 0 });
            recOn = true;
            recPaused = false;
            recStartedAt = now;
            recActiveMs = 0;
          } else if (recOn) {
            if (recordingActive) {
              if (recPaused) {
                resumeBusyCapture();
                recPaused = false;
              }
              if (recCap.rec && recCap.rec.state === "recording") recActiveMs += dt;
            } else if (recGate.pauseOnQuiet && recQuietSince && (now - recQuietSince >= recGate.quietMs)) {
              pauseBusyCapture();
              recPaused = true;
            } else if (!recGate.pauseOnQuiet && recCap.rec && recCap.rec.state === "recording") {
              recActiveMs += dt;
            }
            if (recCap.meta) recCap.meta.activeMs = recActiveMs;
          }
        }
        var canLeave = false;
        if (listenCmd === "hold") {
          canLeave = false;
        } else if (loopMode) {
          canLeave = now >= minUntil;
        } else if (!holdBusy) {
          canLeave = now >= minUntil;
        } else if (!busySeen) {
          canLeave = now >= minUntil;
        } else {
          canLeave = now >= minUntil && quietSince && (now - quietSince >= QUIET_HOLD_MS);
        }
        if (busySeen && !loopMode) {
          setListenPaused(true);
          var busyExtra = listenCmd === "hold" ? " · HOLD" : listenActivityLabel(recGate, isBusy, recordable);
          setStatus(passLab + "ACTIVE · " + (i + 1) + "/" + items.length + " · " + name + " · " + Math.round(lvl) + " dB" + busyExtra + " — Continue scan bookmarks");
        } else if (busySeen) {
          var busyExtraLoop = listenCmd === "hold" ? " · HOLD" : listenActivityLabel(recGate, isBusy, recordable);
          setStatus(passLab + "ACTIVE · " + (i + 1) + "/" + items.length + " · " + name + " · " + Math.round(lvl) + " dB" + busyExtraLoop);
        } else {
          if (!loopMode) setListenPaused(false);
          setStatus(passLab + "Listen " + (i + 1) + "/" + items.length + " · " + name + " · " + Math.round(lvl) + " dB · listening");
        }
        if (extraOn("recCaps") && recOn && recStartedAt &&
            (now - recStartedAt) >= Math.max(5000, (Number(S.maxClipSec) || 60) * 1000)) {
          canLeave = true;
        }
        if (canLeave) break;
        await sleep(LISTEN_SAMPLE_MS);
      }
      if (!loopMode) setListenPaused(false);
      if (busySeen) heard++;
      if (extraOn("sessionLog")) {
        pushSessionLog({
          at: Date.now(),
          freq: freq,
          name: name,
          busy: !!busySeen,
          clip: !!recOn,
          db: typeof lvl === "number" ? lvl : null
        });
      }
      if (recOn) {
        var recLeft = MIN_RECORD_MS - (Date.now() - recStartedAt);
        if (recLeft > 0) await sleep(recLeft);
        if (recCap.meta) {
          recCap.meta.activeMs = recActiveMs;
          recCap.meta.durationMs = Date.now() - recStartedAt;
        }
        setRecording(false);
      }
      if (listenCmd === "prev") {
        listenCmd = "";
        if (i > 0) i = Math.max(-1, i - 2);
      }
    }
      listenCmd = "";
      listenFreq = 0;
      if (!loopMode) setListenPaused(false);
      setRecording(false);
    if ($("bs-hold")) $("bs-hold").classList.remove("bs-on");
    if (loopMode) return heard;
    if (stopFlag) setStatus(passLab + "Listen stopped after " + heard + " busy bookmarks.");
    else setStatus(passLab + "Listen done. " + heard + " busy / " + items.length + " bookmarks.");
    return heard;
    } catch (err) {
      listenFreq = 0;
      setRecording(false);
      setListenPaused(false);
      setStatus(friendlyError(err, "Listen"));
      toast(friendlyError(err, "Listen"));
      renderHealth();
      return 0;
    }
  }

  async function runListenScanLoop() {
    var pass = 0;
    var totalHeard = 0;
    try {
      while (!stopFlag) {
        pass++;
        var list = scanTargetItems(pass > 1);
        if (!list.length) {
          setStatus("Pass " + pass + " · No bookmarks to scan — retrying in 3s… (Stop to exit)");
          var waitUntil = Date.now() + 3000;
          while (Date.now() < waitUntil && !stopFlag) await sleep(200);
          continue;
        }
        if (pass === 1) {
          setStatus("Scan bookmarks — looping " + list.length + " target(s) until Stop");
        }
        var heard = await listenBookmarks(list, pass, continuousBmScanOn());
        totalHeard += heard || 0;
        if (stopFlag) break;
        setStatus("Pass " + pass + " done · " + (heard || 0) + " busy — restarting bookmark scan…");
        await sleep(600);
      }
      listenCmd = "";
      listenFreq = 0;
      setListenScanRunning(false);
      setListenPaused(false);
      setRecording(false);
      if ($("bs-hold")) $("bs-hold").classList.remove("bs-on");
      if (stopFlag) {
        setStatus("Bookmark scan stopped · " + pass + " pass(es) · " + totalHeard + " busy total.");
      }
    } catch (err) {
      listenFreq = 0;
      setRecording(false);
      setListenScanRunning(false);
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
    return 0;
  }

  function leftSplitMinPct() {
    return 28;
  }


  function switchTab(name, force) {
    if (TAB_IDS.indexOf(name) < 0) name = "bands";
    if (!force && isTabHidden(name)) name = firstVisibleTab();
    var bar = $("bs-tabs");
    if (bar) {
      Array.prototype.forEach.call(bar.querySelectorAll(".bs-tab"), function (btn) {
        btn.classList.toggle("bs-tab-on", btn.getAttribute("data-tab") === name);
      });
    }
    var body = $("bs-body");
    if (body) {
      Array.prototype.forEach.call(body.querySelectorAll(".bs-tab-pane"), function (pane) {
        pane.classList.toggle("bs-tab-on", pane.getAttribute("data-tab") === name);
      });
    }
    try {
      sessionStorage.setItem(SS_TAB, name);
      if (S.rememberTab !== false) window.localStorage.setItem(SS_TAB, name);
    } catch (e) {}
    if (name === "peaks") {
      ensureHitsLoaded(function () {
        ensureHitsClassified();
        renderHits();
        updateTabLabels();
      });
    }
    if (typeof saOnTab === "function") saOnTab(name);
    applyToolbarVisibility();
  }

  function visibleBookmarkRows() {
    var list = localBookmarkList() || [];
    var visibleLocal = list.filter(function (b) { return !isIgnoredFreq(b.frequency); });
    var visibleLoaded = loadedBookmarks.filter(function (b) { return !isIgnoredFreq(b.frequency); });
    return {
      local: visibleLocal,
      loaded: visibleLoaded,
      total: visibleLocal.length + visibleLoaded.length
    };
  }

  function tabPeakCount() {
    if (!S.hideSpurs) return hits.length;
    return hits.filter(function (h) { return !isSpur(h); }).length;
  }

  function updateTabLabels() {
    var peaksBtn = document.querySelector('#bs-tabs .bs-tab[data-tab="peaks"]');
    if (peaksBtn) {
      var pn = tabPeakCount();
      peaksBtn.textContent = pn ? ("Peaks " + pn) : "Peaks";
    }
    var bmBtn = document.querySelector('#bs-tabs .bs-tab[data-tab="bookmarks"]');
    if (bmBtn) {
      var bn = visibleBookmarkRows().total;
      bmBtn.textContent = bn ? ("Bookmarks " + bn) : "Bookmarks";
    }
    var audBtn = document.querySelector('#bs-tabs .bs-tab[data-tab="audio"]');
    if (audBtn) {
      var an = audioClips.length;
      audBtn.textContent = an ? ("Aud " + an) : "Audio";
    }
    var skipBtn = document.querySelector('#bs-tabs .bs-tab[data-tab="skip"]');
    if (skipBtn) {
      var sn = (S.ignoredFreqs || []).length;
      skipBtn.textContent = sn ? ("Skip " + sn) : "Skip";
    }
    if (!panelLayoutUserSet) {
      var p = $("bs-panel");
      if (p && !p.hidden && !p.classList.contains("bs-minimized")) applyPanelLayout();
    }
  }

  function measureTabBarMinWidth() {
    var panel = $("bs-panel");
    var tabs = $("bs-tabs");
    if (!panel || !tabs || panel.hidden) return 0;
    var btns = tabs.querySelectorAll(".bs-tab");
    if (!btns.length) return 0;
    var total = 0;
    for (var i = 0; i < btns.length; i++) total += btns[i].offsetWidth || 0;
    if (btns.length > 1) total += (btns.length - 1) * 3;
    var actions = panel.querySelector(".bs-head-actions");
    if (actions) total += actions.offsetWidth || 0;
    total += 20;
    return total;
  }

  function waterfallLayoutRect() {
    var vw = window.innerWidth || 1024;
    var vh = window.innerHeight || 768;
    var canvas = $("webrx-canvas-container");
    if (canvas) {
      var r = canvas.getBoundingClientRect();
      if (r.width > 120 && r.height > 100) {
        return {
          left: Math.round(r.left + 8),
          top: Math.round(r.top + 8),
          width: Math.floor(r.width - 16),
          height: Math.floor(r.height - 16)
        };
      }
    }
    var top = 52;
    var bar = $("openwebrx-top-bar") || document.querySelector(".openwebrx-top-bar") || $("webrx-top-container");
    if (bar) {
      var br = bar.getBoundingClientRect();
      if (br.bottom > 20) top = Math.round(br.bottom + 8);
    }
    return {
      left: Math.round(vw * 0.02),
      top: top,
      width: Math.floor(vw * 0.96 - 16),
      height: Math.floor(vh * 0.72)
    };
  }

  function defaultPanelGeometry(vw, vh) {
    var a = waterfallLayoutRect();
    return {
      w: a.width,
      h: Math.min(a.height, Math.max(280, Math.round(a.height * 0.55)), Math.floor(vh * 0.58)),
      left: a.left,
      top: a.top
    };
  }

  function applyPanelLayout() {
    var p = $("bs-panel");
    if (!p) return;
    var vw = window.innerWidth || 1024;
    var vh = window.innerHeight || 768;
    var minW = Math.min(520, Math.max(360, Math.floor(vw * 0.92)));
    var minH = 280;
    var maxW = Math.floor(vw * 0.96);
    var def = defaultPanelGeometry(vw, vh);
    var anchorW = waterfallLayoutRect().width;
    if (anchorW > 120) maxW = Math.min(maxW, anchorW);
    var wRaw = Number(S.panelW);
    var hRaw = Number(S.panelH);
    var w;
    if (panelLayoutUserSet && isFinite(wRaw) && wRaw > 0) {
      w = clamp(wRaw, minW, maxW);
    } else {
      w = clamp(def.w, minW, maxW);
      var tabNeed = measureTabBarMinWidth();
      if (tabNeed > 0) w = clamp(Math.max(w, tabNeed), minW, maxW);
    }
    var h = (isFinite(hRaw) && hRaw > 0)
      ? clamp(hRaw, minH, Math.floor(vh * 0.88))
      : clamp(def.h, minH, Math.floor(vh * 0.88));
    if (panelLayoutUserSet) S.panelW = w;
    else S.panelW = 0;
    S.panelH = h;
    p.style.width = w + "px";
    p.style.height = h + "px";
    p.style.maxHeight = "none";
    var hasUserLeft = panelLayoutUserSet && typeof S.panelLeft === "number" && isFinite(S.panelLeft);
    var hasUserTop = panelLayoutUserSet && typeof S.panelTop === "number" && isFinite(S.panelTop);
    var left = hasUserLeft
      ? clamp(S.panelLeft, 4, Math.max(4, vw - w - 4))
      : clamp(def.left, 4, Math.max(4, vw - w - 4));
    var top = hasUserTop
      ? clamp(S.panelTop, 4, Math.max(4, vh - h - 4))
      : clamp(def.top, 4, Math.max(4, vh - h - 4));
    p.style.left = left + "px";
    p.style.top = top + "px";
    p.style.right = "auto";
    var clamped = clampPanelOnScreen(w, h, left, top, vw, vh);
    if (clamped.left !== left || clamped.top !== top) {
      left = clamped.left;
      top = clamped.top;
      p.style.left = left + "px";
      p.style.top = top + "px";
      if (panelLayoutUserSet) {
        S.panelLeft = left;
        S.panelTop = top;
      }
    }
  }

  function savePanelLayout() {
    var p = $("bs-panel");
    if (!p) return;
    var r = p.getBoundingClientRect();
    if (r.width > 40 && r.height > 40) {
      panelLayoutUserSet = true;
      S.panelW = Math.round(r.width);
      S.panelH = Math.round(r.height);
      S.panelLeft = Math.round(r.left);
      S.panelTop = Math.round(r.top);
    }
    saveSettings();
    writePanelLayoutSnapshot();
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
    var list = hideFloatTip._restore;
    if (list && list.length) {
      list.forEach(function (rest) {
        if (rest && rest.el && rest.title && !rest.el.getAttribute("title")) {
          rest.el.setAttribute("title", rest.title);
        }
      });
    } else {
      var rest = hideFloatTip._restoreOne;
      if (rest && rest.el && rest.title && !rest.el.getAttribute("title")) {
        rest.el.setAttribute("title", rest.title);
      }
    }
    hideFloatTip._restore = null;
    hideFloatTip._restoreOne = null;
    hideFloatTip._host = null;
  }

  function tipControlRoot(host) {
    if (!host || !host.closest) return host;
    return host.closest("label, button, summary, th, td, .bs-chk") || host;
  }

  function clearTitlesUnder(root) {
    var out = [];
    if (!root) return out;
    var els = [root];
    if (root.querySelectorAll) {
      Array.prototype.push.apply(els, root.querySelectorAll("[title]"));
    }
    els.forEach(function (el) {
      var t = el.getAttribute("title");
      if (!t) return;
      out.push({ el: el, title: t });
      el.removeAttribute("title");
    });
    return out;
  }

  function showFloatTip(host, ev) {
    if (layoutDragKind()) {
      hideFloatTip();
      return;
    }
    var root = tipControlRoot(host);
    if (hideFloatTip._host === root) {
      placeFloatTip(ev);
      return;
    }
    var text = (host && (host.getAttribute("data-tip") || host.getAttribute("title")))
      || (root && (root.getAttribute("data-tip") || root.getAttribute("title")));
    if (!text) {
      hideFloatTip();
      return;
    }
    hideFloatTip();
    hideFloatTip._restore = clearTitlesUnder(root);
    hideFloatTip._host = root;
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
      if (host && root.contains(host) && !t.closest("[data-resize], .bs-tab")) {
        var lab = host.closest("label[title], label[data-tip], button[title], summary[title]");
        if (lab && root.contains(lab)) host = lab;
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
    var resizeStart = null;
    function setDragClass(kind) {
      document.body.classList.remove(
        "bs-layout-drag", "bs-resize-ew", "bs-resize-ns", "bs-resize-nwse", "bs-resize-nesw"
      );
      if (!kind) return;
      document.body.classList.add("bs-layout-drag");
      if (kind === "e" || kind === "w") document.body.classList.add("bs-resize-ew");
      else if (kind === "n" || kind === "s") document.body.classList.add("bs-resize-ns");
      else if (kind === "nw" || kind === "se") document.body.classList.add("bs-resize-nwse");
      else if (kind === "ne" || kind === "sw") document.body.classList.add("bs-resize-nesw");
    }
    function onMove(ev) {
      if (!dragging || !resizeStart) return;
      ev.preventDefault();
      hideFloatTip();
      var vw = window.innerWidth || 1024;
      var vh = window.innerHeight || 768;
      var minW = Math.min(520, Math.max(360, Math.floor(vw * 0.92)));
      var minH = 280;
      var dx = ev.clientX - resizeStart.clientX;
      var dy = ev.clientY - resizeStart.clientY;
      var kind = dragging;
      var left = resizeStart.left;
      var top = resizeStart.top;
      var w = resizeStart.width;
      var h = resizeStart.height;
      if (kind.indexOf("e") >= 0) w = resizeStart.width + dx;
      if (kind.indexOf("w") >= 0) {
        w = resizeStart.width - dx;
        left = resizeStart.left + dx;
      }
      if (kind.indexOf("s") >= 0) h = resizeStart.height + dy;
      if (kind.indexOf("n") >= 0) {
        h = resizeStart.height - dy;
        top = resizeStart.top + dy;
      }
      if (w < minW) {
        if (kind.indexOf("w") >= 0) left -= (minW - w);
        w = minW;
      }
      if (h < minH) {
        if (kind.indexOf("n") >= 0) top -= (minH - h);
        h = minH;
      }
      left = clamp(left, 4, Math.max(4, vw - w - 4));
      top = clamp(top, 4, Math.max(4, vh - h - 4));
      w = clamp(w, minW, Math.max(minW, vw - left - 4));
      h = clamp(h, minH, Math.max(minH, vh - top - 4));
      panelLayoutUserSet = true;
      S.panelW = Math.round(w);
      S.panelH = Math.round(h);
      S.panelLeft = Math.round(left);
      S.panelTop = Math.round(top);
      panel.style.width = w + "px";
      panel.style.height = h + "px";
      panel.style.left = left + "px";
      panel.style.top = top + "px";
      panel.style.right = "auto";
    }
    function onUp() {
      if (!dragging) return;
      dragging = null;
      resizeStart = null;
      layoutDragging = false;
      setDragClass("");
      savePanelLayout();
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    Array.prototype.forEach.call(panel.querySelectorAll("[data-resize]"), function (h) {
      h.addEventListener("pointerdown", function (ev) {
        if (ev.button && ev.button !== 0) return;
        var pr = panel.getBoundingClientRect();
        resizeStart = {
          left: pr.left,
          top: pr.top,
          width: pr.width,
          height: pr.height,
          clientX: ev.clientX,
          clientY: ev.clientY
        };
        panelLayoutUserSet = true;
        dragging = h.getAttribute("data-resize");
        layoutDragging = true;
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
    pluginSetFrequency(freq);
    if (mode && window.UI && typeof UI.setModulation === "function") {
      try { UI.setModulation(mode, ""); } catch (e) {}
    }
  }

  function renderBookmarkPane() {
    var host = $("bs-bmlist");
    if (!host) {
      updateTabLabels();
      return;
    }
    var list = localBookmarkList();
    if (!list) list = [];
    var skipN = (S.ignoredFreqs || []).length;
    var bmRows = visibleBookmarkRows();
    var visibleLocal = bmRows.local.slice().sort(function (a, b) {
      return (a.frequency || 0) - (b.frequency || 0);
    });
    var visibleLoaded = bmRows.loaded.slice().sort(function (a, b) {
      return a.frequency - b.frequency;
    });
    var count = $("bs-bmcount");
    if (count) {
      var parts = [];
      if (visibleLocal.length) parts.push(visibleLocal.length + " local");
      if (visibleLoaded.length) parts.push(visibleLoaded.length + " loaded");
      if (skipN) parts.push(skipN + " skipped");
      count.textContent = parts.length ? parts.join(" · ") : "";
    }
    var html = "";
    if (!visibleLocal.length) {
      html += '<div class="bs-bm-section"><b class="bs-bm-section-head">Local</b>' +
        (list.length && skipN
          ? '<p class="bs-empty">All local bookmarks are always-skipped — see Skip tab.</p>'
          : '<p class="bs-empty">No blue bookmarks yet. Auto-bookmark or + on a peak adds them here.</p>') +
        "</div>";
    } else {
      html += '<div class="bs-bm-section"><b class="bs-bm-section-head">Local (' + visibleLocal.length +
        ')</b><ul class="bs-bm-ul">' + visibleLocal.map(function (b) {
        var freq = b.frequency;
        var auto = isAuto(b);
        return '<li class="bs-bm-row' +
          '" data-bm-tune="' + freq + '" data-bm-mode="' + escapeHtml(b.modulation || "") +
          '" title="Tune to this bookmark.">' +
          '<span class="bs-bm-name">' + escapeHtml(bookmarkDisplayName(b)) + "</span>" +
          (auto ? '<span class="bs-bm-auto">[auto]</span>' : "") +
          '<span class="bs-bm-mhz">' + fmtMhz(freq) + "</span>" +
          '<button type="button" class="bs-tiny bs-btn-util" data-bm-ren="' + freq + '" data-bm-kind="local" title="Rename this bookmark.">ren</button>' +
          '<button type="button" class="bs-tiny bs-btn-lock" data-bm-ign="' + freq + '" title="Skip this MHz forever and continue the scan.">ign</button>' +
          "</li>";
      }).join("") + "</ul></div>";
    }
    if (!visibleLoaded.length) {
      html += '<div class="bs-bm-section"><b class="bs-bm-section-head">Loaded</b>' +
        (loadedBookmarks.length && skipN
          ? '<p class="bs-empty">All loaded bookmarks are always-skipped — see Skip tab.</p>'
          : '<p class="bs-empty">Load bookmarks from JSON/CSV — tagged [load], scanned with Scan bookmarks.</p>') +
        "</div>";
    } else {
      html += '<div class="bs-bm-section"><b class="bs-bm-section-head">Loaded (' + visibleLoaded.length +
        ')</b><ul class="bs-bm-ul">' +
        visibleLoaded.map(function (b) {
          var freq = b.frequency;
          return '<li class="bs-bm-row bs-bm-loaded' +
            '" data-loaded-tune="' + freq + '" data-bm-mode="' + escapeHtml(b.modulation || "") +
            '" title="Tune to this loaded bookmark.">' +
            '<span class="bs-bm-name">' + escapeHtml(b.name || fmtMhz(freq)) + "</span>" +
            '<span class="bs-bm-load">[load]</span>' +
            '<span class="bs-bm-mhz">' + fmtMhz(freq) + "</span>" +
            '<button type="button" class="bs-tiny bs-btn-util" data-bm-ren="' + freq + '" data-bm-kind="loaded" title="Rename this loaded bookmark.">ren</button>' +
            '<button type="button" class="bs-tiny bs-btn-lock" data-bm-ign="' + freq + '" title="Skip this MHz forever and continue the scan.">ign</button>' +
            "</li>";
        }).join("") + "</ul></div>";
    }
    host.innerHTML = html;
    var skipHead = $("bs-skiphead");
    var skipHost = $("bs-skiplist");
    var ign = (S.ignoredFreqs || []).slice().sort(function (a, b) { return a - b; });
    if (skipHead) skipHead.textContent = ign.length ? ("Always skip (" + ign.length + ")") : "Always skip";
    if (skipHost) {
      if (!ign.length) {
        skipHost.innerHTML = '<p class="bs-empty">None. Always skip or ign on a peak adds frequencies here.</p>';
      } else {
        skipHost.innerHTML = ign.map(function (f) {
          var known = existingName(f) || "";
          return '<div class="bs-skip-row">' +
            '<button type="button" class="bs-tune" data-skip-tune="' + f + '" title="Tune to this frequency.">' +
            fmtMhz(f) + "</button>" +
            (known ? '<span class="bs-bm-name">' + escapeHtml(known) + "</span>" : "") +
            '<button type="button" class="bs-tiny bs-on" data-bm-ign="' + f + '" title="Stop always-skipping this frequency.">un-ign</button></div>';
        }).join("");
      }
    }
    renderAudioClips();
    updateTabLabels();
  }

  function clipLabel(clip) {
    return clip.name || (clip.freq ? fmtMhz(clip.freq) : (clip.file || "clip"));
  }

  function clipPreviewSec() {
    var n = Number(S.clipPreviewSec);
    if ($("bs-aud-preview-sec")) {
      var fromUi = Number($("bs-aud-preview-sec").value);
      if (isFinite(fromUi) && fromUi > 0) n = fromUi;
    }
    return Math.max(1, Math.min(15, isFinite(n) && n > 0 ? n : 3));
  }

  function clipVolumeLevel() {
    var n = Number(S.clipVolume);
    if ($("bs-aud-vol")) {
      var fromUi = Number($("bs-aud-vol").value);
      if (isFinite(fromUi)) n = fromUi;
    }
    return Math.max(0, Math.min(100, isFinite(n) ? n : 80));
  }

  function applyClipVolume() {
    var pct = clipVolumeLevel();
    var v = pct / 100;
    var lbl = $("bs-aud-vol-lbl");
    if (lbl) lbl.textContent = pct + "%";
    if ($("bs-aud-vol") && document.activeElement !== $("bs-aud-vol")) {
      $("bs-aud-vol").value = pct;
    }
    if (clipPlaying && clipPlaying.el) {
      try { clipPlaying.el.volume = v; } catch (e) {}
    }
    return v;
  }

  function makeClipAudio(url) {
    var el = new Audio(url);
    try { el.volume = applyClipVolume(); } catch (e) {}
    return el;
  }

  function updateClipPreviewUi() {
    var btn = $("bs-aud-preview");
    var secInp = $("bs-aud-preview-sec");
    var row = $("bs-aud-preview-row");
    if (row) row.hidden = audioClips.length < 2 && !clipPreview.running;
    if (btn) {
      if (clipPreview.running) {
        btn.textContent = "Stop preview";
        btn.classList.add("bs-on");
        btn.title = "Stop walking through clip previews.";
      } else {
        btn.textContent = "Preview all";
        btn.classList.remove("bs-on");
        btn.title = "Play the first N seconds of each clip in order. Highlights the one playing, then advances.";
      }
      btn.disabled = !audioClips.length && !clipPreview.running;
    }
    if (secInp) {
      secInp.disabled = !!clipPreview.running;
      if (!clipPreview.running && document.activeElement !== secInp) {
        secInp.value = clipPreviewSec();
      }
    }
  }

  function scrollClipRowIntoView(id) {
    var host = $("bs-audiolist");
    if (!host) return;
    var row = host.querySelector('.bs-audio-row[data-clip-id="' + id + '"]');
    if (!row || typeof row.scrollIntoView !== "function") return;
    try {
      row.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (e) {
      try { row.scrollIntoView(false); } catch (e2) {}
    }
  }

  function renderAudioClips() {
    var host = $("bs-audiolist");
    var head = $("bs-audiohead");
    if (head) {
      var label = audioClips.length ? ("Audio clips (" + audioClips.length + ")") : "Audio clips";
      if (clipPreview.running && audioClips.length) {
        label += " · preview " + (clipPreview.index + 1) + "/" + audioClips.length;
      }
      head.textContent = label;
    }
    updateClipPreviewUi();
    if (!host) {
      updateTabLabels();
      return;
    }
    if (!audioClips.length) {
      host.innerHTML = '<p class="bs-empty">None yet. Tick Record busy, then Scan bookmarks — clips are saved while parked on a busy/held channel, not during the survey walk. Clips persist in this browser until you remove them (×). Load audio adds files from disk.</p>';
      updateTabLabels();
      return;
    }
    host.innerHTML = audioClips.map(function (c, idx) {
      var when = new Date(c.at || Date.now()).toLocaleTimeString();
      var playing = clipPlaying && clipPlaying.id === c.id;
      var previewing = clipPreview.running && clipPreview.index === idx && playing;
      return '<div class="bs-audio-row' + (playing ? " bs-audio-on" : "") +
        (previewing ? " bs-audio-preview" : "") +
        '" data-clip-id="' + c.id + '">' +
        '<button type="button" class="bs-tiny ' + (playing ? "bs-stop" : "bs-btn-play") + '" data-clip-play="' + c.id + '" title="' +
        (playing ? "Stop this clip." : "Play this clip in the panel.") + '">' +
        (playing ? "Stop" : "Play") + "</button>" +
        '<span class="bs-bm-mhz">' + (c.freq ? fmtMhz(c.freq) : "—") + "</span>" +
        '<span class="bs-bm-name" title="' + escapeHtml(clipLabel(c)) + '">' + escapeHtml(clipLabel(c)) + "</span>" +
        '<span class="bs-hint">' + when + (c.loaded ? " · loaded" : "") +
        (previewing ? " · preview" : "") +
        (extraOn("clipMeta") ? (
          (c.durationMs ? (" · " + (c.durationMs / 1000).toFixed(1) + "s") : (c.blob && c.blob.size ? (" · " + Math.round(c.blob.size / 1024) + " KB") : "")) +
          (c.activeMs && c.durationMs ? (" · voice " + Math.round(100 * c.activeMs / c.durationMs) + "%") : "") +
          (c.transcript ? (" · “" + escapeHtml(String(c.transcript).slice(0, 40)) + "”") : "")
        ) : "") + "</span>" +
        '<button type="button" class="bs-tiny bs-btn-export" data-clip-save="' + c.id + '" title="Download this clip.">Save</button>' +
        (extraOn("speechToText") ? '<button type="button" class="bs-tiny bs-btn-info" data-clip-xscript="' + c.id + '" title="Try browser speech-to-text while playing (Chrome).">TXT</button>' : "") +
        '<button type="button" class="bs-tiny bs-btn-clear" data-clip-del="' + c.id + '" title="Remove this clip from the list (does not delete a file you already saved).">×</button>' +
        "</div>";
    }).join("");
    if (clipPlaying && clipPlaying.id) scrollClipRowIntoView(clipPlaying.id);
    updateTabLabels();
  }

  function stopClipPlayback() {
    if (clipPlaying && clipPlaying.el) {
      try { clipPlaying.el.pause(); } catch (e) {}
      try { clipPlaying.el.src = ""; } catch (e2) {}
    }
    clipPlaying = null;
  }

  function stopClipPreview(opts) {
    opts = opts || {};
    clipPreview.gen++;
    if (clipPreview.timer) {
      clearTimeout(clipPreview.timer);
      clipPreview.timer = null;
    }
    var was = clipPreview.running;
    clipPreview.running = false;
    clipPreview.index = 0;
    if (!opts.keepAudio) stopClipPlayback();
    updateClipPreviewUi();
    if (!opts.silent) renderAudioClips();
    return was;
  }

  function playPreviewAt(idx, gen) {
    if (gen !== clipPreview.gen || !clipPreview.running) return;
    if (idx >= audioClips.length) {
      stopClipPreview({ silent: true });
      renderAudioClips();
      setStatus("Preview done — heard first " + clipPreviewSec() + "s of " + audioClips.length + " clip(s).");
      return;
    }
    var clip = audioClips[idx];
    if (!clip || !clip.url) {
      playPreviewAt(idx + 1, gen);
      return;
    }
    clipPreview.index = idx;
    stopClipPlayback();
    var el = makeClipAudio(clip.url);
    var advanced = false;
    function advance() {
      if (advanced || gen !== clipPreview.gen) return;
      advanced = true;
      if (clipPreview.timer) {
        clearTimeout(clipPreview.timer);
        clipPreview.timer = null;
      }
      try { el.pause(); } catch (e) {}
      if (clipPlaying && clipPlaying.el === el) clipPlaying = null;
      playPreviewAt(idx + 1, gen);
    }
    clipPlaying = { id: clip.id, el: el, preview: true };
    el.onended = advance;
    el.onerror = function () { advance(); };
    var ms = Math.round(clipPreviewSec() * 1000);
    clipPreview.timer = setTimeout(advance, ms);
    renderAudioClips();
    var go = el.play();
    if (go && typeof go.catch === "function") {
      go.catch(function () {
        if (gen !== clipPreview.gen) return;
        stopClipPreview({ silent: true });
        renderAudioClips();
        setStatus("Playback blocked — click Preview all again after interacting with the page.");
      });
    }
    setStatus("Preview " + (idx + 1) + "/" + audioClips.length + " · first " + clipPreviewSec() + "s · " +
      (clip.freq ? fmtMhz(clip.freq) : clipLabel(clip)));
  }

  function toggleClipPreview() {
    if (clipPreview.running) {
      stopClipPreview();
      setStatus("Preview stopped.");
      return;
    }
    if (audioClips.length < 2) {
      setStatus("Need at least 2 clips for Preview all (or Play one clip).");
      return;
    }
    if ($("bs-aud-preview-sec")) {
      S.clipPreviewSec = clipPreviewSec();
      try { saveSettings(); } catch (e) {}
    }
    clipPreview.running = true;
    clipPreview.index = 0;
    clipPreview.gen++;
    var gen = clipPreview.gen;
    updateClipPreviewUi();
    setStatus("Previewing first " + clipPreviewSec() + "s of " + audioClips.length + " clips…");
    playPreviewAt(0, gen);
  }

  function playAudioClip(id) {
    var clip = null;
    for (var i = 0; i < audioClips.length; i++) {
      if (audioClips[i].id === id) clip = audioClips[i];
    }
    if (!clip || !clip.url) return;
    if (clipPreview.running) stopClipPreview({ keepAudio: true, silent: true });
    if (clipPlaying && clipPlaying.id === id && !clipPlaying.preview) {
      stopClipPlayback();
      renderAudioClips();
      return;
    }
    stopClipPlayback();
    var el = makeClipAudio(clip.url);
    clipPlaying = { id: id, el: el };
    el.onended = function () {
      if (clipPlaying && clipPlaying.el === el) clipPlaying = null;
      renderAudioClips();
    };
    el.onerror = function () {
      setStatus("Could not play that clip in this browser.");
      if (clipPlaying && clipPlaying.el === el) clipPlaying = null;
      renderAudioClips();
    };
    var go = el.play();
    if (go && typeof go.catch === "function") {
      go.catch(function () {
        setStatus("Playback blocked — click Play again after interacting with the page.");
        if (clipPlaying && clipPlaying.el === el) clipPlaying = null;
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

  var jsZipLoadPromise = null;

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    if (jsZipLoadPromise) return jsZipLoadPromise;
    jsZipLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
      s.async = true;
      s.onload = function () {
        if (window.JSZip) resolve(window.JSZip);
        else reject(new Error("JSZip did not load"));
      };
      s.onerror = function () { reject(new Error("Could not load JSZip from CDN")); };
      document.head.appendChild(s);
    });
    return jsZipLoadPromise;
  }

  function zipStamp() {
    var s = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
    return s.slice(0, 8) + "-" + s.slice(8);
  }

  function uniqueZipEntry(name, used) {
    var base = String(name || "clip.webm");
    if (!used[base]) {
      used[base] = 1;
      return base;
    }
    used[base]++;
    var dot = base.lastIndexOf(".");
    if (dot > 0) return base.slice(0, dot) + "-" + used[base] + base.slice(dot);
    return base + "-" + used[base];
  }

  function saveAllAudioClips() {
    if (!audioClips.length) {
      setStatus("No clips to save. Tick Record busy and scan a busy channel, or Load audio first.");
      toast("No audio clips yet.");
      return;
    }
    var n = 0;
    audioClips.forEach(function (c, i) {
      if (!c || !c.blob) return;
      n++;
      setTimeout(function () { saveAudioClip(c.id); }, i * 250);
    });
    if (!n) {
      setStatus("No clip data to download.");
      return;
    }
    setStatus("Downloading " + n + " audio clip" + (n === 1 ? "" : "s") + " as separate files.");
  }

  function saveAllAudioClipsZip() {
    if (!audioClips.length) {
      setStatus("No clips to save. Tick Record busy and scan a busy channel, or Load audio first.");
      toast("No audio clips yet.");
      return;
    }
    var clips = audioClips.filter(function (c) { return c && c.blob; });
    if (!clips.length) {
      setStatus("No clip data to pack.");
      return;
    }
    setStatus("Building ZIP (" + clips.length + " clip" + (clips.length === 1 ? "" : "s") + ")…");
    loadJSZip().then(function (JSZip) {
      var zip = new JSZip();
      var used = {};
      clips.forEach(function (c) {
        zip.file(uniqueZipEntry(c.file || clipFileName(c), used), c.blob);
      });
      return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    }).then(function (blob) {
      downloadBlob("sv-audio-clips-" + zipStamp() + ".zip", blob);
      setStatus("Downloaded ZIP with " + clips.length + " audio clip" + (clips.length === 1 ? "" : "s") + ".");
    }).catch(function (err) {
      setStatus(friendlyError(err, "Save all · ZIP"));
      toast("ZIP failed — try Save all for individual files.");
    });
  }

  function removeAudioClip(id) {
    if (clipPreview.running && clipPlaying && clipPlaying.id === id) {
      // skip this clip and continue preview from next
      var nextIdx = clipPreview.index;
      audioClips = audioClips.filter(function (c) {
        if (c.id !== id) return true;
        if (c.url) {
          try { URL.revokeObjectURL(c.url); } catch (e) {}
        }
        deletePersistedClip(id);
        return false;
      });
      clipPreview.gen++;
      if (clipPreview.timer) {
        clearTimeout(clipPreview.timer);
        clipPreview.timer = null;
      }
      stopClipPlayback();
      var gen = clipPreview.gen;
      renderAudioClips();
      if (clipPreview.running) playPreviewAt(Math.min(nextIdx, audioClips.length), gen);
      return;
    }
    audioClips = audioClips.filter(function (c) {
      if (c.id !== id) return true;
      if (clipPlaying && clipPlaying.id === id) stopClipPlayback();
      if (c.url) {
        try { URL.revokeObjectURL(c.url); } catch (e) {}
      }
      deletePersistedClip(id);
      return false;
    });
    renderAudioClips();
  }

  function clearAllAudioClips() {
    if (!audioClips.length) {
      setStatus("No audio clips to clear.");
      return;
    }
    if (!window.confirm("Remove all " + audioClips.length + " audio clip(s) from this browser? Files you already saved to disk are not deleted.")) return;
    var n = audioClips.length;
    stopClipPreview({ silent: true });
    stopClipPlayback();
    audioClips.forEach(function (c) {
      if (c.url) {
        try { URL.revokeObjectURL(c.url); } catch (e) {}
      }
    });
    audioClips = [];
    renderAudioClips();
    clearAllPersistedAudioClips().then(function () {
      setStatus("Cleared " + n + " audio clip" + (n === 1 ? "" : "s") + ".");
    });
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
      return;
    }
    var xs = t.getAttribute("data-clip-xscript");
    if (xs) {
      ev.preventDefault();
      tryTranscribeClip(Number(xs));
    }
  }

  function onBookmarkPaneClick(ev) {
    var t = ev.target;
    if (!t) return;
    var ren = t.getAttribute && t.getAttribute("data-bm-ren");
    if (ren) {
      ev.preventDefault();
      ev.stopPropagation();
      askRenameBookmark(Number(ren), t.getAttribute("data-bm-kind") || "local");
      return;
    }
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
    var logTune = t.getAttribute && t.getAttribute("data-log-tune");
    if (logTune) {
      tuneBookmark(Number(logTune), "");
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
        else if (kind === "digi") {
          var lab = el.dataset.label || "";
          match = isDigiProfile(id, lab) || /(ft8|ft4|wspr|jt65|jt9|fst4|q65|js8)/i.test(id + " " + lab);
        } else if (kind === "hfday") match = /^(20m|17m|15m|12m|10m|6m)/.test(id);
        else if (kind === "hfnight") match = /^(160m|80m|60m|40m|30m)/.test(id);
        if (match) el.checked = true;
      });
    }
    S.selected = selectedValues();
    saveSettings();
    updateCount();
    updateRangeEstimate();
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
    Array.prototype.forEach.call(box.querySelectorAll("tbody tr"), function (row) {
      var t = (row.textContent || "").toLowerCase();
      row.style.display = !q || t.indexOf(q) >= 0 ? "" : "none";
    });
  }

  function fillBands() {
    var box = $("bs-bands");
    if (!box) return;
    var list = profiles();
    if (!list.length) {
      box.innerHTML = '<p class="bs-empty">No band profiles yet. Wait a few seconds for the radio to connect, then click Settings → Check install. If this stays empty, add SDR profiles in OpenWebRX settings (admin) — Help has the steps.</p>';
      updateCount();
      fillLoadUserBmBandSelect();
      return;
    }
    var chosen = S.selected && S.selected.length ? S.selected : defaultSelected();
    var chosenSet = {};
    chosen.forEach(function (v) { chosenSet[v] = true; });
    var table = document.createElement("table");
    table.className = "bs-bands-table";
    table.innerHTML =
      "<thead><tr>" +
      '<th class="bs-bands-check" title="Include in Scan bands / Fresh scan"></th>' +
      '<th title="SDR profile id">Id</th>' +
      '<th title="Profile name from OpenWebRX">Name</th>' +
      '<th title="Frequency range parsed from the profile label">Freq</th>' +
      '<th title="Demodulation mode guessed from the profile id">Mode</th>' +
      "</tr></thead>";
    var tbody = document.createElement("tbody");
    list.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.title = "Include this band when Scan bands or Fresh scan runs.";
      var tdCheck = document.createElement("td");
      tdCheck.className = "bs-bands-check";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = p.value;
      cb.dataset.id = p.id;
      cb.dataset.label = p.label;
      cb.checked = !!chosenSet[p.value];
      cb.setAttribute("aria-label", "Include " + (p.label || p.id));
      tdCheck.appendChild(cb);
      var tdId = document.createElement("td");
      tdId.className = "bs-id";
      tdId.textContent = p.id;
      var tdName = document.createElement("td");
      tdName.className = "bs-bands-name";
      tdName.textContent = p.label;
      var tdFreq = document.createElement("td");
      tdFreq.className = "bs-bands-freq";
      tdFreq.textContent = profileFreqLabel(p);
      var tdMode = document.createElement("td");
      tdMode.className = "bs-bands-mode";
      tdMode.textContent = profileModeLabel(p);
      tr.appendChild(tdCheck);
      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdFreq);
      tr.appendChild(tdMode);
      tr.addEventListener("click", function (ev) {
        if (ev.target === cb || (ev.target.closest && ev.target.closest("input"))) return;
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.innerHTML = "";
    box.appendChild(table);
    updateCount();
    fillLoadUserBmBandSelect();
    filterBands();
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
    var label = skipN ? ("Clear always-skip (" + skipN + ")") : "Clear always-skip";
    ["bs-clearskip", "bs-clearskip-tab"].forEach(function (id) {
      var clr = $(id);
      if (!clr) return;
      clr.hidden = !skipN;
      clr.textContent = label;
    });
  }

  function renderHits() {
    updateClearSkipBtn();
    var host = $("bs-hitwrap");
    if (!host) {
      updateTabLabels();
      return;
    }
    if (extraOn("occHeatmap") && S.peaksView === "heatmap") {
      renderOccHeatmap();
      renderBookmarkPane();
      updateTabLabels();
      return;
    }
    if (!hits.length) {
      host.innerHTML = '<p class="bs-empty">No peaks yet. Pick bands and press Scan bands or Fresh scan.</p>';
      renderBookmarkPane();
      return;
    }
    var shown = sortedHits();
    if (extraOn("whatsNew") && S.showNewOnly) {
      shown = shown.filter(function (h) { return h.isNew && !isSpur(h); });
    }
    if (extraOn("surveyDiff") && S.showDiffOnly && surveySnapPeaks) {
      shown = shown.filter(function (h) { return !isSpur(h) && peakChangedVsSnap(h); });
    }
    var totalShown = shown.length;
    if (shown.length > RENDER_HITS_CAP) shown = shown.slice(0, RENDER_HITS_CAP);
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
          : '<button type="button" class="bs-tiny bs-btn-bm" data-bm="' + h.freq + '" title="Save this peak as a blue bookmark in this browser.">+</button>');
      if (!spur && extraOn("peakNativeBm")) {
        bm += ' <button type="button" class="bs-tiny bs-btn-bm" data-named-bm="' + h.freq + '" title="Save as a named blue bookmark (not [auto]).">named</button>';
      }
      if (!spur && extraOn("copyTuneLink")) {
        bm += ' <button type="button" class="bs-tiny bs-btn-util" data-copy-tune="' + h.freq + '" data-copy-mode="' +
          escapeHtml(h.mode || "") + '" title="Copy MHz (+ mode) to clipboard.">copy</button>';
      }
      if (!spur && extraOn("freqNotes")) {
        var note = noteForFreq(h.freq);
        bm += ' <button type="button" class="bs-tiny bs-btn-util' + (note ? " bs-on" : "") + '" data-freq-note="' + h.freq +
          '" title="' + (note ? escapeHtml(note) : "Add a note for this MHz.") + '">note</button>';
      }
      if (!spur && extraOn("waterfallSnap")) {
        bm += ' <button type="button" class="bs-tiny bs-btn-export" data-wf-snap="1" title="Download a PNG of the waterfall (best-effort).">snap</button>';
      }
      var tag = spur ? '<span class="bs-spur-tag" title="' + escapeHtml(h.spurWhy || "birdie") + '">birdie</span>' : "";
      var icao = icao833(h.freq);
      var ch = icao && icao !== fmtMhzNum(h.freq) ? '<span class="bs-icao">' + icao + "</span> " : "";
      var newb = h.isNew && !spur ? '<span class="bs-new">new</span> ' : "";
      if (!spur && extraOn("surveyDiff") && peakChangedVsSnap(h)) newb += '<span class="bs-new" title="Not in saved survey snapshot">Δ</span> ';
      var pri = isPriority(h.freq) && !spur ? '<span class="bs-pri">pri</span> ' : "";
      var traffic = nearbyTrafficHint(h.freq);
      var nm = h.name || known || "";
      var alwaysOn = isIgnoredFreq(h.freq) || !!h.ignored;
      var ignBtn = alwaysOn
        ? ' <button type="button" class="bs-tiny bs-on" data-ignore="' + h.freq + '" title="Stop always-skipping this MHz">un-ign</button>'
        : ' <button type="button" class="bs-tiny bs-btn-lock" data-ignore="' + h.freq + '" title="Skip this MHz forever and continue the scan.">ign</button>';
      return '<tr class="' + (spur ? "bs-spur" : "") + '">' +
        '<td class="bs-n">' + h.seen + "</td>" +
        '<td>' + pri + newb + traffic + ch +
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
    if (totalShown > RENDER_HITS_CAP) {
      extra += '<p class="bs-empty">Showing top ' + RENDER_HITS_CAP + " of " + totalShown +
        " peaks (" + hits.length + " stored). Export CSV for the full list.</p>";
    }
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

  function finalizeSurveyScan(snapBefore, scanKind) {
    classifyAll();
    markNewFlags(snapBefore);
    saveHits();
    saveSnap();
    var created = S.autoBm ? autoBookmarkQualified() : [];
    var freshBm = created.filter(function (r) { return !r.already; });
    lastCreated = freshBm;
    var liveN = hits.filter(function (h) { return !isSpur(h); }).length;
    var newN = hits.filter(function (h) { return h.isNew && !isSpur(h); }).length;
    var bmN = freshBm.length;
    var extra = hits.length ? "" : (scanKind === "range"
      ? " Nothing sat above the threshold — lower “dB over noise” or widen dwell."
      : " Nothing sat above the threshold — lower “dB over noise” or pick a busier band.");
    var detail = liveN + " signals (" + newN + " new), " + spurCount() + " birdies ignored";
    var bmPart = S.autoBm
      ? (bmN === 1 ? "1 bookmarked" : bmN + " bookmarked")
      : "auto-bookmark off";
    var prefix = scanKind === "range" ? "Range " : "";
    return {
      freshBm: freshBm,
      doneStatus: prefix + "Done — " + bmPart + " · " + detail + extra,
      stopStatus: prefix + "Stopped — " + bmPart + " · " + detail + extra
    };
  }

  async function runRangeSurvey(fresh) {
    if (running) return;
    hookWaterfall();
    readForm();
    readRangeForm();
    S.passes = passesFromUi();
    S.dwell = dwellFromUi();
    S.minHits = minHitsFromUi();
    S.threshDb = threshFromUi();
    S.widebandPeaks = widebandFromUi();
    S.hideSpurs = hideSpursFromUi();
    if ($("bs-autobm")) S.autoBm = $("bs-autobm").checked;
    S.mute = muteFromUi();
    S.ownRadio = ownRadioFromUi();
    saveSettings();
    var startHz = (Number(S.rangeStartMhz) || 0) * 1e6;
    var endHz = (Number(S.rangeEndMhz) || 0) * 1e6;
    if (!startHz || !endHz || startHz >= endHz) {
      var bad = "Range needs start MHz < end MHz (e.g. 109 and 200).";
      setStatus(bad);
      toast(bad);
      switchTab("range");
      return;
    }
    if (rangeUsesChannelGrid() && !(Number(S.rangeStepKhz) > 0)) {
      var badGrid = "Channel grid needs Step kHz > 0 — pick a Grid preset or enter spacing.";
      setStatus(badGrid);
      toast(badGrid);
      switchTab("range");
      return;
    }
    if (rangeUsesChannelGrid()) {
      var gridCenters = buildChannelGridCenters(startHz, endHz, rangeStepHz(), rangeOffsetHz());
      if (!gridCenters.length) {
        var badEmpty = "Channel grid produced no tune points — check Start, End, Step, and Offset.";
        setStatus(badEmpty);
        toast(badEmpty);
        switchTab("range");
        return;
      }
    }
    if (!profiles().length) {
      setStatus("No band profiles yet — wait for the radio, then try again. See Help.");
      toast("No band profiles yet.");
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
    if (courtesyBlocked("range survey")) return;
    if (!window.UI || typeof UI.setFrequency !== "function") {
      setStatus("Tune API is missing (UI.setFrequency). Range scan needs direct frequency tuning.");
      return;
    }
    if (window.fs_scanner_state && fs_scanner_state.running && typeof fs_stop_scanner === "function") {
      try { fs_stop_scanner(); } catch (e) {}
    }
    running = true;
    stopFlag = false;
    hideRangeSpectrum();
    var rangeScanLo = Number(S.rangeStartMhz);
    var rangeScanHi = Number(S.rangeEndMhz);
    var snapBefore = loadSnap();
    if (fresh) {
      hits = [];
      tileLooks = {};
      _hitsClassified = false;
    } else {
      await ensureHitsLoadedPromise();
      ensureHitsClassified();
    }
    renderHits();
    setSurveyRunning(true);
    var btn = $("bs-toggle-btn");
    if (btn) btn.classList.add("bs-running");
    muteOn();
    var rangeLab = rangeLabel();
    var p0 = profileForFreq(startHz);
    if (!p0) {
      setStatus("No profile covers " + fmtMhz(startHz) + ". Add a band that includes this MHz.");
      running = false;
      setSurveyRunning(false);
      if (btn) btn.classList.remove("bs-running");
      muteOff();
      restoreRangeSpectrumView();
      return;
    }
    try {
      setStatus("Range · preparing " + rangeLab + " · switching to " + p0.label);
      if (!(await tuneToCenter(startHz, p0, "Range · prepare"))) {
        if (stopFlag) {
          var finPrep = finalizeSurveyScan(snapBefore, "range");
          setStatus(finPrep.stopStatus);
          showRangeSpectrum(rangeScanLo, rangeScanHi);
          muteOff();
        }
        running = false;
        setSurveyRunning(false);
        if (btn) btn.classList.remove("bs-running");
        if (!stopFlag) muteOff();
        renderHits();
        return;
      }
      var stepHz = rangeStepHz();
      var centers = buildRangeCenters(startHz, endHz, stepHz);
      var bandSteps = null;
      if (S.rangeMode === "bands") {
        bandSteps = buildRangeBandSteps(startHz, endHz);
        if (!bandSteps.length) {
          var ticked = selectedValues().length;
          var msg = ticked
            ? "No ticked bands overlap " + rangeLabel() + ". Tick overlapping bands or use Full range mode."
            : "No bands ticked — tick bands on the Bands tab or use Full range mode.";
          setStatus(msg);
          toast(msg);
          running = false;
          setSurveyRunning(false);
          if (btn) btn.classList.remove("bs-running");
          muteOff();
          switchTab("range");
          restoreRangeSpectrumView();
          return;
        }
      }
      var total = S.rangeMode === "bands"
        ? bandSteps.length * S.passes
        : centers.length * S.passes;
      var step = 0;
      var lastProfile = p0;
      for (var pass = 1; pass <= S.passes && !stopFlag; pass++) {
        var loopN = S.rangeMode === "bands" ? bandSteps.length : centers.length;
        for (var ci = 0; ci < loopN && !stopFlag; ci++) {
          var freqHz;
          var prof;
          if (S.rangeMode === "bands") {
            freqHz = bandSteps[ci].freqHz;
            prof = bandSteps[ci].profile;
          } else {
            freqHz = centers[ci];
            prof = profileForFreq(freqHz) || lastProfile;
          }
          lastProfile = prof;
          var ptLabel = "Range " + rangeLab + " · " + fmtMhz(freqHz);
          var modeTag = S.rangeMode === "bands" ? "bands" : "full";
          setStatus("Pass " + pass + "/" + S.passes + " · " + (ci + 1) + "/" + loopN +
            " · " + fmtMhz(freqHz) + (prof && prof.label ? " · " + prof.label : ""));
          setProgress(step / total);
          if (!(await tuneToCenter(freqHz, prof, "Pass " + pass + "/" + S.passes + " · " + fmtMhz(freqHz)))) break;
          var until = Date.now() + S.dwell * 1000;
          var lastNoise = "";
          while (Date.now() < until && !stopFlag) {
            recordLook(prof.id, ptLabel);
            saveHits();
            var data = wf();
            if (data && data.length) {
              lastNoise = " · noise " + Math.round(noiseFloor(data)) + " dB · " + hits.length + " peaks";
            }
            setStatus("Pass " + pass + "/" + S.passes + " · " + (ci + 1) + "/" + loopN +
              " · " + fmtMhz(freqHz) + (modeTag === "bands" && prof ? " · " + prof.label : "") + lastNoise);
            renderHits();
            await sleep(SAMPLE_MS);
          }
          step++;
          setProgress(step / total);
        }
      }
      var finRange = finalizeSurveyScan(snapBefore, "range");
      var freshBm = finRange.freshBm;
      showRangeSpectrum(rangeScanLo, rangeScanHi);
      if (stopFlag) setStatus(finRange.stopStatus);
      else {
        setStatus(finRange.doneStatus);
        onSurveyComplete(finRange, false);
      }
      muteOff();
      setSurveyRunning(false);
      if (!stopFlag && S.scanAfter && freshBm.length) {
        setStatus(finRange.doneStatus + " Listening to new bookmarks…");
        await listenBookmarks(freshBm);
      } else if (!stopFlag && S.scanAfter && !freshBm.length && qualifiedHits().length) {
        setStatus("No new bookmarks — listening to qualified peaks…");
        await listenBookmarks(qualifiedHits().map(function (h) { return { hit: h, freq: h.freq, pid: h.pid, mode: h.mode, name: bookmarkNameFor(h) }; }));
      }
    } catch (err) {
      setStatus(friendlyError(err, "Range scan"));
      toast(friendlyError(err, "Range scan"));
      renderHealth({ all: true, toast: false });
    }
    running = false;
    setSurveyRunning(false);
    if (btn) btn.classList.remove("bs-running");
    if (!S.scanAfter) muteOff();
    renderHits();
  }

  async function runSurvey(fresh) {
    if (running) return;
    hookWaterfall();
    readForm();
    S.passes = passesFromUi();
    S.dwell = dwellFromUi();
    S.minHits = minHitsFromUi();
    S.threshDb = threshFromUi();
    S.widebandPeaks = widebandFromUi();
    S.hideSpurs = hideSpursFromUi();
    if ($("bs-autobm")) S.autoBm = $("bs-autobm").checked;
    S.mute = muteFromUi();
    S.ownRadio = ownRadioFromUi();
    var box = $("bs-bands");
    if (box && !box.querySelector("input")) fillBands();
    S.selected = selectedValues();
    saveSettings();
    if (!S.selected.length) {
      var noProfiles = !profiles().length;
      var msg = noProfiles
        ? "No bands to pick yet. Wait for the radio to finish loading, then click Settings → Check install. See Help if this stays empty."
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
      _hitsClassified = false;
    } else {
      await ensureHitsLoadedPromise();
      ensureHitsClassified();
    }
    renderHits();
    setSurveyRunning(true);
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
          applyDigiModeIfNeeded(p.id, p.label);
          var peaksBefore = hits.length;
          var digiBefore = countDigiSpotsOnPage();
          var dwellSec = digiDwellForProfile(p.id, p.label, S.dwell);
          var until = Date.now() + dwellSec * 1000;
          var lastNoise = "";
          while (Date.now() < until && !stopFlag) {
            recordLook(p.id, p.label);
            saveHits();
            var data = wf();
            if (data && data.length) {
              lastNoise = " · noise " + Math.round(noiseFloor(data)) + " dB · " + hits.length + " peaks";
              if (extraOn("digiSurvey") && isDigiProfile(p.id, p.label)) {
                lastNoise += " · dwell " + Math.round(dwellSec) + "s";
              }
            }
            setStatus("Pass " + pass + "/" + S.passes + " · " + p.label + lastNoise);
            renderHits();
            await sleep(SAMPLE_MS);
          }
          var digiDelta = Math.max(0, countDigiSpotsOnPage() - digiBefore);
          var peakDelta = Math.max(0, hits.length - peaksBefore);
          recordOccupancy(p.id, p.label, peakDelta, digiDelta);
          step++;
          setProgress(step / total);
        }
      }
      var finBand = finalizeSurveyScan(snapBefore, "band");
      var freshBm = finBand.freshBm;
      if (stopFlag) setStatus(finBand.stopStatus);
      else {
        setStatus(finBand.doneStatus);
        onSurveyComplete(finBand, false);
      }
      muteOff();
      setSurveyRunning(false);
      if (!stopFlag && S.scanAfter && freshBm.length) {
        setStatus(finBand.doneStatus + " Listening to new bookmarks…");
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
    setSurveyRunning(false);
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
      pluginSetFrequency(freq);
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
      return h.seen + "\t" + fmtMhzNum(h.freq) + "\t" + (icao833(h.freq) || "") + "\t" +
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
        fmtMhzNum(h.freq),
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
    pluginSetFrequency(p.freq);
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
    if ($("bs-passes")) S.passes = syncPassesUi($("bs-passes").value);
    else if ($("bs-range-passes")) S.passes = syncPassesUi($("bs-range-passes").value);
    if ($("bs-dwell")) S.dwell = syncDwellUi($("bs-dwell").value);
    else if ($("bs-range-dwell")) S.dwell = syncDwellUi($("bs-range-dwell").value);
    if ($("bs-minhits")) S.minHits = syncMinHitsUi($("bs-minhits").value);
    else if ($("bs-range-minhits")) S.minHits = syncMinHitsUi($("bs-range-minhits").value);
    if ($("bs-thresh")) S.threshDb = syncThreshUi($("bs-thresh").value);
    else if ($("bs-range-thresh")) S.threshDb = syncThreshUi($("bs-range-thresh").value);
    S.hideAuto = $("bs-hideauto") ? $("bs-hideauto").checked : S.hideAuto;
    S.autoBm = $("bs-autobm") ? $("bs-autobm").checked : S.autoBm;
    if ($("bs-mute")) S.mute = syncMuteUi($("bs-mute").checked);
    else if ($("bs-range-mute")) S.mute = syncMuteUi($("bs-range-mute").checked);
    if ($("bs-hidespurs")) S.hideSpurs = syncHideSpursUi($("bs-hidespurs").checked);
    else if ($("bs-range-hidespurs")) S.hideSpurs = syncHideSpursUi($("bs-range-hidespurs").checked);
    if ($("bs-wideband")) S.widebandPeaks = syncWidebandUi($("bs-wideband").checked);
    else if ($("bs-range-wideband")) S.widebandPeaks = syncWidebandUi($("bs-range-wideband").checked);
    S.scanAfter = $("bs-scanafter") ? $("bs-scanafter").checked : S.scanAfter;
    S.holdBusy = $("bs-holdbusy") ? $("bs-holdbusy").checked : S.holdBusy;
    S.continuousBmScan = $("bs-continuousbm") ? $("bs-continuousbm").checked : S.continuousBmScan;
    S.recordBusy = $("bs-record") ? $("bs-record").checked : S.recordBusy;
    readRecSettings();
    S.notifyNew = pairChkFromUi("bs-notify", "bs-range-notify", S.notifyNew !== false);
    /* Read the Bands checkbox here — aloneFromUi used to prefer Range and snap this tick back on. */
    if ($("bs-band-alone")) S.aloneOnly = syncAloneUi($("bs-band-alone").checked);
    else if ($("bs-range-alone")) S.aloneOnly = syncAloneUi($("bs-range-alone").checked);
    if (extraOn("publicMode")) {
      S.aloneOnly = true;
      syncAloneUi(true);
    }
    if ($("bs-ownradio")) S.ownRadio = syncOwnRadioUi($("bs-ownradio").checked);
    else if ($("bs-range-ownradio")) S.ownRadio = syncOwnRadioUi($("bs-range-ownradio").checked);
    S.autoOpenPanel = $("bs-autoopen") ? $("bs-autoopen").checked : S.autoOpenPanel;
    if ($("bs-listensec")) S.listenSec = Math.max(1, Math.min(20, Number($("bs-listensec").value) || 4));
    if ($("bs-priority")) S.priority = $("bs-priority").value || "";
    if ($("bs-lockmin")) S.lockoutMin = Math.max(1, Math.min(240, Number($("bs-lockmin").value) || 30));
    if ($("bs-sched")) S.scheduleHrs = Math.max(0, Math.min(24, Number($("bs-sched").value) || 0));
    if ($("bs-sched-action")) S.schedAction = $("bs-sched-action").value || "band";
    if ($("bs-sched-idle")) S.schedIdleOnly = $("bs-sched-idle").checked;
    if ($("bs-quiet-start")) S.quietStart = $("bs-quiet-start").value || "";
    if ($("bs-quiet-end")) S.quietEnd = $("bs-quiet-end").value || "";
    if ($("bs-remember-tab")) S.rememberTab = $("bs-remember-tab").checked;
    if ($("bs-default-tab")) S.defaultTab = $("bs-default-tab").value || "last";
    if ($("bs-switch-peaks") || $("bs-range-switch-peaks")) {
      S.switchPeaksOnDone = pairChkFromUi("bs-switch-peaks", "bs-range-switch-peaks", !!S.switchPeaksOnDone);
    }
    if ($("bs-notify-done") || $("bs-range-notify-done")) {
      S.notifyScanDone = pairChkFromUi("bs-notify-done", "bs-range-notify-done", !!S.notifyScanDone);
    }
    if ($("bs-sound-peak") || $("bs-range-sound-peak")) {
      S.soundNewPeak = pairChkFromUi("bs-sound-peak", "bs-range-sound-peak", S.soundNewPeak !== false);
    }
    if ($("bs-copy-done") || $("bs-range-copy-done")) {
      S.copyPeaksOnDone = pairChkFromUi("bs-copy-done", "bs-range-copy-done", !!S.copyPeaksOnDone);
    }
    if ($("bs-pause-tune") || $("bs-range-pause-tune")) {
      S.pauseOnManualTune = pairChkFromUi("bs-pause-tune", "bs-range-pause-tune", !!S.pauseOnManualTune);
    }
    if ($("bs-settle-ms") || $("bs-range-settle-ms")) {
      var settleEl = $("bs-settle-ms") || $("bs-range-settle-ms");
      S.profileSettleMs = syncPairNum("bs-settle-ms", "bs-range-settle-ms", Math.max(0, Number(settleEl.value) || 0));
    }
    if ($("bs-max-peaks")) {
      S.maxPeaks = Math.max(0, Number($("bs-max-peaks").value) || 0);
      if (_hitsLoaded) {
        trimPeaksIfNeeded();
        saveHits();
      }
    }
    if ($("bs-keep-peaks")) {
      var keepPeaks = $("bs-keep-peaks").checked;
      if (!keepPeaks && S.keepPeaks !== false) {
        hits = [];
        tileLooks = {};
        _hitsLoaded = true;
        _hitsClassified = false;
        try { window.localStorage.removeItem(LS_HITS); } catch (e) {}
      } else if (keepPeaks && S.keepPeaks === false) {
        _hitsLoaded = false;
        ensureHitsLoaded(function () {
          ensureHitsClassified();
          renderHits();
          updateTabLabels();
        });
      }
      S.keepPeaks = keepPeaks;
    }
    if ($("bs-max-clips")) S.maxAudioClips = Math.max(5, Math.min(200, Number($("bs-max-clips").value) || 40));
    if ($("bs-aud-preview-sec")) S.clipPreviewSec = clipPreviewSec();
    if ($("bs-aud-vol")) S.clipVolume = clipVolumeLevel();
    if ($("bs-bm-loaduser-bands") || $("bs-bm-lu-allbands")) S.loadUserBmBands = loadUserBmSelectedValues();
    if ($("bs-webhook")) S.webhookUrl = ($("bs-webhook").value || "").trim();
    if ($("bs-alert-freqs")) S.alertFreqs = $("bs-alert-freqs").value || "";
    if ($("bs-alert-offset")) S.alertOffsetKhz = Math.max(1, Number($("bs-alert-offset").value) || 25);
    if ($("bs-digi-long")) S.digiLongDwell = !!$("bs-digi-long").checked;
    if ($("bs-digi-force")) S.digiForceOn = !!$("bs-digi-force").checked;
    if ($("bs-digi-dwell")) S.digiDwellSec = Math.max(15, Math.min(180, Number($("bs-digi-dwell").value) || 90));
    if ($("bs-digi-mode")) S.digiForceMode = String($("bs-digi-mode").value || "ft8").trim() || "ft8";
    if ($("bs-daynight-sched")) S.dayNightBeforeSched = !!$("bs-daynight-sched").checked;
    if ($("bs-occ-days")) S.occDays = Math.max(1, Math.min(30, Number($("bs-occ-days").value) || 7));
    if ($("bs-text-size")) S.uiTextSize = $("bs-text-size").value || "default";
    if ($("bs-hide-toolbar")) S.hideToolbar = $("bs-hide-toolbar").checked;
    if ($("bs-ex-step")) {
      var exStep = Number($("bs-ex-step").value);
      S.exploreStepKhz = isFinite(exStep) && exStep > 0 ? exStep : 12.5;
    }
    if ($("bs-ex-offset")) {
      var exOff = Number($("bs-ex-offset").value);
      S.exploreOffsetKhz = isFinite(exOff) && exOff >= 0 ? exOff : 0;
    }
    readExtrasFromForm();
    if ($("bs-watchlist-freqs")) S.alertFreqs = $("bs-watchlist-freqs").value || S.alertFreqs;
    readHiddenTabsFromForm();
    saveSettings();
    applyUiTextSize();
    applyHiddenTabs();
    applyToolbarVisibility();
    applyExtrasUi();
    applySchedule();
    refreshBookmarks();
    renderHits();
    updateRangeEstimate();
  }

  function startListenScan() {
    if (running || listenScanRunning) return;
    readListenSettings();
    saveSettings();
    if (!scanTargetItems().length && !scanTargetItems(true).length) {
      setStatus("No bookmarks or qualified peaks to scan.");
      return;
    }
    stopFlag = false;
    running = true;
    setListenScanRunning(true);
    var btn = $("bs-toggle-btn");
    if (btn) btn.classList.add("bs-running");
    runListenScanLoop().then(function () {
      running = false;
      setListenScanRunning(false);
      if (btn) btn.classList.remove("bs-running");
      renderHits();
    }).catch(function (err) {
      running = false;
      setListenScanRunning(false);
      if (btn) btn.classList.remove("bs-running");
      setStatus(friendlyError(err, "Listen"));
    });
  }

  function makePanel() {
    var existing = $("bs-panel");
    var wasOpen = !!(existing && !existing.hidden);
    if (existing && !$("bs-tab-explore")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-mode-full")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && $("bs-ex-scanall")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-ex-freq")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-ex-vol")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && ($("bs-ex-minimap-btn") || !$("bs-ex-profile-sel"))) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-ex-deck")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-ex-goto-hero")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && $("bs-jump") && !$("bs-jump").classList.contains("bs-btn-jump")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && $("bs-loadedlist")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && $("bs-bmqual") && !$("bs-bmqual").classList.contains("bs-btn-bm")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-factory-reset")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-extras")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-extras-all")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-tb-bm-row")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-tb-band-row")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-settings-check")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-minimize")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-resize-nw")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-dwell")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-wideband")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-hidespurs")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-keep-peaks")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-copy-diag")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-visible-tabs")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-hide-toolbar")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-alone")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-range-notify")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing && !$("bs-tab-analyzer")) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing) return;
    var panel = document.createElement("div");
    panel.id = "bs-panel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="bs-head" id="bs-drag" title="Drag to move the panel.">' +
      '<div class="bs-tabs" id="bs-tabs" role="tablist">' +
      '<button type="button" class="bs-tab bs-tab-on" data-tab="bands" role="tab" title="Band presets and tick list.">Bands</button>' +
      '<button type="button" class="bs-tab" data-tab="range" role="tab" title="Scan a custom MHz range (not tied to ticked bands).">Range</button>' +
      '<button type="button" class="bs-tab" data-tab="explore" role="tab" title="Browse spectrum by profile hop — no band ticks needed.">Explore</button>' +
      '<button type="button" class="bs-tab" data-tab="analyzer" role="tab" title="Experimental live spectrum analyzer. Off by default — enable under Settings → Visible tabs.">Analyzer · exp</button>' +
      '<button type="button" class="bs-tab" data-tab="peaks" role="tab" title="Peak table and export.">Peaks</button>' +
      '<button type="button" class="bs-tab" data-tab="bookmarks" role="tab" title="Local and loaded bookmarks.">Bookmarks</button>' +
      '<button type="button" class="bs-tab" data-tab="audio" role="tab" title="Session audio clips.">Audio</button>' +
      '<button type="button" class="bs-tab" data-tab="skip" role="tab" title="Always-skipped frequencies.">Skip</button>' +
      '<button type="button" class="bs-tab" data-tab="settings" role="tab" title="Panel startup, schedule, and notifications.">Settings</button>' +
      '<button type="button" class="bs-tab" data-tab="help" role="tab" title="Help and install guide.">Help</button>' +
      "</div>" +
      '<div class="bs-head-actions">' +
      '<button type="button" class="bs-x bs-min" id="bs-minimize" title="Minimize to tab bar only — scans keep running.">−</button>' +
      '<button type="button" class="bs-x" id="bs-close" title="Close the survey panel. Settings and bookmarks stay in this browser.">×</button>' +
      "</div></div>" +
      '<div class="bs-toolbar" id="bs-toolbar">' +
      '<p class="bs-note" id="bs-tb-bands-note">Tick bands below, then Scan bands (add to Seen) or Fresh scan. Use <b>Range</b> for a custom MHz sweep. Options for each feature are on its tab.</p>' +
      '<div class="bs-row bs-tb-actions" id="bs-tb-band-row">' +
      '<button type="button" class="bs-primary" id="bs-start" title="Walk ticked bands and add to Seen counts.">Scan bands</button>' +
      '<button type="button" class="bs-btn-fresh" id="bs-fresh" title="Clear peak list and scan from scratch.">Fresh scan</button>' +
      '<button type="button" class="bs-stop" id="bs-stop" title="Stop the survey or bookmark scan right now.">Stop</button>' +
      '<button type="button" class="bs-btn-jump" id="bs-jump" title="Retune to the strongest peak on this waterfall tile only.">Jump loudest</button>' +
      '<span class="bs-count" id="bs-selcount"></span>' +
      "</div>" +
      '<div class="bs-row bs-tb-actions" id="bs-tb-bm-row">' +
      '<button type="button" class="bs-primary bs-scan-top" id="bs-listen-top" title="Loop through bookmarks continuously until Stop. New auto bookmarks first, then all local and loaded.">Scan bookmarks</button>' +
      '<button type="button" class="bs-stop" id="bs-stop-bm" title="Stop the survey or bookmark scan right now.">Stop</button>' +
      '<button type="button" class="bs-btn-hold" id="bs-hold" title="Stay on this frequency until you click Hold again or Skip.">Hold</button>' +
      '<button type="button" class="bs-btn-skip" id="bs-skip" title="Leave this frequency and go to the next bookmark.">Skip</button>' +
      '<button type="button" class="bs-btn-lock" id="bs-alwaysskip" title="Skip this MHz forever and continue the scan.">Always skip</button>' +
      '<button type="button" class="bs-btn-lock" id="bs-lockout" title="Skip this frequency for Lockout minutes (saved in this browser).">Lockout</button>' +
      '<span class="bs-hint" id="bs-hophint">busy waits · Always skip = never again · same-band ~1s · other band 11s unless Own radio is on</span>' +
      "</div>" +
      '<div class="bs-status" id="bs-status"></div>' +
      '<div class="bs-progress" id="bs-tb-progress"><i id="bs-bar"></i></div>' +
      "</div>" +
      '<div class="bs-body" id="bs-body">' +
      '<div class="bs-tab-pane bs-tab-on" id="bs-tab-bands" data-tab="bands" role="tabpanel">' +
      '<div class="bs-row bs-band-filters" id="bs-band-filters">' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="air" title="Add airband profiles (air_1–air_7). Does not untick others — use None to clear first.">Air</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="vhf" title="Add air, marine, 2m, and PMR voice profiles. Does not untick others.">VHF voice</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="allvhf" title="Add every local profile 30–300 MHz. Combine with All UHF. Does not untick others.">All VHF</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="alluhf" title="Add every local profile 300–1000 MHz. Combine with All VHF. Does not untick others.">All UHF</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="ham" title="Add HF/VHF/UHF ham band profiles. Does not untick others.">Ham</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="all" title="Tick every band profile.">All</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="none" title="Untick every band.">None</button>' +
      '<span data-extra="digiSurvey" hidden>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="digi" title="Add digi / FT8 / WSPR-style profiles (name/id match). Additive.">Digi</button>' +
      "</span>" +
      '<span data-extra="dayNightBands" hidden>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="hfday" title="Add HF day bands (20–10m / 6m). Additive — use None first to replace.">HF day</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-preset="hfnight" title="Add HF night bands (160–30m). Additive — use None first to replace.">HF night</button>' +
      "</span>" +
      '<input type="search" id="bs-filter" placeholder="Filter bands" style="flex:1;min-width:120px" title="Type to hide band names that do not match.">' +
      "</div>" +
      '<details class="bs-tab-opts" open>' +
      '<summary title="Passes, dwell, and peak-detection thresholds for band and range scans.">Band scan options</summary>' +
      '<div class="bs-row">' +
      "<label title=\"How many times to walk the ticked bands in one run.\">Passes <input type=\"number\" id=\"bs-passes\" min=\"1\" max=\"100\" step=\"1\" style=\"width:3.4em\"></label>" +
      "<label title=\"Seconds to sit on each band while counting peaks.\">Dwell s <input type=\"number\" id=\"bs-dwell\" min=\"0.8\" max=\"15\" step=\"0.1\" style=\"width:4em\"></label>" +
      "<label title=\"Peaks below this Seen count are not auto-bookmarked or Scan-bookmarks qualified.\">Min seen <input type=\"number\" id=\"bs-minhits\" min=\"1\" max=\"50\" step=\"1\" style=\"width:3.4em\"></label>" +
      "<label title=\"How far above the noise floor a peak must be to count.\">dB over noise <input type=\"number\" id=\"bs-thresh\" min=\"2\" max=\"25\" step=\"1\" style=\"width:3.4em\"></label>" +
      "</div>" +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Hide always-skipped / birdie rows from the list."><input type="checkbox" id="bs-hidespurs"> Hide birdies</label>' +
      '<label class="bs-chk" title="Detect wide broadcast carriers (FM/WFM and HF AM/MW/SW). Off = narrow peak finder only."><input type="checkbox" id="bs-wideband"> Wideband peaks (FM/AM broadcast)</label>' +
      '<label class="bs-chk" title="Mute receiver audio while the survey is walking bands."><input type="checkbox" id="bs-mute"> Mute while running</label>' +
      '<label class="bs-chk" title="Skip the 11s wait between bands. Only on a receiver you run. Public sites can lock this off."><input type="checkbox" id="bs-ownradio"> Own radio — fast hops</label>' +
      '<label class="bs-chk" title="Don\'t retune/scan if other listeners are connected. Untick to scan while others are online."><input type="checkbox" id="bs-band-alone"> Only if alone</label>' +
      "</div></details>" +
      '<details class="bs-tab-opts" data-extra="digiSurvey" hidden>' +
      '<summary title="Longer dwell and optional digi mode while surveying FT8/WSPR-style profiles.">Digi / FT8 survey</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Use Digi dwell seconds on digi profiles instead of the normal dwell."><input type="checkbox" id="bs-digi-long"> Longer dwell on digi profiles</label>' +
      '<label class="bs-chk" title="Call UI.setModulation with Digi mode when hopping digi profiles."><input type="checkbox" id="bs-digi-force"> Force digi mode while surveying</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Seconds to sit on each digi profile (FT8 slots are ~15s; 60–120s recommended).">Digi dwell s <input type="number" id="bs-digi-dwell" min="15" max="180" step="5" style="width:4em"></label>' +
      '<label title="Modulation id passed to OpenWebRX+ (ft8, ft4, wspr, …).">Digi mode <input type="text" id="bs-digi-mode" placeholder="ft8" style="width:5em"></label>' +
      "</div>" +
      '<p class="bs-hint">Tick <b>Digi</b> (or HF day/night) then Scan bands. Occupancy feeds the Peaks heatmap when that extra is on.</p>' +
      "</details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="What happens when a band or range scan finishes (synced with Range).">After scan</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Switch to the Peaks tab when a survey completes."><input type="checkbox" id="bs-switch-peaks"> Switch to Peaks when done</label>' +
      '<label class="bs-chk" title="Desktop notification and status when a survey completes."><input type="checkbox" id="bs-notify-done"> Notify when scan completes</label>' +
      '<label class="bs-chk" title="Copy peak table to clipboard when a survey completes."><input type="checkbox" id="bs-copy-done"> Copy peaks after scan</label>' +
      '<label class="bs-chk" title="Short beep when a new peak is counted during a scan."><input type="checkbox" id="bs-sound-peak"> Sound on new peak</label>' +
      '<label class="bs-chk" title="Browser notification when a new (unseen) peak is counted."><input type="checkbox" id="bs-notify"> Notify new peak</label>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="Automatic scans while this browser tab stays open.">Scheduled scan</summary>' +
      '<div class="bs-row">' +
      '<label title="0 = off. Repeat while this tab stays open.">Every N hours <input type="number" id="bs-sched" min="0" max="24" step="0.25" style="width:3.8em"></label>' +
      '<label title="Band scan, bookmark scan, or both in sequence.">Action <select id="bs-sched-action">' +
      '<option value="band">Band scan</option><option value="bookmark">Bookmark scan</option><option value="both">Both</option></select></label>' +
      "</div>" +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Skip scheduled scan if you tuned manually in the last 10 minutes."><input type="checkbox" id="bs-sched-idle"> Only when receiver idle</label>' +
      '<label class="bs-chk" data-extra="dayNightBands" hidden title="Before each scheduled band scan, tick HF day (08–20 local) or HF night bands."><input type="checkbox" id="bs-daynight-sched"> Apply HF day/night before schedule</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="No auto-scan between these times (24h, local). Leave blank to disable.">Quiet hours <input type="time" id="bs-quiet-start" style="width:6.5em"> – ' +
      '<input type="time" id="bs-quiet-end" style="width:6.5em"></label>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="Pause on manual tune and wait after profile hops (synced with Range).">Courtesy</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Stop the survey when you tune manually on the waterfall."><input type="checkbox" id="bs-pause-tune"> Pause scan when I tune manually</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Milliseconds to wait after profile/frequency change before sampling. 0 = default (~700 ms).">Profile settle ms <input type="number" id="bs-settle-ms" min="0" max="5000" step="50" style="width:4.5em"></label>' +
      "</div></details>" +
      '<div class="bs-bands-wrap" id="bs-bands-wrap">' +
      '<div class="bs-bands" id="bs-bands"></div>' +
      "</div></div>" +
      '<div class="bs-tab-pane" id="bs-tab-range" data-tab="range" role="tabpanel">' +
      '<p class="bs-note">Set start–end MHz, pick scan mode and options, then <b>Scan range</b>. Scan options sync with the Bands tab (change on either tab). Use a <b>Grid preset</b> for channelised bands (PMR446, airband, …).</p>' +
      '<div class="bs-row">' +
      '<label title="Start of the sweep in MHz (e.g. 109). For channel grid, band edge / nominal start (e.g. 446 for PMR446).">Start MHz <input type="number" id="bs-range-start" min="0.01" max="6000" step="0.001" style="width:6em"></label>' +
      '<label title="End of the sweep in MHz (e.g. 200). Must be greater than start.">End MHz <input type="number" id="bs-range-end" min="0.01" max="6000" step="0.001" style="width:6em"></label>' +
      '<label id="bs-range-step-label" title="Hop size in kHz. 0 = auto (~88% of waterfall span). Full range mode only.">Step kHz <input type="number" id="bs-range-step" min="0" max="100000" step="0.001" style="width:5em"></label>' +
      '<label id="bs-range-offset-label" title="Channel grid only: first tune = Start MHz + this many kHz (e.g. PMR446 offset 6.25).">Offset kHz <input type="number" id="bs-range-offset" min="0" max="100000" step="0.001" style="width:5em"></label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label id="bs-range-grid-preset-label" title="Fill Start/End/Step/Offset for common channel plans, or Custom / Auto coverage.">Grid <select id="bs-range-grid-preset" style="max-width:16em"></select></label>' +
      '<label class="bs-chk" id="bs-range-grid-label" title="Hop exact channel centres (Start+Offset, then +Step). Off = waterfall coverage tiles."><input type="checkbox" id="bs-range-grid"> Channel grid</label>' +
      "</div>" +
      '<div class="bs-range-opts-row">' +
      '<details class="bs-tab-opts bs-range-scan-opts" open>' +
      '<summary title="Passes, dwell, sensitivity, and audio for range scans (synced with Bands tab).">Range scan options</summary>' +
      '<div class="bs-row">' +
      '<label title="How many times to walk the range in one run.">Passes <input type="number" id="bs-range-passes" min="1" max="100" step="1" style="width:3.4em"></label>' +
      "<label title=\"Seconds to sit on each MHz step while counting peaks.\">Dwell s <input type=\"number\" id=\"bs-range-dwell\" min=\"0.8\" max=\"15\" step=\"0.1\" style=\"width:4em\"></label>" +
      "<label title=\"Peaks below this Seen count are not auto-bookmarked after the scan.\">Min seen <input type=\"number\" id=\"bs-range-minhits\" min=\"1\" max=\"50\" step=\"1\" style=\"width:3.4em\"></label>" +
      "<label title=\"How far above the noise floor a peak must be to count.\">dB over noise <input type=\"number\" id=\"bs-range-thresh\" min=\"2\" max=\"25\" step=\"1\" style=\"width:3.4em\"></label>" +
      "</div>" +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Hide birdies from Peaks list and range spectrum chart."><input type="checkbox" id="bs-range-hidespurs"> Hide birdies</label>' +
      '<label class="bs-chk" title="Mute receiver audio while the range survey is running."><input type="checkbox" id="bs-range-mute"> Mute while running</label>' +
      '<label class="bs-chk" title="Detect wide broadcast carriers on FM and HF AM/MW/SW profiles. Off = narrow peaks only."><input type="checkbox" id="bs-range-wideband"> Wideband peaks (FM/AM broadcast)</label>' +
      '<label class="bs-chk" title="Skip the 11s wait between profiles. Only on a receiver you run. Public sites can lock this off."><input type="checkbox" id="bs-range-ownradio"> Own radio — fast hops</label>' +
      '<label class="bs-chk" title="Don\'t retune/scan if other listeners are connected. Untick to scan while others are online."><input type="checkbox" id="bs-range-alone"> Only if alone</label>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="What happens when a band or range scan finishes (synced with Bands).">After scan</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Switch to the Peaks tab when a survey completes."><input type="checkbox" id="bs-range-switch-peaks"> Switch to Peaks when done</label>' +
      '<label class="bs-chk" title="Desktop notification and status when a survey completes."><input type="checkbox" id="bs-range-notify-done"> Notify when scan completes</label>' +
      '<label class="bs-chk" title="Copy peak table to clipboard when a survey completes."><input type="checkbox" id="bs-range-copy-done"> Copy peaks after scan</label>' +
      '<label class="bs-chk" title="Short beep when a new peak is counted during a scan."><input type="checkbox" id="bs-range-sound-peak"> Sound on new peak</label>' +
      '<label class="bs-chk" title="Browser notification when a new (unseen) peak is counted."><input type="checkbox" id="bs-range-notify"> Notify new peak</label>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="Pause on manual tune and wait after profile hops (synced with Bands).">Courtesy</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Stop the survey when you tune manually on the waterfall."><input type="checkbox" id="bs-range-pause-tune"> Pause scan when I tune manually</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Milliseconds to wait after profile/frequency change before sampling. 0 = default (~700 ms).">Profile settle ms <input type="number" id="bs-range-settle-ms" min="0" max="5000" step="50" style="width:4.5em"></label>' +
      "</div></details>" +
      '<div class="bs-range-mode-box" id="bs-range-mode-box">' +
      '<div class="bs-range-mode-title">Scan mode</div>' +
      '<label class="bs-chk" title="Step through every MHz point in the span (Explorer-style continuous sweep)."><input type="radio" name="bs-range-mode" id="bs-range-mode-full" value="full"> Full range (Explorer)</label>' +
      '<label class="bs-chk" title="Only scan band profiles ticked on the Bands tab whose MHz range overlaps start–end."><input type="radio" name="bs-range-mode" id="bs-range-mode-bands" value="bands"> Ticked bands in range</label>' +
      "</div></div>" +
      '<div class="bs-row">' +
      '<button type="button" class="bs-primary" id="bs-range-start-btn" title="Walk the MHz range and add peaks to Seen.">Scan range</button>' +
      '<button type="button" class="bs-btn-fresh" id="bs-range-fresh" title="Clear the peak list, then scan this range from scratch.">Fresh range scan</button>' +
      '<button type="button" class="bs-stop" id="bs-range-stop" title="Stop the range or band survey right now.">Stop</button>' +
      "</div>" +
      '<p class="bs-hint" id="bs-range-est"></p>' +
      '<div id="bs-range-spectrum-wrap" hidden>' +
      '<p class="bs-hint bs-range-spectrum-title" id="bs-range-spectrum-title">Range spectrum</p>' +
      '<p class="bs-hint" id="bs-range-spectrum-cap"></p>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-export" id="bs-range-spec-png" title="Download the spectrum chart as a PNG image.">Save PNG</button>' +
      '<button type="button" class="bs-btn-export" id="bs-range-spec-csv" title="Download peak data for this range as CSV.">Save CSV</button>' +
      '<span data-extra="spectrumHistory" hidden>' +
      '<button type="button" class="bs-tiny bs-btn-util" id="bs-spec-hist-prev" title="Previous saved range spectrum.">◀</button>' +
      '<span class="bs-count" id="bs-spec-hist-lab"></span>' +
      '<button type="button" class="bs-tiny bs-btn-util" id="bs-spec-hist-next" title="Next saved range spectrum.">▶</button>' +
      "</span></div>" +
      '<canvas id="bs-range-spectrum" title="Range scan spectrum — click a peak marker to tune."></canvas>' +
      '<p class="bs-hint bs-range-spectrum-leg">Cyan fill = activity envelope · green = new · gold = seen · pink = priority · click marker to tune</p>' +
      "</div>" +
      "</div>" +
      '<div class="bs-tab-pane" id="bs-tab-explore" data-tab="explore" role="tabpanel">' +
      '<div class="bs-ex-console">' +
      '<div class="bs-ex-deck" id="bs-ex-deck">' +
      '<section class="bs-ex-box bs-ex-box-tune" aria-label="Tune readout">' +
      '<div class="bs-ex-box-h">Tune</div>' +
      '<div class="bs-ex-lcd" title="Demodulator tune. Center is the waterfall tile.">' +
      '<div class="bs-ex-lcd-top"><span class="bs-ex-lcd-tag">VFO</span><span class="bs-ex-lcd-mode" id="bs-ex-mode">—</span></div>' +
      '<div class="bs-ex-lcd-row">' +
      '<span class="bs-ex-freq" id="bs-ex-freq">——.——————</span>' +
      '<span class="bs-ex-freq-unit">MHz</span>' +
      "</div>" +
      '<div class="bs-ex-lcd-meta">' +
      '<span id="bs-ex-center">center —</span>' +
      '<span id="bs-ex-offset-read">Δ —</span>' +
      '<span class="bs-count" id="bs-ex-readout">—</span>' +
      "</div></div>" +
      '<div class="bs-ex-stats">' +
      '<div class="bs-ex-stat"><span>PROFILE</span><b id="bs-ex-profile">—</b></div>' +
      '<div class="bs-ex-stat"><span>SPAN</span><b id="bs-ex-span">—</b></div>' +
      '<div class="bs-ex-stat"><span>STEP</span><b id="bs-ex-step-live">12.5 kHz</b></div>' +
      '<div class="bs-ex-stat"><span>S-METER</span><b id="bs-ex-smeter">—</b></div>' +
      "</div></section>" +
      '<section class="bs-ex-box bs-ex-box-profile" aria-label="Profile hop">' +
      '<div class="bs-ex-box-h">Profile <span class="bs-ex-box-sub">all SDR profiles · not Bands ticks</span></div>' +
      '<div class="bs-row bs-ex-toolbar">' +
      '<button type="button" class="bs-ex-btn bs-ex-toggle bs-primary" id="bs-ex-toggle" title="Enable waterfall drag/wheel hop across all profiles.">Explore off</button>' +
      '<button type="button" class="bs-ex-btn bs-ex-arrow" id="bs-ex-prev" title="Previous profile (whole spectrum, by MHz).">◀</button>' +
      '<select id="bs-ex-profile-sel" class="bs-ex-profile-sel" title="Switch SDR profile — same list as the receiver."></select>' +
      '<button type="button" class="bs-ex-btn bs-ex-arrow" id="bs-ex-next" title="Next profile (whole spectrum, by MHz).">▶</button>' +
      "</div>" +
      '<p class="bs-ex-tip">On: drag waterfall ≥⅓ width to hop tiles · wheel = step · Alt+wheel = profile</p>' +
      "</section>" +
      '<section class="bs-ex-box bs-ex-box-vfo" id="bs-ex-box-vfo" aria-label="VFO step and jump">' +
      '<div class="bs-ex-box-h">VFO <span class="bs-ex-box-sub">jump anywhere · step · snap</span></div>' +
      '<div class="bs-ex-goto-hero" id="bs-ex-goto-hero">' +
      '<label class="bs-ex-goto-lab" title="Type a frequency in MHz and press Go or Enter. Switches profile if needed.">' +
      '<span class="bs-ex-goto-tag">Go MHz</span>' +
      '<input type="number" id="bs-ex-goto" min="0.01" max="6000" step="0.000001" placeholder="e.g. 145.500">' +
      "</label>" +
      '<button type="button" class="bs-primary bs-btn-go bs-ex-btn bs-ex-go-btn" id="bs-ex-go" title="Tune to Go MHz, switching profile if needed.">Go</button>' +
      "</div>" +
      '<div class="bs-row bs-ex-vfo">' +
      '<button type="button" class="bs-ex-btn bs-ex-nudge" id="bs-ex-down" title="Tune down one step.">−</button>' +
      '<button type="button" class="bs-ex-btn bs-ex-nudge" id="bs-ex-up" title="Tune up one step.">+</button>' +
      '<label title="Channel spacing for −/+ , Snap, and Explore-on wheel.">Step <input type="number" id="bs-ex-step" min="0.001" max="100000" step="0.001"> kHz</label>' +
      '<label title="Grid offset: snap frequency = n × step + offset (PMR446: step 12.5, offset 6.25).">Off <input type="number" id="bs-ex-offset" min="0" max="100000" step="0.001"> kHz</label>' +
      '<button type="button" class="bs-ex-btn bs-btn-jump" id="bs-ex-snap" title="Round the current tune onto the step/offset grid.">Snap</button>' +
      "</div>" +
      '<div class="bs-row bs-ex-chips" id="bs-ex-step-presets">' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="1" title="1 kHz">1</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="5" title="5 kHz">5</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="6.25" title="6.25 kHz">6.25</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="8.33" title="8.33 kHz airband">8.33</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="12.5" title="12.5 kHz">12.5</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="25" title="25 kHz">25</button>' +
      '<button type="button" class="bs-tiny bs-ex-chip bs-btn-preset" data-ex-step="100" title="100 kHz">100</button>' +
      "</div></section>" +
      '<section class="bs-ex-box bs-ex-box-radio" aria-label="Receiver">' +
      '<div class="bs-ex-box-h">Receiver <span class="bs-ex-box-sub">mode · audio · squelch</span></div>' +
      '<div class="bs-ex-radio" id="bs-ex-radio">' +
      '<div class="bs-ex-modes" id="bs-ex-modes" title="Analog demodulation — same as the receiver Modes row."></div>' +
      '<div class="bs-row bs-ex-digi-row">' +
      '<label title="Digital / secondary demod. Analog = none.">DIGI <select id="bs-ex-digi"><option value="">Analog</option></select></label>' +
      '<span class="bs-ex-sql-led" id="bs-ex-sql-led" title="Squelch gate (green = open)."></span>' +
      "</div>" +
      '<div class="bs-ex-fader">' +
      '<button type="button" class="bs-ex-btn bs-ex-icon bs-btn-util" id="bs-ex-mute" title="Mute receiver audio.">Mute</button>' +
      '<label class="bs-ex-fader-lab">Vol <input type="range" id="bs-ex-vol" min="0" max="150" step="1" value="100"><span id="bs-ex-vol-val">100</span></label>' +
      "</div>" +
      '<div class="bs-ex-fader">' +
      '<button type="button" class="bs-ex-btn bs-ex-icon bs-btn-util" id="bs-ex-sql-auto" title="Set squelch just above the current S-meter.">SQL auto</button>' +
      '<label class="bs-ex-fader-lab">SQL <input type="range" id="bs-ex-sql" min="-150" max="0" step="1" value="-150"><span id="bs-ex-sql-val">−150 dB</span></label>' +
      "</div>" +
      '<div class="bs-ex-fader">' +
      '<button type="button" class="bs-ex-btn bs-ex-icon bs-btn-util" id="bs-ex-nr" title="Noise reduction on/off.">NR</button>' +
      '<label class="bs-ex-fader-lab">NR <input type="range" id="bs-ex-nr-lvl" min="-20" max="20" step="1" value="0"><span id="bs-ex-nr-val">0 dB</span></label>' +
      "</div></div></section>" +
      '<section class="bs-ex-box bs-ex-box-actions" aria-label="Quick actions">' +
      '<div class="bs-ex-box-h">Actions</div>' +
      '<div class="bs-row bs-ex-actions">' +
      '<button type="button" class="bs-ex-btn bs-btn-util" id="bs-ex-copy" title="Copy the current tune to the clipboard.">Copy</button>' +
      '<button type="button" class="bs-ex-btn bs-btn-bm" id="bs-ex-bm" title="Save a named blue bookmark at this tune.">Bookmark</button>' +
      '<button type="button" class="bs-ex-btn bs-btn-jump" id="bs-ex-loud" title="Retune to the strongest peak on this waterfall tile.">Jump loudest</button>' +
      "</div>" +
      '<p class="bs-hint" id="bs-ex-status"></p>' +
      "</section></div></div></div>" +
      '<div class="bs-tab-pane" id="bs-tab-analyzer" data-tab="analyzer" role="tabpanel">' +
      '<p class="bs-note"><b>Experimental.</b> Live spectrum + waterfall from the OpenWebRX waterfall (relative dB). Basic freq span / hop only — not a full HackRF sweep console. Off by default; enable under Settings → <b>Visible tabs</b>. Set Start–End MHz and press <b>Live on</b>.</p>' +
      '<div class="bs-row" id="bs-sa-presets">' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-sa-preset="88-108" title="FM broadcast">FM</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-sa-preset="118-137" title="Airband">Air</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-sa-preset="144-148" title="2m ham">2m</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-sa-preset="430-440" title="70cm">70cm</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" data-sa-preset="1090-1090.5" title="ADS-B">ADS-B</button>' +
      '<label title="Start of analyzer span (MHz).">Start <input type="number" id="bs-sa-start" min="0.01" max="6000" step="0.001" style="width:6em"></label>' +
      '<label title="End of analyzer span (MHz).">End <input type="number" id="bs-sa-end" min="0.05" max="6000" step="0.001" style="width:6em"></label>' +
      '<button type="button" class="bs-btn-go" id="bs-sa-apply" title="Apply Start/End and reset traces.">Apply</button>' +
      '<button type="button" class="bs-primary" id="bs-sa-live" title="Start or stop live spectrum.">Live off</button>' +
      '<label class="bs-chk" title="Do not hop — only draw the current waterfall tile."><input type="checkbox" id="bs-sa-follow"> Follow tile</label>' +
      "</div>" +
      '<p class="bs-hint" id="bs-sa-status"></p>' +
      '<p class="bs-hint" id="bs-sa-readout">—</p>' +
      '<canvas id="bs-sa-spec" class="bs-sa-canvas" title="Click to tune. Hover for frequency."></canvas>' +
      '<canvas id="bs-sa-wf" class="bs-sa-canvas bs-sa-wf" title="Waterfall — click to tune."></canvas>' +
      '<details class="bs-tab-opts" id="bs-sa-settings" open>' +
      '<summary title="Experimental analyzer display and hop settings.">Analyzer settings (experimental)</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Keep maximum envelope across frames."><input type="checkbox" id="bs-sa-peak"> Peak hold</label>' +
      '<label class="bs-chk" title="Smooth the live trace."><input type="checkbox" id="bs-sa-avg"> Averaging</label>' +
      '<label class="bs-chk" title="Scale dB axis from current data."><input type="checkbox" id="bs-sa-autodb"> Auto dB scale</label>' +
      '<label class="bs-chk" title="Experimental: start Live automatically when opening Analyzer (still requires the tab to be enabled)."><input type="checkbox" id="bs-sa-live-open"> Live on tab open</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Averaging depth (frames).">Avg N <input type="number" id="bs-sa-avgn" min="1" max="32" step="1" style="width:3.4em"></label>' +
      '<label title="Manual dB floor when Auto dB is off.">dB min <input type="number" id="bs-sa-dbmin" step="1" style="width:4em"></label>' +
      '<label title="Manual dB ceiling when Auto dB is off.">dB max <input type="number" id="bs-sa-dbmax" step="1" style="width:4em"></label>' +
      '<label title="Dwell per hop tile when sweeping a wide span.">Hop ms <input type="number" id="bs-sa-hop" min="150" max="5000" step="50" style="width:4.5em"></label>' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-sa-clear-peak" title="Clear the peak-hold envelope.">Clear peak hold</button>' +
      "</div>" +
      '<p class="bs-hint">Levels are relative (uncalibrated), same as the OpenWebRX waterfall — not absolute dBm.</p>' +
      "</details></div>" +
      '<div class="bs-tab-pane" id="bs-tab-peaks" data-tab="peaks" role="tabpanel">' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-bm" id="bs-bmqual" title="Save every peak with Seen at or above Min seen as a blue bookmark.">Bookmark qualified</button>' +
      '<button type="button" class="bs-btn-util" id="bs-copy" title="Copy the peak table as text.">Copy list</button>' +
      '<button type="button" class="bs-btn-export" id="bs-csv" title="Download the peak list as a CSV file.">Export CSV</button>' +
      '<button type="button" class="bs-btn-export" id="bs-json" title="Download qualified peaks as JSON (for merging yellow server bookmarks).">Export JSON</button>' +
      '<button type="button" class="bs-btn-import" id="bs-csv-in" title="Restore Peaks/Seen from a previous Export CSV. Shift-click to paste.">Import CSV</button>' +
      '<button type="button" class="bs-btn-import" id="bs-json-in" title="Restore Peaks/Seen from a previous Export JSON. Shift-click to paste.">Import JSON</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-clearhits" title="Clear the Peaks table in this browser. Bookmarks are not deleted.">Clear list</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-clearskip" hidden title="Forget all always-skip frequencies (bookmarks stay).">Clear always-skip</button>' +
      '<label class="bs-chk" data-extra="whatsNew" hidden title="Show only peaks marked new since the last survey."><input type="checkbox" id="bs-show-new-only"> New only</label>' +
      '<button type="button" class="bs-btn-util" data-extra="surveyDiff" hidden id="bs-survey-snap" title="Save current peaks as a snapshot for Δ compare.">Save snapshot</button>' +
      '<label class="bs-chk" data-extra="surveyDiff" hidden title="Show only peaks not in the saved snapshot."><input type="checkbox" id="bs-show-diff-only"> Changed only</label>' +
      '<span data-extra="occHeatmap" hidden class="bs-peaks-view">' +
      '<button type="button" class="bs-tiny bs-btn-util bs-on" id="bs-peaks-view-list" title="Show the peak table.">List</button>' +
      '<button type="button" class="bs-tiny bs-btn-util" id="bs-peaks-view-heat" title="Show band × hour occupancy heatmap from surveys.">Heatmap</button>' +
      '<label title="How many days of occupancy history to show.">Days <input type="number" id="bs-occ-days" min="1" max="30" step="1" style="width:3.2em"></label>' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-occ-clear" title="Clear stored occupancy samples.">Clear heat</button>' +
      "</span>" +
      '<button type="button" class="bs-btn-export" data-extra="shareReport" hidden id="bs-share-report" title="Download a PNG summary of top peaks (and heatmap if enabled).">Share report</button>' +
      '<button type="button" class="bs-btn-util" data-extra="sendToScanner" hidden id="bs-send-scanner-peaks" title="Mark local bookmarks scannable and start OWRX / freq_scanner.">Send to scanner</button>' +
      '<label class="bs-chk" title="Restore Seen peak list from this browser next visit. Off = fresh list each session (faster). Export CSV first if you need the old list."><input type="checkbox" id="bs-keep-peaks"> Keep peaks between sessions</label>' +
      '<label title="0 = unlimited. Trim oldest peaks when list grows. Try 1000–2000 if the panel feels slow.">Max peaks <input type="number" id="bs-max-peaks" min="0" max="5000" step="50" style="width:4.5em"></label>' +
      "</div>" +
      '<p class="bs-hint">Min seen and dB over noise are on the <b>Bands</b> tab — they control which peaks qualify for Bookmark qualified.</p>' +
      "<div><b>Peaks</b> · most active first · new since last run · click MHz to tune · click Name to rename · ign = always skip (click again to undo)</div>" +
      '<div class="bs-tab-scroll" id="bs-hitwrap"></div>' +
      '<div class="bs-tab-scroll" id="bs-occ-heat" data-extra="occHeatmap" hidden></div>' +
      "</div>" +
      '<div class="bs-tab-pane" id="bs-tab-bookmarks" data-tab="bookmarks" role="tabpanel">' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-export" id="bs-bm-save" title="Download local blue bookmarks and [load] imports as one JSON file. Load bookmarks can re-import it.">Save bookmarks</button>' +
      '<button type="button" class="bs-btn-import" id="bs-bm-load" title="Import bookmark frequencies from JSON or CSV into a separate [load] list. Scan bookmarks includes them. Does not overwrite blue [auto] bookmarks unless the file is a Save bookmarks export.">Load bookmarks</button>' +
      '<button type="button" class="bs-btn-import" id="bs-bm-loaduser" title="Pull OpenWebRX user bookmarks into the [load] list for the bands ticked below.">Load user bookmarks</button>' +
      '<span data-extra="userBmShortcuts" hidden>' +
      '<button type="button" class="bs-tiny bs-btn-preset" id="bs-bm-lu-cur" title="Tick only the current OpenWebRX profile.">Current</button>' +
      '<button type="button" class="bs-tiny bs-btn-preset" id="bs-bm-lu-ticked" title="Tick the same bands as on the Bands tab.">Ticked</button>' +
      "</span>" +
      '<button type="button" class="bs-btn-clear" id="bs-bm-clearload" title="Remove all user/[load] bookmarks from this browser (imports and Load user bookmarks). Local blue bookmarks stay.">Clear user bookmarks</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-bm-clearlocal" title="Remove all local blue bookmarks from this browser. [load] imports and always-skip are not touched.">Clear bookmarks</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-clearauto" title="Remove [auto] blue bookmarks from this browser. Named ones stay.">Clear auto bookmarks</button>' +
      '<button type="button" class="bs-btn-util" data-extra="sendToScanner" hidden id="bs-send-scanner" title="Mark bookmarks scannable and start built-in / freq_scanner.">Send to scanner</button>' +
      '<span class="bs-count" id="bs-bmcount"></span>' +
      "</div>" +
      '<details class="bs-tab-opts bs-bm-lu-wrap">' +
      '<summary title="Which bands to include when loading OpenWebRX user bookmarks.">User bookmark bands</summary>' +
      '<div class="bs-row">' +
      '<label class="bs-chk" title="Load bookmarks from every band (ignores the list below)."><input type="checkbox" id="bs-bm-lu-allbands" checked> All bands</label>' +
      '<span class="bs-hint">Or untick All and tick any mix of bands</span>' +
      "</div>" +
      '<div class="bs-bm-lu-bands bs-chk-grid" id="bs-bm-loaduser-bands"></div>' +
      "</details>" +
      '<details class="bs-tab-opts" open>' +
      '<summary title="How bookmark scan listens, records, and auto-saves peaks.">Bookmark scan options</summary>' +
      '<div class="bs-row">' +
      "<label title=\"Minimum seconds on each bookmark after tune settle; with Hold while busy, stays longer until quiet.\">Listen s <input type=\"number\" id=\"bs-listensec\" min=\"1\" max=\"20\" step=\"0.5\" style=\"width:3.6em\"></label>" +
      '<label title="MHz or Hz, comma-separated. Guard / tower / ATIS bookmarks are added automatically.">Priority <input type="text" id="bs-priority" placeholder="121.5" style="width:8em"></label>' +
      '<label data-extra="scanOrder" hidden title="Order for Scan bookmarks (Extras).">Order <select id="bs-listen-order">' +
      '<option value="priority">Priority first</option><option value="freq">Frequency</option>' +
      '<option value="name">Name</option><option value="random">Random</option></select></label>' +
      "</div>" +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Save busy peaks as blue [auto] bookmarks in this browser."><input type="checkbox" id="bs-autobm"> Auto-bookmark actives</label>' +
      '<label class="bs-chk" title="After a survey, hop through the new auto bookmarks."><input type="checkbox" id="bs-scanafter"> Scan new bookmarks when done</label>' +
      '<label class="bs-chk" title="Hide [auto] bookmarks from the OpenWebRX bookmark bar (they still show in Bookmarks tab)."><input type="checkbox" id="bs-hideauto"> Hide auto bookmarks</label>' +
      '<label class="bs-chk" title="Loop bookmarks until Stop without pausing on busy traffic — auto-hop after Listen s."><input type="checkbox" id="bs-continuousbm"> Continuous bookmark scan</label>' +
      '<label class="bs-chk" title="After Listen s minimum, stay while the waterfall shows activity and leave ~1.5s after quiet."><input type="checkbox" id="bs-holdbusy"> Hold while busy</label>' +
      '<label class="bs-chk" title="Record demod while a bookmark is busy or voice-gated (see Record mode on Audio tab)."><input type="checkbox" id="bs-record"> Record busy</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Comma-separated MHz. Extra notify and sound when a new peak is within ± offset.">Alert MHz list <textarea id="bs-alert-freqs" rows="2" placeholder="121.5, 243" style="flex:1;min-width:140px"></textarea></label>' +
      '<label title="Match alert list within ± this many kHz.">± kHz <input type="number" id="bs-alert-offset" min="1" max="500" step="1" style="width:3.5em"></label>' +
      "</div></details>" +
      '<p class="bs-note">One list below: <b>Local</b> (blue / [auto]) then <b>Loaded</b> ([load] import). Click to tune · ren to rename.</p>' +
      '<details class="bs-tab-opts" data-extra="watchlist" hidden>' +
      '<summary title="Alert / watch MHz list (same as Bookmarks → Alert MHz).">Watchlist</summary>' +
      '<div class="bs-row">' +
      '<label title="Comma-separated MHz to watch." style="flex:1">Alert MHz <textarea id="bs-watchlist-freqs" rows="2" placeholder="121.5, 243" style="flex:1;min-width:140px"></textarea></label>' +
      "</div></details>" +
      '<details class="bs-tab-opts" data-extra="sessionLog" hidden>' +
      '<summary title="Bookmark-scan hop log (Extras).">Session log</summary>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-tiny bs-btn-export" id="bs-session-export" title="Download session log as CSV.">Export log CSV</button>' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-session-clear" title="Clear session log.">Clear log</button>' +
      "</div>" +
      '<div id="bs-session-log" class="bs-session-log"></div>' +
      "</details>" +
      '<div class="bs-tab-scroll bs-bm-scroll" id="bs-bmlist"></div>' +
      "</div>" +
      '<div class="bs-tab-pane" id="bs-tab-audio" data-tab="audio" role="tabpanel">' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-export" id="bs-aud-save" title="Download every clip in Audio clips as separate files (MHz/timestamp names). Includes busy recordings and files you loaded.">Save all</button>' +
      '<button type="button" class="bs-btn-export" id="bs-aud-save-zip" title="Download all Audio clips as one ZIP file. Loads JSZip from jsDelivr on first use.">Save all · ZIP</button>' +
      '<button type="button" class="bs-btn-import" id="bs-aud-load" title="Pick audio files from disk to play in the panel. Nothing is uploaded.">Load audio</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-aud-clear" title="Remove every audio clip from this browser (IndexedDB). Files you already saved to disk are not deleted.">Clear all</button>' +
      '<label class="bs-aud-vol" title="Volume for Play and Preview all in this panel. Does not change OpenWebRX receiver volume.">Vol <input type="range" id="bs-aud-vol" min="0" max="100" step="1"> <span id="bs-aud-vol-lbl">80%</span></label>' +
      "</div>" +
      '<div class="bs-row" id="bs-aud-preview-row" hidden>' +
      '<button type="button" class="bs-btn-play" id="bs-aud-preview" title="Play the first N seconds of each clip in order. Highlights the one playing, then advances.">Preview all</button>' +
      '<label title="Seconds of each clip to play during Preview all (1–15).">First s <input type="number" id="bs-aud-preview-sec" min="1" max="15" step="0.5" style="width:3.6em"></label>' +
      '<span class="bs-hint">Skims many clips — lights up the row that is playing</span>' +
      "</div>" +
      '<div class="bs-row" data-extra="recCaps" hidden>' +
      '<label title="Stop Record busy after this many seconds on one channel (Extras).">Max clip s <input type="number" id="bs-max-clip-sec" min="5" max="600" step="5" style="width:4em"></label>' +
      '<span class="bs-hint">Caps how long a busy channel can keep recording</span>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Audio clips kept in this browser (5–200).">Max audio clips <input type="number" id="bs-max-clips" min="5" max="200" step="1" style="width:3.8em"></label>' +
      '<span class="bs-hint">Oldest clips are dropped when the cap is reached</span>' +
      "</div>" +
      '<details class="bs-tab-opts" open>' +
      '<summary title="Recording quality and voice-gating fine-tune.">Recording options</summary>' +
      '<div class="bs-row bs-rec-tune" id="bs-rec-tune">' +
      '<label title="Original = as first shipped (waterfall busy). Balanced = squelch open + light gating. Strict = voice/S-meter gating.">Record mode <select id="bs-recmode">' +
      '<option value="original">Original (as first shipped)</option>' +
      '<option value="balanced">Balanced</option>' +
      '<option value="strict">Strict voice</option>' +
      "</select></label>" +
      '<label class="bs-chk" title="Start recording only when demod squelch is open — avoids static/carrier when squelch is closed (recommended for airband)."><input type="checkbox" id="bs-recsquelch"> Squelch open only</label>' +
      '<label title="0 = mode default. Wait this long after signal before MediaRecorder starts.">Debounce ms <input type="number" id="bs-recdebounce" min="0" max="3000" step="50" style="width:4.2em"></label>' +
      '<label title="0 = mode default. Strict mode pauses recording after this much quiet.">Quiet pause ms <input type="number" id="bs-recquiet" min="0" max="5000" step="50" style="width:4.5em"></label>' +
      "</div>" +
      '<div class="bs-row bs-rec-tune">' +
      '<label title="0 = mode default. Minimum waterfall SNR for voice gating.">Min SNR dB <input type="number" id="bs-recminsnr" min="0" max="25" step="1" style="width:3.6em"></label>' +
      '<label title="0 = mode default. S-meter must be this many dB above squelch slider.">Squelch headroom dB <input type="number" id="bs-recheadroom" min="0" max="15" step="0.5" style="width:3.8em"></label>' +
      '<label title="0 = mode default. Discard clip if active voice time is below this % of clip length.">Min clip voice % <input type="number" id="bs-recminratio" min="0" max="95" step="1" style="width:3.8em"></label>' +
      "</div></details>" +
      '<b id="bs-audiohead">Audio clips</b>' +
      '<p class="bs-note">busy / held channels · saved in this browser · tick <b>Record busy</b> on Bookmarks before Scan bookmarks</p>' +
      '<div class="bs-tab-scroll bs-audiolist" id="bs-audiolist"></div>' +
      "</div>" +
      '<div class="bs-tab-pane" id="bs-tab-skip" data-tab="skip" role="tabpanel">' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-tiny bs-btn-clear" id="bs-clearskip-tab" title="Forget all always-skip frequencies (bookmarks stay).">Clear always-skip</button>' +
      '<label title="Minutes a Lockout button skip lasts for that frequency.">Lockout min <input type="number" id="bs-lockmin" min="1" max="240" step="1" style="width:3.6em"></label>' +
      "</div>" +
      '<b id="bs-skiphead">Always skip</b>' +
      '<div class="bs-tab-scroll bs-skiplist" id="bs-skiplist"></div>' +
      "</div>" +
      '<div class="bs-tab-pane" id="bs-tab-settings" data-tab="settings" role="tabpanel">' +
      '<div class="bs-settings" id="bs-settings">' +
      '<div class="bs-factory-box" id="bs-factory-box">' +
      '<div class="bs-range-mode-title">Factory reset</div>' +
      '<p class="bs-hint bs-factory-hint">Settings tab, top. Wipes peaks, bookmarks, audio, skip list, Explore, and settings in this browser. Panel layout is kept.</p>' +
      '<p class="bs-hint" id="bs-factory-public" hidden>Public / shared receiver extra is on — Factory reset is disabled until you turn that extra off under Extras below.</p>' +
      '<div class="bs-row bs-factory-row">' +
      '<button type="button" class="bs-stop" id="bs-factory-reset" title="Wipe all SV data in this browser and restore defaults — peaks, bookmarks, audio, skip list, settings, Explore.">Factory reset</button>' +
      "</div></div>" +
      extrasSettingsHtml() +
      '<p class="bs-note">Global panel preferences. Scan options are on Bands / Range, bookmark alerts on Bookmarks, peak limits on Peaks, clip cap on Audio.</p>' +
      '<div class="bs-row" id="bs-settings-check">' +
      '<button type="button" class="bs-btn-info" id="bs-check" title="Check that this page can run Band survey and show any fix on this tab.">Check install</button>' +
      '<span class="bs-hint">Same as Help → Check install now. Result appears below.</span>' +
      "</div>" +
      '<div id="bs-health" class="bs-health" hidden></div>' +
      '<details class="bs-tab-opts" open>' +
      '<summary title="Panel open behaviour, layout, and text size.">Panel &amp; UI</summary>' +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Open the Band survey panel automatically when OpenWebRX loads."><input type="checkbox" id="bs-autoopen"> Open panel on startup</label>' +
      '<label class="bs-chk" title="Remember the last tab you used between sessions."><input type="checkbox" id="bs-remember-tab"> Remember last tab</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<label title="Which tab to show when the panel opens. Last used follows Remember last tab.">Default tab <select id="bs-default-tab">' +
      '<option value="last">Last used</option><option value="bands">Always Bands</option><option value="range">Always Range</option>' +
      '<option value="explore">Always Explore</option><option value="analyzer">Always Analyzer (experimental)</option>' +
      '<option value="peaks">Always Peaks</option><option value="bookmarks">Always Bookmarks</option><option value="audio">Always Audio</option>' +
      '<option value="skip">Always Skip</option><option value="settings">Always Settings</option><option value="help">Always Help</option></select></label>' +
      '<label title="Scale panel text: Small ~90%, Default 100%, Large ~110%.">UI text size <select id="bs-text-size">' +
      '<option value="small">Small</option><option value="default">Default</option><option value="large">Large</option></select></label>' +
      "</div>" +
      '<div class="bs-row bs-chk-grid">' +
      '<label class="bs-chk" title="Never show the scan strip. By default it only appears on Bands and Bookmarks, and on any tab while a scan is running."><input type="checkbox" id="bs-hide-toolbar"> Always hide scan strip</label>' +
      "</div>" +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-util" id="bs-reset-btn-shades" title="Restore default colours for every button type. Tip: right-click any coloured button to pick a shade.">Reset button colours</button>' +
      '<span class="bs-hint">Right-click any coloured button → choose shade (same type stays matched)</span>' +
      "</div>" +
      '<div class="bs-visible-tabs-box" title="Untick tabs for a minimal tab bar. Settings always stays on so you can restore tabs.">' +
      '<div class="bs-range-mode-title">Visible tabs</div>' +
      '<p class="bs-hint">Default: all on except <b>Analyzer</b> (experimental, off). <b>Show all tabs</b> still leaves Analyzer off. Settings stays so you can restore tabs.</p>' +
      '<div class="bs-row bs-chk-grid" id="bs-visible-tabs">' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="bands" checked> Bands</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="range" checked> Range</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="explore" checked> Explore</label>' +
      '<label class="bs-chk" title="Experimental live spectrum tab. Off by default. Unticked = hidden."><input type="checkbox" class="bs-tab-vis" data-tab="analyzer"> Analyzer · experimental (off by default)</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="peaks" checked> Peaks</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="bookmarks" checked> Bookmarks</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="audio" checked> Audio</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="skip" checked> Skip</label>' +
      '<label class="bs-chk"><input type="checkbox" class="bs-tab-vis" data-tab="help" checked> Help</label>' +
      '<label class="bs-chk" title="Settings cannot be hidden."><input type="checkbox" class="bs-tab-vis" data-tab="settings" checked disabled> Settings (always on)</label>' +
      "</div>" +
      '<div class="bs-row"><button type="button" class="bs-tiny bs-btn-util" id="bs-tabs-show-all" title="Turn every tab back on.">Show all tabs</button></div>' +
      "</div>" +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-util" id="bs-save-layout" title="Remember current panel position and size. Factory reset restores this layout.">Save panel layout</button>' +
      '<button type="button" class="bs-btn-util" id="bs-reset-layout" title="Restore the last saved panel layout.">Restore saved layout</button>' +
      '<button type="button" class="bs-btn-util" id="bs-default-layout" title="Place panel inside the waterfall below the frequency bar (full tab width).">Waterfall default</button>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="Export, import, and reset settings JSON. Factory reset is also at the top of this tab.">Data &amp; housekeeping</summary>' +
      '<div class="bs-row">' +
      '<button type="button" class="bs-btn-export" id="bs-export-settings" title="Download settings JSON (not peak hits or audio).">Export settings</button>' +
      '<button type="button" class="bs-btn-import" id="bs-import-settings" title="Import settings JSON and merge.">Import settings</button>' +
      '<button type="button" class="bs-btn-clear" id="bs-reset-settings" title="Reset settings to defaults. Keeps peak list.">Reset settings</button>' +
      '<button type="button" class="bs-stop" id="bs-factory-reset-2" title="Same as Factory reset at the top of Settings.">Factory reset</button>' +
      "</div></details>" +
      '<details class="bs-tab-opts">' +
      '<summary title="Webhook on each new peak.">Homelab</summary>' +
      '<div class="bs-row">' +
      '<label title="POST JSON {freq, name, db, band} on each new peak. Errors are ignored.">Webhook URL <input type="url" id="bs-webhook" placeholder="https://…" style="flex:1;min-width:140px"></label>' +
      "</div></details>" +
      "</div></div>" +
      '<div class="bs-tab-pane" id="bs-tab-help" data-tab="help" role="tabpanel">' +
      '<div class="bs-tab-scroll bs-help-pane">' + helpContentHtml() + "</div></div></div>" +
      '<input type="file" id="bs-csv-file" accept=".csv,.txt,text/csv,text/plain" hidden>' +
      '<input type="file" id="bs-json-file" accept=".json,.txt,application/json,text/plain" hidden>' +
      '<input type="file" id="bs-aud-file" accept="audio/*,.webm,.ogg,.mp3,.wav,.m4a,.opus" multiple hidden>' +
      '<input type="file" id="bs-bm-file" accept=".json,.csv,.txt,application/json,text/csv" hidden>' +
      '<input type="file" id="bs-settings-file" accept=".json,application/json,text/plain" hidden>' +
      '<div class="bs-resize-n" data-resize="n" title="Drag to resize the top edge."></div>' +
      '<div class="bs-resize-ne" data-resize="ne" title="Drag to resize the top-right corner."></div>' +
      '<div class="bs-resize-e" data-resize="e" title="Drag to make the panel wider or narrower."></div>' +
      '<div class="bs-resize-se" data-resize="se" title="Drag to resize the bottom-right corner."></div>' +
      '<div class="bs-resize-s" data-resize="s" title="Drag to make the panel taller or shorter."></div>' +
      '<div class="bs-resize-sw" data-resize="sw" title="Drag to resize the bottom-left corner."></div>' +
      '<div class="bs-resize-w" data-resize="w" title="Drag to resize the left edge."></div>' +
      '<div class="bs-resize-nw" data-resize="nw" title="Drag to resize the top-left corner."></div>';
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
    $("bs-wideband").checked = S.widebandPeaks !== false;
    $("bs-holdbusy").checked = S.holdBusy !== false;
    $("bs-continuousbm").checked = S.continuousBmScan !== false;
    $("bs-record").checked = !!S.recordBusy;
    if ($("bs-recmode")) {
      $("bs-recmode").value = normalizeRecMode(S.recMode);
    }
    if ($("bs-recsquelch")) $("bs-recsquelch").checked = S.recSquelchOnly !== false;
    if ($("bs-recdebounce")) $("bs-recdebounce").value = S.recDebounceMs || 0;
    if ($("bs-recquiet")) $("bs-recquiet").value = S.recQuietMs || 0;
    if ($("bs-recminsnr")) $("bs-recminsnr").value = S.recMinSnrDb || 0;
    if ($("bs-recheadroom")) $("bs-recheadroom").value = S.recSquelchHeadroomDb || 0;
    if ($("bs-recminratio")) $("bs-recminratio").value = S.recMinClipRatioPct || 0;
    if ($("bs-notify")) $("bs-notify").checked = S.notifyNew !== false;
    syncAloneUi(S.aloneOnly !== false);
    $("bs-ownradio").checked = ownerOverrideAllowed() && !!S.ownRadio;
    applyOwnerLock();
    $("bs-priority").value = S.priority || "121.5";
    $("bs-lockmin").value = S.lockoutMin || 30;
    $("bs-sched").value = S.scheduleHrs || 0;
    fillSettingsForm();
    if ($("bs-range-start")) $("bs-range-start").value = S.rangeStartMhz;
    if ($("bs-range-end")) $("bs-range-end").value = S.rangeEndMhz;
    if ($("bs-range-step")) $("bs-range-step").value = S.rangeStepKhz || 0;
    if ($("bs-range-offset")) $("bs-range-offset").value = S.rangeOffsetKhz || 0;
    if ($("bs-range-grid")) $("bs-range-grid").checked = !!S.rangeChannelGrid;
    syncRangeGridPresetSelect();
    if ($("bs-range-grid-preset")) $("bs-range-grid-preset").value = S.rangeGridPreset || "auto";
    if ($("bs-range-passes")) $("bs-range-passes").value = S.passes;
    if ($("bs-range-dwell")) $("bs-range-dwell").value = S.dwell;
    if ($("bs-range-minhits")) $("bs-range-minhits").value = S.minHits;
    if ($("bs-range-thresh")) $("bs-range-thresh").value = S.threshDb;
    if ($("bs-range-hidespurs")) $("bs-range-hidespurs").checked = S.hideSpurs !== false;
    if ($("bs-range-mute")) $("bs-range-mute").checked = !!S.mute;
    if ($("bs-range-wideband")) $("bs-range-wideband").checked = S.widebandPeaks !== false;
    if ($("bs-range-ownradio")) $("bs-range-ownradio").checked = ownerOverrideAllowed() && !!S.ownRadio;
    syncAloneUi(S.aloneOnly !== false);
    if ($("bs-range-mode-full")) $("bs-range-mode-full").checked = S.rangeMode !== "bands";
    if ($("bs-range-mode-bands")) $("bs-range-mode-bands").checked = S.rangeMode === "bands";
    updateRangeModeUi();
    updateRangeEstimate();
    bindRangeSpectrum();
    restoreRangeSpectrumView();
    watchProfiles();
    fillBands();
    applyCaps();
    loadedBookmarks = loadLoadedBookmarks();
    loadPersistedAudioClips(function () {
      renderAudioClips();
      updateTabLabels();
    });
    bindPanelLayout(panel);
    var bodyEl = $("bs-body");
    if (bodyEl) bodyEl.onclick = onBookmarkPaneClick;
    var tabBar = $("bs-tabs");
    if (tabBar) {
      tabBar.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest(".bs-tab[data-tab]");
        if (!btn) return;
        switchTab(btn.getAttribute("data-tab"));
      });
    }
    switchTab(resolveOpenTab());
    applyHiddenTabs();
    applyToolbarVisibility();
    fillExtrasForm();
    applyExtrasUi();
    bindExtrasKeyboard();
    updateTabLabels();

    bindHelpTabActions();
    Array.prototype.forEach.call(document.querySelectorAll("#bs-extras .bs-extra-tog"), function (inp) {
      inp.onchange = function () {
        readExtrasFromForm();
        saveSettings();
        applyExtrasUi();
        renderHits();
        renderAudioClips();
        setStatus(inp.checked
          ? ("Extra on: " + (inp.parentNode && inp.parentNode.textContent || inp.id).replace(/\s+/g, " ").trim().slice(0, 60))
          : "Extra off.");
      };
    });
    if ($("bs-extras-all")) $("bs-extras-all").onclick = function () { setExtrasAll(true, false); };
    if ($("bs-extras-none")) $("bs-extras-none").onclick = function () { setExtrasAll(false, true); };
    if ($("bs-show-new-only")) $("bs-show-new-only").onchange = function () {
      S.showNewOnly = !!this.checked; saveSettings(); renderHits();
    };
    if ($("bs-show-diff-only")) $("bs-show-diff-only").onchange = function () {
      S.showDiffOnly = !!this.checked; saveSettings(); renderHits();
    };
    if ($("bs-survey-snap")) $("bs-survey-snap").onclick = saveSurveySnapNow;
    if ($("bs-peaks-view-list")) $("bs-peaks-view-list").onclick = function () { setPeaksView("list"); };
    if ($("bs-peaks-view-heat")) $("bs-peaks-view-heat").onclick = function () { setPeaksView("heatmap"); };
    if ($("bs-occ-days")) $("bs-occ-days").onchange = function () { readForm(); saveSettings(); renderOccHeatmap(); };
    if ($("bs-occ-clear")) $("bs-occ-clear").onclick = clearOccHeat;
    if ($("bs-share-report")) $("bs-share-report").onclick = shareSurveyReport;
    if ($("bs-send-scanner")) $("bs-send-scanner").onclick = sendToScannerAction;
    if ($("bs-send-scanner-peaks")) $("bs-send-scanner-peaks").onclick = sendToScannerAction;
    if ($("bs-digi-long") || $("bs-digi-force") || $("bs-digi-dwell") || $("bs-digi-mode") || $("bs-daynight-sched")) {
      ["bs-digi-long", "bs-digi-force", "bs-digi-dwell", "bs-digi-mode", "bs-daynight-sched"].forEach(function (id) {
        var el = $(id);
        if (!el) return;
        el.onchange = function () { readForm(); saveSettings(); };
      });
    }
    if ($("bs-session-export")) $("bs-session-export").onclick = exportSessionLogCsv;
    if ($("bs-session-clear")) $("bs-session-clear").onclick = clearSessionLog;
    if ($("bs-watchlist-freqs")) $("bs-watchlist-freqs").onchange = function () {
      S.alertFreqs = this.value || "";
      if ($("bs-alert-freqs")) $("bs-alert-freqs").value = S.alertFreqs;
      saveSettings();
    };
    if ($("bs-listen-order")) $("bs-listen-order").onchange = function () {
      S.listenScanOrder = this.value || "priority"; saveSettings();
    };
    if ($("bs-max-clip-sec")) $("bs-max-clip-sec").onchange = function () {
      S.maxClipSec = Math.max(5, Math.min(600, Number(this.value) || 60)); saveSettings();
    };
    if ($("bs-spec-hist-prev")) $("bs-spec-hist-prev").onclick = function () { showSpectrumHist(-1); };
    if ($("bs-spec-hist-next")) $("bs-spec-hist-next").onclick = function () { showSpectrumHist(1); };
    if ($("bs-quiet-night")) $("bs-quiet-night").onclick = function () {
      S.quietStart = "22:00"; S.quietEnd = "06:00";
      if ($("bs-quiet-start")) $("bs-quiet-start").value = S.quietStart;
      if ($("bs-quiet-end")) $("bs-quiet-end").value = S.quietEnd;
      saveSettings(); applySchedule(); setStatus("Quiet hours set to 22:00–06:00.");
    };
    if ($("bs-quiet-eve")) $("bs-quiet-eve").onclick = function () {
      S.quietStart = "18:00"; S.quietEnd = "08:00";
      if ($("bs-quiet-start")) $("bs-quiet-start").value = S.quietStart;
      if ($("bs-quiet-end")) $("bs-quiet-end").value = S.quietEnd;
      saveSettings(); applySchedule(); setStatus("Quiet hours set to 18:00–08:00.");
    };
    if ($("bs-quiet-clear")) $("bs-quiet-clear").onclick = function () {
      S.quietStart = ""; S.quietEnd = "";
      if ($("bs-quiet-start")) $("bs-quiet-start").value = "";
      if ($("bs-quiet-end")) $("bs-quiet-end").value = "";
      saveSettings(); applySchedule(); setStatus("Quiet hours cleared.");
    };

    fillBands();
    applyCaps();
    updateTabLabels();

    $("bs-close").onclick = function () {
      panel.hidden = true;
      window._bs_user_closed_panel = true;
      window._bs_startup_grace_until = 0;
      if (typeof saStop === "function") saStop();
      ensureSvAccessChip();
    };
    if ($("bs-minimize")) $("bs-minimize").onclick = function (ev) {
      ev.stopPropagation();
      togglePanelMinimized();
    };
    if ($("bs-check")) $("bs-check").onclick = function () { runCheckInstall(); };
    $("bs-start").onclick = function () { runSurvey(false); };
    $("bs-fresh").onclick = function () { runSurvey(true); };
    if ($("bs-range-start-btn")) $("bs-range-start-btn").onclick = function () { runRangeSurvey(false); };
    if ($("bs-range-fresh")) $("bs-range-fresh").onclick = function () { runRangeSurvey(true); };
    if ($("bs-range-start")) $("bs-range-start").onchange = readRangeForm;
    if ($("bs-range-end")) $("bs-range-end").onchange = readRangeForm;
    if ($("bs-range-step")) $("bs-range-step").onchange = readRangeForm;
    if ($("bs-range-offset")) $("bs-range-offset").onchange = readRangeForm;
    if ($("bs-range-grid")) $("bs-range-grid").onchange = readRangeForm;
    if ($("bs-range-grid-preset")) {
      syncRangeGridPresetSelect();
      $("bs-range-grid-preset").value = S.rangeGridPreset || "auto";
      $("bs-range-grid-preset").onchange = function () {
        applyRangeGridPreset($("bs-range-grid-preset").value, true);
      };
    }
    if ($("bs-range-passes")) $("bs-range-passes").onchange = readRangeForm;
    if ($("bs-range-dwell")) $("bs-range-dwell").onchange = readRangeForm;
    if ($("bs-range-thresh")) $("bs-range-thresh").onchange = readRangeForm;
    if ($("bs-range-minhits")) $("bs-range-minhits").onchange = readRangeForm;
    if ($("bs-range-hidespurs")) $("bs-range-hidespurs").onchange = readRangeForm;
    if ($("bs-range-mute")) $("bs-range-mute").onchange = readRangeForm;
    if ($("bs-range-wideband")) $("bs-range-wideband").onchange = readRangeForm;
    if ($("bs-range-ownradio")) $("bs-range-ownradio").onchange = readRangeForm;
    if ($("bs-range-alone")) $("bs-range-alone").onchange = readRangeForm;
    if ($("bs-band-alone")) $("bs-band-alone").onchange = readForm;
    [
      "bs-range-switch-peaks", "bs-range-notify-done", "bs-range-copy-done",
      "bs-range-sound-peak", "bs-range-notify", "bs-range-pause-tune", "bs-range-settle-ms"
    ].forEach(function (id) {
      if ($(id)) $(id).onchange = readForm;
    });
    if ($("bs-range-mode-full")) $("bs-range-mode-full").onchange = readRangeForm;
    if ($("bs-range-mode-bands")) $("bs-range-mode-bands").onchange = readRangeForm;
    if ($("bs-range-spec-png")) $("bs-range-spec-png").onclick = exportRangeSpectrumPng;
    if ($("bs-range-spec-csv")) $("bs-range-spec-csv").onclick = exportRangeSpectrumCsv;
    if ($("bs-ex-toggle")) $("bs-ex-toggle").onclick = function () { setExploreMode(!explore.on); };
    if ($("bs-ex-prev")) $("bs-ex-prev").onclick = function () { exploreShiftProfile(-1); };
    if ($("bs-ex-next")) $("bs-ex-next").onclick = function () { exploreShiftProfile(1); };
    if ($("bs-ex-down")) $("bs-ex-down").onclick = function () { exploreNudge(-1); };
    if ($("bs-ex-up")) $("bs-ex-up").onclick = function () { exploreNudge(1); };
    if ($("bs-ex-snap")) $("bs-ex-snap").onclick = function () { exploreSnap(); };
    if ($("bs-ex-go")) $("bs-ex-go").onclick = function () { exploreGo(); };
    if ($("bs-ex-copy")) $("bs-ex-copy").onclick = function () { exploreCopyFreq(); };
    if ($("bs-ex-bm")) $("bs-ex-bm").onclick = function () { exploreBookmarkHere(); };
    if ($("bs-ex-loud")) $("bs-ex-loud").onclick = function () { jumpLoudest(); };
    if ($("bs-ex-profile-sel")) {
      $("bs-ex-profile-sel").onchange = function () {
        var v = $("bs-ex-profile-sel").value;
        if (!v) return;
        switchProfile(v).then(function () {
          exploreFillProfiles();
          exploreRefreshHud();
        });
      };
    }
    bindExploreRadio();
    if ($("bs-ex-step")) {
      $("bs-ex-step").onchange = function () { readForm(); exploreRefreshHud(); };
    }
    if ($("bs-ex-offset")) {
      $("bs-ex-offset").onchange = function () { readForm(); exploreRefreshHud(); };
    }
    if ($("bs-ex-goto")) {
      $("bs-ex-goto").onkeydown = function (ev) {
        if (ev && ev.key === "Enter") { ev.preventDefault(); exploreGo(); }
      };
    }
    var exPresets = $("bs-ex-step-presets");
    if (exPresets) {
      exPresets.querySelectorAll("[data-ex-step]").forEach(function (btn) {
        btn.onclick = function () {
          if ($("bs-ex-step")) $("bs-ex-step").value = btn.getAttribute("data-ex-step");
          readForm();
          exploreRefreshHud();
        };
      });
    }
    initExploreUi();
    $("bs-stop").onclick = stopSurvey;
    if ($("bs-stop-bm")) $("bs-stop-bm").onclick = stopSurvey;
    if ($("bs-range-stop")) $("bs-range-stop").onclick = stopSurvey;
    $("bs-jump").onclick = function () { jumpLoudest(); };
    $("bs-hold").onclick = function () {
      var wasHold = listenCmd === "hold";
      listenCmd = wasHold ? "" : "hold";
      $("bs-hold").classList.toggle("bs-on", listenCmd === "hold");
      if (wasHold && listenPaused) resumeListenScan();
      setStatus(listenCmd === "hold" ? "Holding this frequency." : "Hold released.");
    };
    $("bs-skip").onclick = function () { listenCmd = "skip"; };
    $("bs-lockout").onclick = function () { listenCmd = "lock"; };
    $("bs-alwaysskip").onclick = function () { alwaysSkipAndContinue(); };
    if ($("bs-clearskip")) $("bs-clearskip").onclick = clearAlwaysSkips;
    if ($("bs-clearskip-tab")) $("bs-clearskip-tab").onclick = clearAlwaysSkips;
    $("bs-filter").oninput = filterBands;
    ["bs-passes", "bs-dwell", "bs-minhits", "bs-thresh"].forEach(function (id) {
      if ($(id)) $(id).onchange = readForm;
    });
    $("bs-autobm").onchange = readForm;
    $("bs-scanafter").onchange = readForm;
    $("bs-hideauto").onchange = readForm;
    $("bs-mute").onchange = readForm;
    if ($("bs-wideband")) $("bs-wideband").onchange = readForm;
    $("bs-hidespurs").onchange = function () {
      readForm();
      renderHits();
      if (rangeSpectrum.startMhz && rangeSpectrum.endMhz) {
        rangeSpectrum.peaks = peaksInRangeMhz(rangeSpectrum.startMhz, rangeSpectrum.endMhz);
        drawRangeSpectrum();
      }
    };
    $("bs-holdbusy").onchange = readForm;
    $("bs-continuousbm").onchange = readForm;
    $("bs-record").onchange = readForm;
    if ($("bs-recmode")) $("bs-recmode").onchange = readForm;
    if ($("bs-recsquelch")) $("bs-recsquelch").onchange = readForm;
    ["bs-recdebounce", "bs-recquiet", "bs-recminsnr", "bs-recheadroom", "bs-recminratio"].forEach(function (id) {
      if ($(id)) $(id).onchange = readForm;
    });
    if ($("bs-notify")) $("bs-notify").onchange = function () { readForm(); askNotifyPerm(); };
    if ($("bs-range-notify")) $("bs-range-notify").onchange = function () { readForm(); askNotifyPerm(); };
    if ($("bs-notify-done")) $("bs-notify-done").onchange = function () { readForm(); askNotifyPerm(); };
    if ($("bs-range-notify-done")) $("bs-range-notify-done").onchange = function () { readForm(); askNotifyPerm(); };
    if ($("bs-ownradio")) $("bs-ownradio").onchange = readForm;
    if ($("bs-autoopen")) $("bs-autoopen").onchange = readForm;
    [
      "bs-remember-tab", "bs-switch-peaks", "bs-notify-done", "bs-sound-peak", "bs-copy-done",
      "bs-sched-idle", "bs-pause-tune", "bs-hide-toolbar"
    ].forEach(function (id) {
      if ($(id)) $(id).onchange = readForm;
    });
    [
      "bs-default-tab", "bs-text-size", "bs-sched-action", "bs-quiet-start", "bs-quiet-end",
      "bs-settle-ms", "bs-max-peaks", "bs-keep-peaks", "bs-max-clips", "bs-webhook", "bs-alert-freqs", "bs-alert-offset", "bs-digi-long", "bs-digi-force", "bs-digi-dwell", "bs-digi-mode", "bs-daynight-sched", "bs-occ-days"
    ].forEach(function (id) {
      if ($(id)) $(id).onchange = readForm;
    });
    if ($("bs-reset-layout")) $("bs-reset-layout").onclick = resetPanelLayoutDefaults;
    if ($("bs-reset-btn-shades")) $("bs-reset-btn-shades").onclick = resetBtnShades;
    if ($("bs-save-layout")) $("bs-save-layout").onclick = savePanelLayoutManual;
    if ($("bs-default-layout")) $("bs-default-layout").onclick = applyWaterfallPanelDefault;
    var visBox = $("bs-visible-tabs");
    if (visBox) {
      Array.prototype.forEach.call(visBox.querySelectorAll("input.bs-tab-vis"), function (inp) {
        inp.onchange = readForm;
      });
    }
    if ($("bs-tabs-show-all")) {
      $("bs-tabs-show-all").onclick = function () {
        /* Analyzer stays off — experimental; enable via its Visible tabs checkbox. */
        S.hiddenTabs = ["analyzer"];
        fillVisibleTabsForm();
        saveSettings();
        applyHiddenTabs();
        setStatus("All tabs visible except Analyzer (experimental — still off).");
      };
    }
    if ($("bs-export-settings")) $("bs-export-settings").onclick = exportSettingsJson;
    if ($("bs-import-settings")) $("bs-import-settings").onclick = function () {
      var inp = $("bs-settings-file");
      if (inp) inp.click();
    };
    if ($("bs-reset-settings")) $("bs-reset-settings").onclick = resetSettingsToDefaults;
    if ($("bs-factory-reset")) $("bs-factory-reset").onclick = factoryReset;
    if ($("bs-factory-reset-2")) $("bs-factory-reset-2").onclick = factoryReset;
    if ($("bs-settings-file")) {
      $("bs-settings-file").onchange = function () {
        var f = this.files && this.files[0];
        this.value = "";
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var obj = JSON.parse(String(reader.result || ""));
            if (importSettingsMerge(obj)) setStatus("Settings imported and merged.");
            else setStatus("Settings import failed — invalid JSON.");
          } catch (e) {
            setStatus("Settings import failed — " + friendlyError(e, "Import"));
          }
        };
        reader.readAsText(f);
      };
    }
    $("bs-priority").onchange = readForm;
    $("bs-lockmin").onchange = readForm;
    $("bs-sched").onchange = readForm;
    $("bs-bands").onchange = function () {
      S.selected = selectedValues();
      saveSettings();
      updateCount();
      updateRangeEstimate();
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
    function onListenScanClick() {
      if (listenScanRunning && !listenPaused) return;
      if (listenPaused) {
        resumeListenScan();
        if (listenScanRunning) setListenPaused(false);
        return;
      }
      startListenScan();
    }
    $("bs-listen-top").onclick = onListenScanClick;
    $("bs-copy").onclick = copyResults;
    $("bs-csv").onclick = function () { exportCsv(); };
    $("bs-json").onclick = function () { exportServerJson(); };
    $("bs-csv-in").onclick = function (ev) { startImport("csv", ev); };
    $("bs-json-in").onclick = function (ev) { startImport("json", ev); };
    if ($("bs-aud-save")) $("bs-aud-save").onclick = saveAllAudioClips;
    if ($("bs-aud-save-zip")) $("bs-aud-save-zip").onclick = saveAllAudioClipsZip;
    if ($("bs-aud-preview")) $("bs-aud-preview").onclick = toggleClipPreview;
    if ($("bs-aud-preview-sec")) {
      $("bs-aud-preview-sec").value = S.clipPreviewSec || 3;
      $("bs-aud-preview-sec").onchange = function () {
        S.clipPreviewSec = clipPreviewSec();
        saveSettings();
      };
    }
    if ($("bs-aud-vol")) {
      $("bs-aud-vol").value = clipVolumeLevel();
      applyClipVolume();
      $("bs-aud-vol").oninput = function () {
        S.clipVolume = clipVolumeLevel();
        applyClipVolume();
      };
      $("bs-aud-vol").onchange = function () {
        S.clipVolume = clipVolumeLevel();
        applyClipVolume();
        saveSettings();
      };
    }
    if ($("bs-aud-load")) $("bs-aud-load").onclick = function () {
      var inp = $("bs-aud-file");
      if (inp) inp.click();
    };
    if ($("bs-aud-clear")) $("bs-aud-clear").onclick = clearAllAudioClips;
    if ($("bs-aud-file")) $("bs-aud-file").onchange = function () {
      loadAudioFiles(this.files);
      this.value = "";
    };
    if ($("bs-audiolist")) $("bs-audiolist").onclick = onAudioPaneClick;
    if ($("bs-bm-save")) $("bs-bm-save").onclick = saveBookmarks;
    if ($("bs-bm-load")) $("bs-bm-load").onclick = startLoadBookmarks;
    if ($("bs-bm-loaduser")) $("bs-bm-loaduser").onclick = loadUserBookmarksFromStore;
    if ($("bs-bm-lu-cur")) $("bs-bm-lu-cur").onclick = function () { applyLoadUserBmPreset("current"); };
    if ($("bs-bm-lu-ticked")) $("bs-bm-lu-ticked").onclick = function () { applyLoadUserBmPreset("ticked"); };
    fillLoadUserBmBandSelect();
    if ($("bs-bm-lu-allbands")) $("bs-bm-lu-allbands").onchange = onLoadUserBmBandsClick;
    if ($("bs-bm-loaduser-bands")) $("bs-bm-loaduser-bands").onchange = onLoadUserBmBandsClick;
    if ($("bs-bm-clearload")) $("bs-bm-clearload").onclick = clearLoadedBookmarks;
    if ($("bs-bm-clearlocal")) $("bs-bm-clearlocal").onclick = clearLocalBookmarks;
    if ($("bs-bm-file")) $("bs-bm-file").onchange = onLoadBookmarkFile;
    $("bs-clearauto").onclick = function () {
      var n = clearAutoBookmarks();
      setStatus("Removed " + n + " auto bookmarks.");
      refreshBookmarks();
    };
    $("bs-clearhits").onclick = function () {
      hits = [];
      tileLooks = {};
      _hitsClassified = false;
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
      if (t.getAttribute("data-named-bm")) {
        addNamedBookmarkFromPeak(Number(t.getAttribute("data-named-bm")));
        return;
      }
      if (t.getAttribute("data-copy-tune")) {
        copyTuneText(Number(t.getAttribute("data-copy-tune")), t.getAttribute("data-copy-mode") || "");
        return;
      }
      if (t.getAttribute("data-freq-note")) {
        var nf = Number(t.getAttribute("data-freq-note"));
        var cur = noteForFreq(nf);
        var nn = window.prompt("Note for " + fmtMhz(nf) + ":", cur);
        if (nn == null) return;
        setNoteForFreq(nf, nn);
        renderHits();
        setStatus(nn.trim() ? ("Note saved for " + fmtMhz(nf)) : ("Note cleared for " + fmtMhz(nf)));
        return;
      }
      if (t.getAttribute("data-wf-snap")) {
        captureWaterfallPng();
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

    var ox = 0;
    var oy = 0;
    var dragging = false;

    function isBlankPanelDragTarget(el) {
      if (!el || !panel.contains(el)) return false;
      return !el.closest(
        "button, input, select, textarea, a, summary, label, .bs-tab, .bs-head-actions, [data-resize], " +
        ".bs-bands, table.bs-hits, .bs-bm-ul, .bs-skip-row, .bs-audio-row, .bs-tab-opts, .bs-check-wrap, " +
        "#bs-tab-analyzer, #bs-sa-spec, #bs-sa-wf, #openwebrx-panel-receiver, .openwebrx-panel"
      );
    }

    function startPanelDrag(ev) {
      if (ev.button !== 0) return;
      if (!isBlankPanelDragTarget(ev.target)) return;
      dragging = true;
      var r = panel.getBoundingClientRect();
      ox = ev.clientX - r.left;
      oy = ev.clientY - r.top;
      ev.preventDefault();
    }

    panel.addEventListener("mousedown", startPanelDrag);
    document.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      panel.style.left = Math.max(4, ev.clientX - ox) + "px";
      panel.style.top = Math.max(4, ev.clientY - oy) + "px";
      panel.style.right = "auto";
    });
    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      savePanelLayout();
    });
    panel.addEventListener("dblclick", function (ev) {
      if (!isBlankPanelDragTarget(ev.target)) return;
      if (panel.classList.contains("bs-minimized")) setPanelMinimized(false);
    });
    if (wasOpen) panel.hidden = false;
    else maintainStartupPanelOpen();
  }

  function ensureSvAccessChip() {
    var old = $("bs-sv-chip");
    var btn = $("bs-toggle-btn");
    var panel = $("bs-panel");
    /* Top-bar Survey (or freq-bar SV) already toggles the panel — never add a second orange SV. */
    if (btn || !panel || !panel.hidden) {
      if (old) old.remove();
      return;
    }
    if (old) return;
    var chip = document.createElement("div");
    chip.id = "bs-sv-chip";
    chip.textContent = "SV";
    chip.title = "Band survey panel is closed — click to open.";
    chip.onclick = function () {
      window._bs_user_closed_panel = false;
      makePanel();
      showPanel();
    };
    document.body.appendChild(chip);
  }

  function ensureTopBarToggleMarkup(btn) {
    btn.classList.add("button", "bs-top-sv");
    /* data-bs-icon bumps force a redraw when icon markup changes */
    if (btn.getAttribute("data-bs-icon") === "outline1") return;
    btn.setAttribute("data-bs-icon", "outline1");
    /* Same layout as Help/Status: 38px outline svg + label */
    btn.innerHTML =
      '<svg class="bs-top-sv-icon" viewBox="0 0 48 48" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="3.2" stroke-linecap="round">' +
      '<line x1="10" y1="40" x2="10" y2="22"/>' +
      '<line x1="20" y1="40" x2="20" y2="12"/>' +
      '<line x1="30" y1="40" x2="30" y2="6"/>' +
      '<line x1="40" y1="40" x2="40" y2="16"/>' +
      "</svg><br/>Survey";
  }

  function ensureFreqbarToggleMarkup(btn) {
    btn.classList.remove("bs-top-sv");
    if (btn.querySelector("svg.bs-top-sv-icon") || btn.querySelector(".bs-top-sv-glyph")) {
      btn.textContent = "SV";
    }
    btn.classList.add("bs-freqbar-fallback");
  }

  function placeTopBarToggle(btn) {
    var bar = document.querySelector(".openwebrx-main-buttons");
    if (!bar) return false;
    ensureTopBarToggleMarkup(btn);
    btn.classList.remove("bs-freqbar-fallback");
    btn.style.left = "";
    btn.style.bottom = "";
    var helpBtn = bar.querySelector('a.button[target="openwebrx-help"]')
      || bar.querySelector('a.button[href*="help"]');
    if (!helpBtn) {
      var btns = bar.querySelectorAll(".button");
      for (var i = 0; i < btns.length; i++) {
        if (/^help$/i.test((btns[i].textContent || "").replace(/\s+/g, " ").trim())) {
          helpBtn = btns[i];
          break;
        }
      }
    }
    var statusBtn = bar.querySelector('[data-toggle-panel="openwebrx-panel-status"]');
    if (!statusBtn) {
      var btns2 = bar.querySelectorAll(".button");
      for (var j = 0; j < btns2.length; j++) {
        if (/^status$/i.test((btns2[j].textContent || "").replace(/\s+/g, " ").trim())) {
          statusBtn = btns2[j];
          break;
        }
      }
    }
    if (statusBtn && btn !== statusBtn && btn.nextSibling !== statusBtn) {
      bar.insertBefore(btn, statusBtn);
    } else if (helpBtn && helpBtn.nextSibling !== btn) {
      bar.insertBefore(btn, helpBtn.nextSibling);
    } else if (btn.parentNode !== bar) {
      bar.appendChild(btn);
    }
    return true;
  }

  function placeFreqbarToggle(btn, container) {
    if (!container) return false;
    ensureFreqbarToggleMarkup(btn);
    if (btn.parentNode !== container) container.appendChild(btn);
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
    return true;
  }

  function placeToggle(btn) {
    if (placeTopBarToggle(btn)) {
      /* Ensure leftover freq-bar styling cannot leave a second visible control. */
      btn.classList.remove("bs-freqbar-fallback");
      var chip = $("bs-sv-chip");
      if (chip) chip.remove();
      return;
    }
    placeFreqbarToggle(btn, $("openwebrx-panel-receiver"));
  }

  function showFallback(msg) {
    var bar = $("bs-fallback");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bs-fallback";
      document.body.appendChild(bar);
    }
    bar.innerHTML = '<button type="button" id="bs-fallback-sv" class="bs-fallback-sv" title="Open the Band survey panel.">SV</button> <span>' +
      escapeHtml(msg) + '</span> <button type="button" id="bs-fallback-help" title="Open the Help tab.">Help</button>';
    var sv = $("bs-fallback-sv");
    if (sv) {
      sv.onclick = function () {
        makePanel();
        var p = $("bs-panel");
        if (!p) return;
        p.hidden = !p.hidden;
        if (!p.hidden) showPanel();
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
        showPanel();
        setStatus("Receiver toolbar not found. Open the SDR receiver page (not a map hub), then hard-refresh.");
      }
    };
    document.body.appendChild(chip);
  }

  function removeStandaloneExplorer() {
    ["owrx-se-bar", "owrx-se-minimap-wrap"].forEach(function (id) {
      var el = $(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.body.classList.remove("owrx-se-explorer-mode");
  }

  function exploreLoadBool(key, fallback) {
    try {
      var v = window.localStorage.getItem(key);
      if (v === "0") return false;
      if (v === "1") return true;
    } catch (e) {}
    return fallback;
  }

  function exploreSaveBool(key, val) {
    try { window.localStorage.setItem(key, val ? "1" : "0"); } catch (e) {}
  }

  function exploreGetMagicKey() {
    return getMagicKey();
  }

  function exploreSetStatus(msg) {
    var el = $("bs-ex-status");
    if (el) el.textContent = msg || "";
    if (msg) setStatus(msg);
  }

  function exploreFmtMhz(hz) {
    if (!hz || !isFinite(hz)) return "——.——————";
    var mhz = hz / 1e6;
    if (mhz >= 1000) return mhz.toFixed(3);
    if (mhz >= 30) return mhz.toFixed(6);
    return mhz.toFixed(4);
  }

  function exploreCurrentHz() {
    var t = currentTuneHz();
    if (t && isFinite(t) && t > 0) return t;
    return typeof window.center_freq === "number" ? window.center_freq : 0;
  }

  function exploreStepHz() {
    var khz = Number(S.exploreStepKhz);
    if (!isFinite(khz) || khz <= 0) khz = 12.5;
    return khz * 1000;
  }

  function exploreOffsetHz() {
    var khz = Number(S.exploreOffsetKhz);
    if (!isFinite(khz) || khz < 0) return 0;
    return khz * 1000;
  }

  function exploreSnapHz(hz) {
    var step = exploreStepHz();
    var off = exploreOffsetHz();
    if (!(step > 0) || !isFinite(hz)) return hz;
    return Math.round((hz - off) / step) * step + off;
  }

  function exploreModeLabel() {
    try {
      if (window.dems) {
        var ids = Object.keys(window.dems);
        var d = ids.length ? window.dems[ids[0]] : null;
        if (d && typeof d.get_modulation === "function") {
          var m = d.get_modulation();
          if (m) return String(m).toUpperCase();
        }
      }
    } catch (e) {}
    try {
      if (window.UI && typeof UI.getModulation === "function") {
        var um = UI.getModulation();
        if (um) return String(um).toUpperCase();
      }
    } catch (e2) {}
    return "—";
  }

  var EX_ANALOG_FALLBACK = [
    { modulation: "nfm", name: "NFM" },
    { modulation: "wfm", name: "WFM" },
    { modulation: "am", name: "AM" },
    { modulation: "lsb", name: "LSB" },
    { modulation: "usb", name: "USB" },
    { modulation: "cw", name: "CW" },
    { modulation: "dsb", name: "DSB" }
  ];
  var EX_ANALOG_ORDER = ["nfm", "wfm", "am", "ams", "lsb", "usb", "cw", "dsb", "sam", "iq"];

  function exploreAnalogModes() {
    try {
      if (window.Modes && typeof Modes.getModes === "function") {
        var list = (Modes.getModes() || []).filter(function (m) {
          return m && m.type === "analog" && m.modulation;
        });
        if (list.length) {
          list.sort(function (a, b) {
            var ia = EX_ANALOG_ORDER.indexOf(a.modulation);
            var ib = EX_ANALOG_ORDER.indexOf(b.modulation);
            if (ia < 0) ia = 99;
            if (ib < 0) ib = 99;
            if (ia !== ib) return ia - ib;
            return String(a.name || a.modulation).localeCompare(String(b.name || b.modulation));
          });
          return list;
        }
      }
    } catch (e) {}
    return EX_ANALOG_FALLBACK;
  }

  function exploreDigiModes() {
    try {
      if (window.Modes && typeof Modes.getModes === "function") {
        return (Modes.getModes() || []).filter(function (m) {
          return m && m.type === "digimode" && m.modulation;
        }).sort(function (a, b) {
          return String(a.name || a.modulation).localeCompare(String(b.name || b.modulation));
        });
      }
    } catch (e) {}
    return [];
  }

  function exploreFillModes() {
    var wrap = $("bs-ex-modes");
    if (!wrap) return;
    var analog = exploreAnalogModes();
    var sig = analog.map(function (m) { return m.modulation; }).join(",");
    if (wrap.getAttribute("data-sig") !== sig) {
      wrap.setAttribute("data-sig", sig);
      wrap.innerHTML = analog.map(function (m) {
        var lab = escapeHtml(m.name || String(m.modulation).toUpperCase());
        return '<button type="button" class="bs-tiny bs-ex-mode" data-ex-mod="' +
          escapeHtml(m.modulation) + '" title="' + lab + '">' + lab + "</button>";
      }).join("");
    }
    var digi = $("bs-ex-digi");
    if (digi) {
      var dlist = exploreDigiModes();
      var dsig = dlist.map(function (m) { return m.modulation; }).join(",");
      if (digi.getAttribute("data-sig") !== dsig) {
        var keep = digi.value;
        digi.setAttribute("data-sig", dsig);
        digi.innerHTML = '<option value="">Analog</option>' + dlist.map(function (m) {
          return '<option value="' + escapeHtml(m.modulation) + '">' +
            escapeHtml(m.name || m.modulation) + "</option>";
        }).join("");
        if (keep) digi.value = keep;
      }
    }
  }

  function exploreCurrentMod() {
    try {
      if (window.UI && typeof UI.getModulation === "function") {
        var m = UI.getModulation();
        if (m) return String(m);
      }
    } catch (e) {}
    try {
      var demod = window.UI && UI.getDemodulator && UI.getDemodulator();
      if (demod && typeof demod.get_modulation === "function") {
        var sec = typeof demod.get_secondary_demod === "function" ? demod.get_secondary_demod() : "";
        return String(sec || demod.get_modulation() || "");
      }
    } catch (e2) {}
    return "";
  }

  function exploreSetMode(mod, underlying) {
    if (!mod) return;
    if (!window.UI || typeof UI.setModulation !== "function") {
      exploreSetStatus("Mode API missing on this page.");
      return;
    }
    try {
      UI.setModulation(mod, underlying || "");
    } catch (e) {
      exploreSetStatus("Could not set mode " + mod);
      return;
    }
    exploreSyncRadioUi();
    exploreSetStatus("Mode → " + String(mod).toUpperCase());
  }

  function exploreSetVolume(v) {
    v = Math.max(0, Math.min(150, Math.round(Number(v))));
    try {
      if (window.UI && typeof UI.setVolume === "function") UI.setVolume(v);
      else if (window.audioEngine && typeof audioEngine.setVolume === "function") {
        var gain = v > 0 ? Math.pow(10, ((v / 2.5) - 55) / 20) : 0;
        audioEngine.setVolume(gain);
      }
    } catch (e) {}
    if ($("bs-ex-vol-val")) $("bs-ex-vol-val").textContent = String(v);
  }

  function exploreToggleMute() {
    try {
      if (window.UI && typeof UI.toggleMute === "function") UI.toggleMute();
    } catch (e) {}
    exploreSyncRadioUi();
  }

  function exploreSetSquelch(v) {
    v = Math.max(-150, Math.min(0, Math.round(Number(v))));
    try {
      var demod = window.UI && UI.getDemodulator && UI.getDemodulator();
      if (demod && typeof demod.setSquelch === "function") demod.setSquelch(v);
      var panel = window.UI && UI.getDemodulatorPanel && UI.getDemodulatorPanel();
      if (panel && panel.el && panel.el.find) {
        panel.el.find(".openwebrx-squelch-slider").val(v);
      }
    } catch (e) {}
    if ($("bs-ex-sql-val")) $("bs-ex-sql-val").textContent = v + " dB";
  }

  function exploreAutoSquelch() {
    var db = smeterDb();
    try {
      if (db == null && typeof getLogSmeterValue === "function" && typeof smeter_level !== "undefined") {
        db = getLogSmeterValue(smeter_level);
      }
    } catch (e) {}
    var margin = 10;
    try {
      var panel = window.UI && UI.getDemodulatorPanel && UI.getDemodulatorPanel();
      if (panel && typeof panel.squelchAvailable === "function" && !panel.squelchAvailable()) {
        exploreSetStatus("Squelch is off in this mode.");
        return;
      }
      if (panel && typeof panel.getSquelchMargin === "function") margin = panel.getSquelchMargin();
    } catch (e2) {}
    if (db == null || !isFinite(db)) {
      exploreSetStatus("No S-meter yet — wait for audio.");
      return;
    }
    var v = Math.max(-150, Math.min(0, Math.round(db + margin)));
    exploreSetSquelch(v);
    var el = $("bs-ex-sql");
    if (el) el.value = v;
    exploreSetStatus("Squelch auto → " + v + " dB");
  }

  function exploreToggleNr() {
    try {
      if (window.UI && typeof UI.toggleNR === "function") UI.toggleNR();
    } catch (e) {}
    exploreSyncRadioUi();
  }

  function exploreSetNr(v) {
    v = Math.max(-20, Math.min(20, Math.round(Number(v))));
    try {
      if (window.UI && typeof UI.setNR === "function") {
        if (!UI.nrEnabled && typeof UI.toggleNR === "function") UI.toggleNR(true);
        UI.setNR(v);
      }
    } catch (e) {}
    if ($("bs-ex-nr-val")) $("bs-ex-nr-val").textContent = v + " dB";
  }

  function exploreSyncRadioUi() {
    exploreFillModes();
    var active = document.activeElement && document.activeElement.id;
    var analog = exploreCurrentMod();
    var underlying = "";
    try {
      if (window.UI && typeof UI.getUnderlying === "function") underlying = UI.getUnderlying() || "";
    } catch (e) {}
    var wrap = $("bs-ex-modes");
    if (wrap) {
      var analogId = underlying || analog;
      wrap.querySelectorAll("[data-ex-mod]").forEach(function (btn) {
        var id = btn.getAttribute("data-ex-mod");
        btn.classList.toggle("bs-ex-chip-on", id === analogId || id === analog);
      });
    }
    var digi = $("bs-ex-digi");
    if (digi && active !== "bs-ex-digi") {
      var dlist = exploreDigiModes();
      var isDigi = false;
      for (var i = 0; i < dlist.length; i++) {
        if (dlist[i].modulation === analog) { isDigi = true; break; }
      }
      digi.value = isDigi ? analog : "";
    }
    var muted = !!(window.UI && UI.volumeMuted >= 0);
    var muteBtn = $("bs-ex-mute");
    if (muteBtn) {
      muteBtn.classList.toggle("bs-on", muted);
      muteBtn.textContent = muted ? "Muted" : "Mute";
    }
    var vol = $("bs-ex-vol");
    var volN = (window.UI && typeof UI.volume === "number" && UI.volume >= 0)
      ? (muted && UI.volumeMuted >= 0 ? UI.volumeMuted : UI.volume)
      : (vol ? Number(vol.value) : 100);
    if (vol && active !== "bs-ex-vol") {
      vol.value = muted ? 0 : volN;
      vol.disabled = muted;
    }
    if ($("bs-ex-vol-val")) $("bs-ex-vol-val").textContent = muted ? "mute" : String(Math.round(muted ? 0 : volN));
    var sql = $("bs-ex-sql");
    var sqlN = squelchSliderDb();
    if (sql && active !== "bs-ex-sql" && sqlN != null) sql.value = sqlN;
    if ($("bs-ex-sql-val") && sqlN != null) $("bs-ex-sql-val").textContent = Math.round(sqlN) + " dB";
    var led = $("bs-ex-sql-led");
    if (led) {
      var open = squelchOpen();
      led.classList.toggle("bs-ex-sql-open", open === true);
      led.classList.toggle("bs-ex-sql-shut", open === false);
      led.title = open === true ? "Squelch open" : open === false ? "Squelch closed" : "Squelch unknown";
    }
    var nrOn = !!(window.UI && UI.nrEnabled);
    var nrBtn = $("bs-ex-nr");
    if (nrBtn) nrBtn.classList.toggle("bs-on", nrOn);
    var nrLvl = $("bs-ex-nr-lvl");
    var nrN = (window.UI && typeof UI.nrThreshold === "number") ? UI.nrThreshold : 0;
    if (nrLvl && active !== "bs-ex-nr-lvl") {
      nrLvl.value = nrN;
      nrLvl.disabled = !nrOn;
    }
    if ($("bs-ex-nr-val")) $("bs-ex-nr-val").textContent = (nrOn ? nrN : "off") + (nrOn ? " dB" : "");
    var sm = $("bs-ex-smeter");
    if (sm) {
      var db = smeterDb();
      sm.textContent = db == null ? "—" : (Math.round(db * 10) / 10) + " dB";
    }
  }

  function bindExploreRadio() {
    var modes = $("bs-ex-modes");
    if (modes && !modes._bs_bound) {
      modes._bs_bound = true;
      modes.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest("[data-ex-mod]");
        if (!btn) return;
        exploreSetMode(btn.getAttribute("data-ex-mod"));
      });
    }
    var digi = $("bs-ex-digi");
    if (digi) {
      digi.onchange = function () {
        var v = digi.value;
        if (!v) {
          var analog = "";
          try {
            if (window.UI && typeof UI.getUnderlying === "function") analog = UI.getUnderlying() || "";
            if (!analog && window.UI && typeof UI.getModulation === "function") analog = UI.getModulation() || "";
          } catch (e) {}
          if (!analog) analog = "nfm";
          exploreSetMode(analog);
        } else exploreSetMode(v);
      };
    }
    if ($("bs-ex-mute")) $("bs-ex-mute").onclick = function () { exploreToggleMute(); };
    if ($("bs-ex-vol")) {
      $("bs-ex-vol").oninput = function () { exploreSetVolume(this.value); };
      $("bs-ex-vol").onchange = function () { exploreSetVolume(this.value); };
    }
    if ($("bs-ex-sql")) {
      $("bs-ex-sql").oninput = function () { exploreSetSquelch(this.value); };
      $("bs-ex-sql").onchange = function () { exploreSetSquelch(this.value); };
    }
    if ($("bs-ex-sql-auto")) $("bs-ex-sql-auto").onclick = function () { exploreAutoSquelch(); };
    if ($("bs-ex-nr")) $("bs-ex-nr").onclick = function () { exploreToggleNr(); };
    if ($("bs-ex-nr-lvl")) {
      $("bs-ex-nr-lvl").oninput = function () { exploreSetNr(this.value); };
      $("bs-ex-nr-lvl").onchange = function () { exploreSetNr(this.value); };
    }
    exploreFillModes();
    exploreSyncRadioUi();
  }

  function exploreProfileLabel() {
    var sel = $("openwebrx-sdr-profiles-listbox");
    if (sel && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) {
      return sel.options[sel.selectedIndex].text || sel.value || "—";
    }
    return "—";
  }

  function exploreFillProfiles() {
    var dest = $("bs-ex-profile-sel");
    var src = $("openwebrx-sdr-profiles-listbox");
    if (!dest) return;
    if (!src || !src.options.length) {
      if (dest.getAttribute("data-sig") !== "empty") {
        dest.setAttribute("data-sig", "empty");
        dest.innerHTML = '<option value="">No profiles</option>';
      }
      return;
    }
    var sig = "";
    var html = "";
    for (var i = 0; i < src.options.length; i++) {
      var opt = src.options[i];
      sig += (opt.value || "") + "\t" + (opt.text || "") + "\n";
      html += '<option value="' + escapeHtml(opt.value) + '">' +
        escapeHtml(opt.text || opt.value) + "</option>";
    }
    if (dest.getAttribute("data-sig") !== sig) {
      dest.setAttribute("data-sig", sig);
      dest.innerHTML = html;
    }
    if (document.activeElement !== dest) dest.value = src.value;
  }

  function exploreRefreshHud() {
    exploreRefreshReadout();
  }

  function exploreTuneTo(hz) {
    hz = Math.round(hz);
    if (!isFinite(hz) || hz <= 0) {
      exploreSetStatus("Need a frequency to tune.");
      return;
    }
    var p = profileForFreq(hz);
    var sel = $("openwebrx-sdr-profiles-listbox");
    var needSwitch = !!(p && sel && p.value && sel.value !== p.value);
    var finish = function () {
      pluginSetFrequency(hz);
      var bw = window.bandwidth || 0;
      var c = window.center_freq || 0;
      if (bw && c && (hz < c - bw * 0.42 || hz > c + bw * 0.42)) {
        exploreSendCenter(hz, true);
      }
      exploreRefreshHud();
    };
    if (needSwitch) {
      exploreSetStatus("Profile → " + (p.label || p.id || "") + " · " + fmtMhz(hz));
      switchProfile(p.value).then(function () { finish(); });
    } else {
      finish();
      exploreSetStatus("Tune → " + fmtMhz(hz));
    }
  }

  function exploreNudge(dir) {
    var hz = exploreCurrentHz();
    if (!hz) {
      exploreSetStatus("No tune yet — wait for the receiver, or use Go MHz.");
      return;
    }
    exploreTuneTo(hz + dir * exploreStepHz());
  }

  function exploreSnap() {
    var hz = exploreCurrentHz();
    if (!hz) {
      exploreSetStatus("Nothing to snap.");
      return;
    }
    exploreTuneTo(exploreSnapHz(hz));
  }

  function exploreGo() {
    var el = $("bs-ex-goto");
    var raw = el ? Number(el.value) : NaN;
    if (!isFinite(raw) || raw <= 0) {
      exploreSetStatus("Type a frequency in MHz, then Go.");
      return;
    }
    var hz = raw >= 10000 ? raw : raw * 1e6;
    exploreTuneTo(hz);
  }

  function exploreFallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      exploreSetStatus("Copied " + text);
    } catch (e) {
      exploreSetStatus("Copy failed.");
    }
  }

  function exploreCopyFreq() {
    var hz = exploreCurrentHz();
    if (!hz) {
      exploreSetStatus("No frequency to copy.");
      return;
    }
    var t = exploreFmtMhz(hz) + " MHz";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () {
        exploreSetStatus("Copied " + t);
      }).catch(function () { exploreFallbackCopy(t); });
    } else exploreFallbackCopy(t);
  }

  function exploreBookmarkHere() {
    var hz = exploreCurrentHz();
    if (!hz) {
      exploreSetStatus("No frequency to bookmark.");
      return;
    }
    var sel = $("openwebrx-sdr-profiles-listbox");
    var pid = "";
    if (sel && sel.value) {
      pid = sel.value.indexOf("|") >= 0 ? sel.value.split("|").slice(1).join("|") : sel.value;
    }
    var row = addBookmark({
      freq: hz,
      seen: 99,
      pid: pid,
      mode: (exploreModeLabel() !== "—" ? String(exploreModeLabel()).toLowerCase() : guessMode(pid)),
      label: "Explore",
      name: "Explore " + exploreFmtMhz(hz)
    });
    if (row) {
      refreshBookmarks();
      exploreSetStatus(row.already ? "Already bookmarked · " + row.name : "Bookmarked " + row.name);
    }
  }

  function exploreRefreshReadout() {
    var el = $("bs-ex-readout");
    var c = typeof window.center_freq === "number" ? window.center_freq : 0;
    var bw = typeof window.bandwidth === "number" ? window.bandwidth : 0;
    var tune = exploreCurrentHz();
    var spanTxt = bw
      ? (bw >= 1e6 ? (bw / 1e6).toFixed(2) + " MHz" : Math.round(bw / 1000) + " kHz")
      : "—";
    if (el) {
      el.textContent = (c ? fmtMhz(c) : "—") + (bw ? " · span " + spanTxt : "");
    }
    var freqEl = $("bs-ex-freq");
    if (freqEl) freqEl.textContent = exploreFmtMhz(tune);
    var modeEl = $("bs-ex-mode");
    if (modeEl) modeEl.textContent = exploreModeLabel();
    var cen = $("bs-ex-center");
    if (cen) cen.textContent = c ? ("center " + fmtMhz(c)) : "center —";
    var offEl = $("bs-ex-offset-read");
    if (offEl) {
      var offHz = (tune && c) ? (tune - c) : 0;
      offEl.textContent = (tune && c)
        ? ("Δ " + (offHz >= 0 ? "+" : "") + (Math.round(offHz / 10) / 100) + " kHz")
        : "Δ —";
    }
    var prof = $("bs-ex-profile");
    if (prof) prof.textContent = exploreProfileLabel();
    var spanEl = $("bs-ex-span");
    if (spanEl) spanEl.textContent = spanTxt;
    var stepLive = $("bs-ex-step-live");
    if (stepLive) {
      var sk = Number(S.exploreStepKhz) > 0 ? Number(S.exploreStepKhz) : 12.5;
      var ok = Number(S.exploreOffsetKhz) || 0;
      stepLive.textContent = ok ? (sk + " / +" + ok + " kHz") : (sk + " kHz");
    }
    var gotoEl = $("bs-ex-goto");
    if (gotoEl && document.activeElement !== gotoEl && tune) {
      if (!gotoEl.value) gotoEl.placeholder = exploreFmtMhz(tune);
    }
    var chips = $("bs-ex-step-presets");
    if (chips) {
      var cur = String(Number(S.exploreStepKhz) > 0 ? S.exploreStepKhz : 12.5);
      chips.querySelectorAll("[data-ex-step]").forEach(function (btn) {
        btn.classList.toggle("bs-ex-chip-on", btn.getAttribute("data-ex-step") === cur);
      });
    }
    exploreSyncRadioUi();
    exploreFillProfiles();
  }

  function exploreShiftProfile(direction) {
    var sel = $("openwebrx-sdr-profiles-listbox");
    if (!sel || !sel.options.length) {
      exploreSetStatus("No profiles to hop.");
      return false;
    }
    var next = sel.selectedIndex + (direction < 0 ? -1 : 1);
    if (next < 0 || next >= sel.options.length) {
      exploreSetStatus(direction < 0 ? "Already at first profile." : "Already at last profile.");
      return false;
    }
    var opt = sel.options[next];
    switchProfile(opt.value);
    explore.overview = null;
    explore.segmentStart = 0;
    explore.segmentEnd = 0;
    exploreSetStatus("→ " + (opt.text || opt.value));
    exploreFillProfiles();
    exploreRefreshReadout();
    return true;
  }

  function exploreSendCenter(freq, immediate) {
    freq = Math.round(freq);
    if (!isFinite(freq) || freq < 0) return;
    explore.pendingCenter = freq;
    if (explore.debounceTimer) clearTimeout(explore.debounceTimer);
    var fire = function () {
      explore.debounceTimer = null;
      explore.pendingCenter = null;
      bsInternalTune = true;
      try {
        var sock = window.ws;
        if (sock && sock.readyState === 1) {
          sock.send(JSON.stringify({
            type: "setfrequency",
            params: { frequency: freq, key: exploreGetMagicKey() }
          }));
          exploreSetStatus("Center → " + fmtMhz(freq));
        }
        if (window.UI && typeof UI.toggleScanner === "function") UI.toggleScanner(false);
      } finally {
        setTimeout(function () { bsInternalTune = false; }, 0);
      }
      exploreRefreshReadout();
    };
    if (immediate) fire();
    else explore.debounceTimer = setTimeout(fire, EX_DEBOUNCE_MS);
  }

  function exploreCanvas() {
    return $("webrx-canvas-container");
  }

  function exploreCanvasWidth() {
    var c = exploreCanvas();
    if (!c) return 0;
    var canvas = c.querySelector("canvas");
    return canvas ? (canvas.clientWidth || canvas.width) : c.clientWidth;
  }

  function exploreIsPanTarget(target) {
    if (!explore.on || !target) return false;
    if (running || listenScanRunning || surveyRunning) return false;
    if (target.closest && target.closest("#bs-panel, #bs-ex-minimap-wrap, #owrx-se-bar")) return false;
    if (target.closest && target.closest(".openwebrx-demodulator, .webrx-demodulator")) return false;
    var container = exploreCanvas();
    return !!(container && container.contains(target));
  }

  function exploreBlock(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }

  function exploreOnWheel(ev) {
    if (!exploreIsPanTarget(ev.target)) return;
    exploreBlock(ev);
    if (ev.altKey) {
      exploreShiftProfile(ev.deltaY > 0 ? 1 : -1);
      return;
    }
    var step = exploreStepHz();
    if (ev.shiftKey) step *= 10;
    exploreTuneTo((exploreCurrentHz() || window.center_freq || 0) + (ev.deltaY > 0 ? step : -step));
  }

  function exploreOnDown(ev) {
    if (!explore.on || ev.button !== 0) return;
    if (!exploreIsPanTarget(ev.target)) return;
    exploreBlock(ev);
    explore.dragging = true;
    explore.dragStartX = ev.clientX;
    explore.dragStartCenter = window.center_freq || 0;
    explore.movedPx = 0;
    var c = exploreCanvas();
    if (c) c.classList.add("bs-ex-pan-active");
    window.addEventListener("mousemove", exploreOnMove, true);
    window.addEventListener("mouseup", exploreOnUp, true);
  }

  function exploreOnMove(ev) {
    if (!explore.dragging) return;
    exploreBlock(ev);
    explore.movedPx = Math.max(explore.movedPx, Math.abs(ev.clientX - explore.dragStartX));
  }

  function exploreOnUp(ev) {
    window.removeEventListener("mousemove", exploreOnMove, true);
    window.removeEventListener("mouseup", exploreOnUp, true);
    if (!explore.dragging) return;
    explore.dragging = false;
    var c = exploreCanvas();
    if (c) c.classList.remove("bs-ex-pan-active");
    if (explore.movedPx <= EX_CLICK_MAX_PX && c) {
      exploreBlock(ev);
      var rect = c.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var bw = window.bandwidth || 2400000;
      var center = window.center_freq || 0;
      var freq = (center - bw / 2) + (x / rect.width) * bw;
      if (window.UI && typeof UI.setFrequency === "function") UI.setFrequency(Math.round(freq));
      return;
    }
    exploreBlock(ev);
    var width = exploreCanvasWidth() || 1;
    var dx = ev.clientX - explore.dragStartX;
    if (Math.abs(dx) >= width * 0.35) {
      exploreShiftProfile(dx < 0 ? 1 : -1);
      return;
    }
    var deltaHz = -(dx / width) * (window.bandwidth || 2400000);
    exploreSendCenter(explore.dragStartCenter + deltaHz, true);
  }

  function exploreInstallHandlers() {
    var container = exploreCanvas();
    if (!container || container._bs_ex_handlers) return;
    container._bs_ex_handlers = true;
    var cap = { passive: false, capture: true };
    container.addEventListener("wheel", exploreOnWheel, cap);
    container.addEventListener("mousedown", exploreOnDown, cap);
    explore.handlersOn = true;
  }

  function exploreNewOverview() {
    var ov = new Float32Array(EX_MINIMAP_BINS);
    ov.fill(EX_OVERVIEW_EMPTY);
    return ov;
  }

  function exploreEnsureSegment() {
    var center = window.center_freq || 0;
    var bw = window.bandwidth || 2400000;
    var span = Math.max(bw * 12, bw * 4);
    if (!explore.segmentStart && !explore.segmentEnd) {
      explore.segmentStart = center - span / 2;
      explore.segmentEnd = center + span / 2;
      return;
    }
    var margin = span * 0.15;
    if (center - bw / 2 < explore.segmentStart + margin || center + bw / 2 > explore.segmentEnd - margin) {
      explore.segmentStart = center - span / 2;
      explore.segmentEnd = center + span / 2;
      explore.overview = exploreNewOverview();
    }
  }

  function exploreMergeWaterfall(data) {
    if (!explore.on || !explore.minimapOn || !data || data.length < 8) return;
    exploreEnsureSegment();
    if (!explore.overview) explore.overview = exploreNewOverview();
    var center = window.center_freq || 0;
    var bw = window.bandwidth || 2400000;
    var segW = explore.segmentEnd - explore.segmentStart;
    if (segW <= 0) return;
    var i;
    for (i = 0; i < data.length; i++) {
      var f = (center - bw / 2) + (i / data.length) * bw;
      if (f < explore.segmentStart || f > explore.segmentEnd) continue;
      var bin = Math.floor(((f - explore.segmentStart) / segW) * EX_MINIMAP_BINS);
      if (bin < 0 || bin >= EX_MINIMAP_BINS) continue;
      if (data[i] > explore.overview[bin]) explore.overview[bin] = data[i];
    }
  }

  function exploreHookWaterfall() {
    if (window._bs_ex_wf_hooked || typeof window.waterfall_add !== "function") return;
    var orig = window.waterfall_add;
    window.waterfall_add = function (data) {
      exploreMergeWaterfall(data);
      return orig.apply(this, arguments);
    };
    window._bs_ex_wf_hooked = true;
  }

  function exploreRemoveMinimapDom() {
    explore.minimapOn = false;
    explore.minimap = null;
    explore.minimapCtx = null;
    var wrap = $("bs-ex-minimap-wrap");
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  function exploreDrawMinimap() {
    exploreRemoveMinimapDom();
  }

  function exploreEnsureMinimapDom() {
    exploreRemoveMinimapDom();
  }

  function exploreRefreshButtons() {
    var tog = $("bs-ex-toggle");
    if (tog) {
      tog.textContent = explore.on ? "Explore on" : "Explore off";
      tog.classList.toggle("bs-on", explore.on);
      tog.classList.toggle("bs-primary", explore.on);
    }
    exploreRemoveMinimapDom();
    document.body.classList.toggle("bs-explore-mode", explore.on);
  }

  function setExploreMinimap() {
    explore.minimapOn = false;
    exploreSaveBool(LS_EXPLORE_MM, false);
    exploreRemoveMinimapDom();
  }

  function setExploreMode(on) {
    explore.on = !!on;
    exploreSaveBool(LS_EXPLORE, explore.on);
    if (explore.on) {
      removeStandaloneExplorer();
      exploreInstallHandlers();
      exploreHookWaterfall();
      exploreRemoveMinimapDom();
      exploreSetStatus("Explore on — drag to hop tiles · wheel steps VFO · Alt+wheel hops profiles.");
    } else {
      exploreSetStatus("Explore off.");
    }
    exploreRefreshButtons();
    exploreRefreshReadout();
  }

  function initExploreUi() {
    if (initExploreUi._done) return;
    initExploreUi._done = true;
    explore.on = exploreLoadBool(LS_EXPLORE, false);
    explore.minimapOn = false;
    exploreSaveBool(LS_EXPLORE_MM, false);
    removeStandaloneExplorer();
    exploreInstallHandlers();
    exploreHookWaterfall();
    exploreRemoveMinimapDom();
    exploreRefreshButtons();
    exploreRefreshReadout();
    if (explore.on) exploreSetStatus("Explore on — drag to hop tiles · wheel steps VFO · Alt+wheel hops profiles.");
    exploreFillModes();
    exploreFillProfiles();
    exploreSyncRadioUi();
    setInterval(function () {
      if (!exploreCanvas() || !exploreCanvas()._bs_ex_handlers) exploreInstallHandlers();
      exploreRefreshReadout();
    }, 500);
  }

  function ensureUi() {
    hookWaterfall();
    hookHide();
    hookTuneApi();
    makePanel();
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
      btn.title = "Band survey — pick bands, count peaks. Click for the panel; Help is a tab inside.";
      btn.onclick = function () {
        var panel = $("bs-panel");
        if (!panel) return;
        panel.hidden = !panel.hidden;
        if (!panel.hidden) {
          window._bs_user_closed_panel = false;
          showPanel();
        } else {
          window._bs_user_closed_panel = true;
          window._bs_startup_grace_until = 0;
          if (typeof saStop === "function") saStop();
              ensureSvAccessChip();
        }
      };
    }
    placeToggle(btn);
    ensureSvAccessChip();
    if (!window._bs_ui_ready) {
      window._bs_ui_ready = true;
      backupLocalBookmarks("first-ui");
      if (S.hideAuto) refreshBookmarks();
      applySchedule();
      runStartupPanelOpen();
    }
    maintainStartupPanelOpen();
  }

  if (Plugins.utils && Plugins.utils.on_ready) {
    Plugins.utils.on_ready(ensureUi);
  }
  window.addEventListener("pagehide", function () {
    if (pendingAudioWrites.length) {
      warnAudioIdb("page left with " + pendingAudioWrites.length + " audio clip write(s) still pending");
    }
  });
  setTimeout(ensureUi, 400);
  setTimeout(ensureUi, 1500);
  setTimeout(ensureUi, 4000);
  setInterval(function () {
    var btn = $("bs-toggle-btn");
    if (btn) placeToggle(btn);
    ensureSvAccessChip();
  }, 2500);
  return true;
};
