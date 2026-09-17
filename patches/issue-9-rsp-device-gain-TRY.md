# Try-patch for Phil — RSP1b gain under Device settings (issue #9)
# Target: Toolbox v438 / v440 toolbox.js (NOT a main-repo release)
# Goal: if profile form has no gain fields, load/save from Device settings instead.
#
# Easiest: send the ready-made file
#   patches/issue-9-toolbox.js
# He backs up toolbox.js, then copies that file in as toolbox.js (same folder).
#
# Apply on the server that runs OpenWebRX (backup toolbox.js first).
#
#   cd /path/to/.../htdocs/plugins/receiver/toolbox
#   cp toolbox.js toolbox.js.bak-before-device-gain
#   cp /path/to/issue-9-toolbox.js toolbox.js
#   # OR apply the manual edits below on his existing v438/v440 file
#
# After edit: hard refresh the receiver (Ctrl+Shift+R), Settings admin login,
# Explore → Hardware gain → Retry.
#
# Status line should say "saves into this DEVICE" when the device form is used.
# If it still says "profile" or stays greyed, send the status text + any console error.

## Manual edits (same effect as the patch)

### 1) In `var exGain = { ... }` add one field:
      store: "profile",

### 2) Immediately AFTER `function fetchProfileAdminForm(...) { ... }`
     paste the block marked INSERT_A below.

### 3) Replace entire `function exploreGainPostParams` with REPLACE_POST below.

### 4) Replace entire `function exploreGainVerifyStored` with REPLACE_VERIFY below.

### 5) Replace entire `function exploreGainLoad` with REPLACE_LOAD below.

--- INSERT_A ---
  function exploreGainParamsHaveGain(params, form) {
    if (params) {
      if (params.has("rfgain_sel") || params.has("rf_gain") ||
          params.has("rf_gain-select") || params.has("rf_gain-manual")) return true;
      try {
        params.forEach(function (v, k) {
          if (/^rf_gain-/i.test(String(k || ""))) throw "yes";
        });
      } catch (eY) {
        if (eY === "yes") return true;
      }
    }
    if (form) {
      try {
        if (form.querySelector(
          '[name="rfgain_sel"],[name="rf_gain"],[name="rf_gain-select"],[name="rf_gain-manual"],[name^="rf_gain-"]'
        )) return true;
      } catch (eQ) {}
    }
    return false;
  }

  function settingsSdrDeviceUrl(device) {
    var path = "settings/sdr/" + encodeURIComponent(device);
    try {
      var base = (document.querySelector("base") && document.querySelector("base").href) || (location.origin + "/");
      var a = document.querySelector('a[href*="settings/sdr/"]');
      if (a && a.href) {
        var m = a.href.match(/^(.*\/settings\/sdr\/)[^/]+/);
        if (m) return m[1] + encodeURIComponent(device);
      }
      return new URL(path, base).pathname;
    } catch (e0) {
      return "/" + path;
    }
  }

  function fetchDeviceAdminForm(deviceId, done) {
    deviceId = String(deviceId || "").trim();
    if (!deviceId) {
      done(new Error("missing"));
      return;
    }
    var url = settingsSdrDeviceUrl(deviceId);
    fetch(url, { credentials: "same-origin", redirect: "follow" }).then(function (res) {
      if (res.status === 401 || res.status === 403) throw new Error("admin");
      if (res.status === 404) throw new Error("notfound");
      if (!res.ok) throw new Error("http-" + res.status);
      return res.text();
    }).then(function (html) {
      if (htmlLooksLikeOwrxLogin(html)) throw new Error("admin");
      var doc = new DOMParser().parseFromString(html, "text/html");
      var form = doc.querySelector("form.settings-body") ||
        doc.querySelector("form[action*='settings/sdr']") ||
        doc.querySelector("form");
      if (!form) throw new Error("noform");
      if (form.querySelector('input[name="password"]') && form.querySelector('input[name="user"]')) {
        throw new Error("admin");
      }
      var params = collectAdminFormParams(form);
      if (!params.get("name") && !params.get("type") && !exploreGainParamsHaveGain(params, form)) {
        throw new Error("empty");
      }
      done(null, { params: params, form: form, store: "device", deviceId: deviceId });
    }).catch(function (err) {
      done(err || new Error("fail"));
    });
  }

  function updateOpenwebrxDevice(deviceId, body, done) {
    deviceId = String(deviceId || "").trim();
    if (!deviceId) {
      done(new Error("missing"));
      return;
    }
    var url = settingsSdrDeviceUrl(deviceId);
    var safeBody = sanitizeAdminProfileBody(
      typeof body === "string" ? body : String(body || "")
    );
    fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: safeBody,
      redirect: "follow"
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) throw new Error("admin");
      if (res.status === 404) throw new Error("notfound");
      return res.text().then(function (html) {
        var finalUrl = "";
        try { finalUrl = String(res.url || ""); } catch (eU) {}
        if (/\/login(?:\?|$)/i.test(finalUrl) || htmlLooksLikeOwrxLogin(html || "")) {
          throw new Error("admin");
        }
        if (!res.ok) throw new Error("http-" + res.status);
        if (/bg-danger|Your settings could not be saved|class="invalid-feedback"/i.test(html || "")) {
          throw new Error("rejected");
        }
        done(null);
      });
    }).catch(function (err) {
      done(err || new Error("fail"));
    });
  }

--- REPLACE_POST ---
  function exploreGainPostParams(params, done) {
    var prof = currentProfileValue();
    function onDone(err) {
      if (err && err.message === "admin") {
        owrxAdmin = false;
        try { syncSettingsAdminGate(); } catch (eG) {}
        exGain.canSave = false;
        exploreGainControlsEnabled(false);
        done(err);
        return;
      }
      if (!err) exGain.baseline = params;
      done(err);
    }
    if (exGain.store === "device") {
      var parts = splitProfileValue(prof);
      var deviceId = parts.device || currentSdrDeviceId() || "";
      updateOpenwebrxDevice(deviceId, params.toString(), onDone);
      return;
    }
    updateOpenwebrxProfile(prof, params.toString(), onDone);
  }

--- REPLACE_VERIFY ---
  function exploreGainVerifyStored(wantMode, wantDb, done) {
    var prof = currentProfileValue();
    function check(err, result) {
      if (err) {
        done(err);
        return;
      }
      if (!result || !result.params) {
        done(new Error("verify"));
        return;
      }
      var p = result.params;
      var gotSel = p.get("rf_gain-select");
      var gotMan = p.get("rf_gain-manual");
      var gotRaw = p.get("rf_gain");
      var gotRf = p.get("rfgain_sel");
      if (wantMode === "auto") {
        done(null, gotSel === "auto" || gotRaw === "auto", "AGC");
        return;
      }
      var got = gotMan != null && gotMan !== "" ? Number(gotMan) : Number(gotRaw);
      if (!isFinite(got) && gotRf != null && gotRf !== "") got = Number(gotRf);
      var ok = isFinite(got) && Math.abs(got - Number(wantDb)) < 0.08;
      if (!ok && gotRf != null && String(gotRf) === String(wantDb)) ok = true;
      done(null, ok, isFinite(got) ? got : (gotMan || gotRaw || gotRf || "?"));
    }
    if (exGain.store === "device") {
      var parts = splitProfileValue(prof);
      fetchDeviceAdminForm(parts.device || currentSdrDeviceId() || "", check);
      return;
    }
    fetchProfileAdminForm(prof, check);
  }

--- REPLACE_LOAD ---
  function exploreGainLoad(profileValue) {
    profileValue = String(profileValue || "");
    if (!exploreGainWanted()) {
      exploreGainHide();
      return;
    }
    var family = exploreGainAutoFamily();
    if (!profileValue) {
      exploreGainShowPreview();
      return;
    }
    exploreGainSetLabels(family);
    var grp = $("bs-ex-gain-group");
    if (exGain.loading) return;
    exGain.loading = true;
    if (grp) grp.hidden = false;
    exploreGainSetStatus("Loading gain (profile, then device if needed)…");

    function finishOk(result, store) {
      var params = result && result.params;
      var form = result && result.form;
      owrxAdmin = true;
      try { syncSettingsAdminGate(); } catch (eOk) {}
      exploreGainSetLabels(family);
      exploreGainPopulateFromResult(form, params);
      if (!exGain.supported) {
        exploreGainShowPreview();
        exploreGainSetStatus("No gain fields on " + store + " form — showing preview.");
        return;
      }
      exGain.profile = profileValue;
      exGain.store = store;
      exGain.baseline = params;
      exGain.canSave = true;
      exGain.stale = false;
      if (grp) grp.hidden = false;
      exploreGainControlsEnabled(true);
      if (family === "sdrplay") {
        exploreGainSetStatus(
          "Higher reduction = less signal · saves into this " +
          (store === "device" ? "DEVICE" : "profile") +
          " (try-patch). RF has no Auto. IF Auto = hardware AGC."
        );
      } else {
        exploreGainSetStatus(
          "Hardware gain · saves into this " +
          (store === "device" ? "DEVICE" : "profile") + " (try-patch)."
        );
      }
    }

    function tryDevice(afterProfileErr) {
      var parts = splitProfileValue(profileValue);
      var deviceId = parts.device || currentSdrDeviceId() || "";
      exploreGainSetStatus("No gain on profile — trying Device settings…");
      fetchDeviceAdminForm(deviceId, function (err2, result2) {
        exGain.loading = false;
        if (err2 && err2.message === "admin") {
          owrxAdmin = false;
          try { syncSettingsAdminGate(); } catch (eG) {}
          exGain.profile = profileValue;
          exGain.supported = true;
          exGain.baseline = null;
          exGain.canSave = false;
          exGain.stale = false;
          exploreGainShowPreview();
          exploreGainSetStatus(
            "Settings admin login required. Open Settings → log in → Retry. (try-patch)"
          );
          return;
        }
        if (err2 || !result2 || !exploreGainParamsHaveGain(result2.params, result2.form)) {
          exploreGainShowPreview();
          exploreGainSetStatus(
            "Could not load device gain (“" +
            ((err2 && err2.message) || (afterProfileErr && afterProfileErr.message) || "nogain") +
            "”). Open Device settings, confirm RF/IF are there, then Retry."
          );
          return;
        }
        finishOk(result2, "device");
      });
    }

    fetchProfileAdminForm(profileValue, function (err, result) {
      if (err && err.message === "admin") {
        exGain.loading = false;
        owrxAdmin = false;
        try { syncSettingsAdminGate(); } catch (eG) {}
        exGain.profile = profileValue;
        exGain.supported = true;
        exGain.baseline = null;
        exGain.canSave = false;
        exGain.stale = false;
        exploreGainShowPreview();
        exploreGainSetStatus(
          "Settings admin login required in this browser. Open Settings → log in → Retry."
        );
        return;
      }
      if (!err && result && exploreGainParamsHaveGain(result.params, result.form)) {
        exGain.loading = false;
        finishOk(result, "profile");
        return;
      }
      /* Profile OK but no gain keys (Phil / RSP1b), or soft profile failure → device. */
      tryDevice(err);
    });
  }
