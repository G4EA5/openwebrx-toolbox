# Licence-class and callsign-series detail merged into callsign-allocations.json.
# Keys match the "country" field in ENTRIES. United Kingdom is inserted as its own row.

UK_ENTRY = {
    "country": "United Kingdom",
    "continent": "EU",
    "cq": 14,
    "itu": 27,
    "dxcc": 223,
    "summary": "Ofcom issues Foundation, Intermediate, and Full (Advanced) licences. "
               "Callsign structure depends on level and home nation (England, Scotland, Wales, NI, Crown Dependencies).",
    "periods": [
        {
            "start": 1920,
            "end": None,
            "prefixes": "G, M, 2E/2M/2W/2I, M3/M6/M7, GM, GW, GI, GD, GJ, GU, MM, MW, MI, MD, MJ, MG",
            "note": "ITU block G*; regional second letter/digit in legacy G calls — see Callsign series below.",
        }
    ],
    "licences": [
        {
            "level": "Foundation",
            "start": 2002,
            "end": None,
            "callsigns": "M3xxx, M6xxx, M7xxx (England); MM6/M7 (Scotland); MW6/M7 (Wales); MI6/M7 (NI); similar on GD/GJ/GU",
            "privileges": "10 W PEP (most bands); Foundation band plan — limited HF (e.g. 80/40/20/15/10 m segments), VHF/UHF.",
            "note": "M7 is the current Foundation issue block (replacing M6 for new licences).",
        },
        {
            "level": "Intermediate",
            "start": 1991,
            "end": None,
            "callsigns": "2E0xxx (England), 2M0xxx (Scotland), 2W0xxx (Wales), 2I0xxx (Northern Ireland)",
            "privileges": "50 W PEP; wider HF than Foundation but not all Full bands; cannot operate on all Advanced-only segments.",
            "note": "Leading 2 marks Intermediate; nation letter E/M/W/I as per Full.",
        },
        {
            "level": "Full (Advanced)",
            "start": 1991,
            "end": None,
            "callsigns": "M0, MM0, MW0, MI0, MD0, MJ0, MG0 + suffix; legacy G… calls remain valid",
            "privileges": "Up to 400 W PEP on UK amateur bands; all allocations in the UK amateur licence schedule.",
            "note": "New Full issues use M+0; Scotland/Wales/NI use MM0, MW0, MI0, etc.",
        },
        {
            "level": "Legacy Full (Class A)",
            "start": 1920,
            "end": None,
            "callsigns": "G + digit + suffix (e.g. G3VZL, G4EA5) — retained for life",
            "privileges": "Treated as Full; original Class A/B distinctions abolished but callsigns kept.",
            "note": "Second digit G1–G8 indicated regional issue block (see series table), not Foundation/Intermediate.",
        },
        {
            "level": "Legacy Class B (historical)",
            "start": 1920,
            "end": 2003,
            "callsigns": "2-letter regional prefixes (e.g. G3… with restricted privileges in early decades)",
            "privileges": "Historically restricted HF; merged into modern licence framework by 2003 reform.",
            "note": "Superseded by Foundation / Intermediate / Full structure.",
        },
    ],
    "callsignSeries": [
        {"series": "G1", "start": 1920, "end": None, "meaning": "London area (historical primary issue)", "note": "Still seen on grandfathered G1 calls."},
        {"series": "G2", "start": 1920, "end": None, "meaning": "England — North (historical)", "note": ""},
        {"series": "G3", "start": 1920, "end": None, "meaning": "England — general / most common today", "note": "Many UK HF operators hold G3/G4 calls."},
        {"series": "G4", "start": 1920, "end": None, "meaning": "England — Midlands / general", "note": ""},
        {"series": "G5", "start": 1920, "end": None, "meaning": "Wales (historical block)", "note": "Modern Wales also GW/MW."},
        {"series": "G6", "start": 1920, "end": None, "meaning": "Scotland (historical block)", "note": "Modern Scotland GM/MM."},
        {"series": "G7", "start": 1920, "end": None, "meaning": "Scotland / north (historical)", "note": ""},
        {"series": "G8", "start": 1920, "end": None, "meaning": "Northern Ireland (historical block)", "note": "Modern NI GI/MI."},
        {"series": "M0", "start": 1996, "end": None, "meaning": "England Full (new issue)", "note": ""},
        {"series": "2E0", "start": 1991, "end": None, "meaning": "England Intermediate", "note": ""},
    ],
}

PATCHES = {
    "United States": {
        "summary": "FCC three-class system: Technician, General, Extra. "
                   "Exam Element credits (formerly written tests). Vanity calls follow group rules by class.",
        "licences": [
            {
                "level": "Technician",
                "start": 1951,
                "end": None,
                "callsigns": "Group C/D: district K/W/N + 3 letters (e.g. K1ABC); any unassigned block",
                "privileges": "All privileges above 30 MHz; HF on specified segments (expanded over time — Tech HF bands).",
                "note": "Entry-level; Element 2 + Element 3 (or credit) for General/Extra path.",
            },
            {
                "level": "General",
                "start": 1912,
                "end": None,
                "callsigns": "Same pool as Technician; historically distinguished by exam, not prefix",
                "privileges": "Most HF amateur bands; not all Extra-only segments (e.g. some 80/75/20/15 edges).",
                "note": "Requires Technician + General exam credits (Elements 2+3).",
            },
            {
                "level": "Extra",
                "start": 1952,
                "end": None,
                "callsigns": "Group A/B preferred: 1×2, 2×1, 1×3 (e.g. K1A, AA1A, W1AW); shorter = older Extra",
                "privileges": "All US amateur bands and modes; maximum spectrum access.",
                "note": "Merged Advanced/Extra 2012; Element 4 exam.",
            },
            {
                "level": "Novice",
                "start": 1951,
                "end": 2000,
                "callsigns": "K/W/N + 2×3 with N or W as second letter in some eras",
                "privileges": "Limited HF/VHF; CW/digital segments; no longer issued.",
                "note": "Ended 2000; many holders upgraded.",
            },
            {
                "level": "Advanced (historical)",
                "start": 1952,
                "end": 2012,
                "callsigns": "Group B 2×2, 2×3",
                "privileges": "Between General and Extra; merged into Extra class 2012.",
                "note": "Grandfathered Extra privileges for holders.",
            },
        ],
        "callsignSeries": [
            {"series": "1×2", "start": 1912, "end": None, "meaning": "Extra / long-time Extra vanity (e.g. W1AW)", "note": "Scarce."},
            {"series": "2×1", "start": 1912, "end": None, "meaning": "Extra only (e.g. K1A)", "note": ""},
            {"series": "1×3", "start": 1946, "end": None, "meaning": "Extra, General, Technician new issues", "note": "Most common today."},
            {"series": "2×2", "start": 1978, "end": None, "meaning": "Advanced-era block; now Extra-eligible", "note": ""},
            {"series": "KH6 / KL7 / KP4", "start": 1920, "end": None, "meaning": "Hawaii, Alaska, Puerto Rico districts", "note": "Separate DXCC entities."},
        ],
    },
    "Canada": {
        "licences": [
            {"level": "Basic", "start": 1919, "end": None, "callsigns": "VA–VE, VO, CY, XF + 2–3 letters",
             "privileges": "HF/VHF per Basic qualification; some bands need Honours.", "note": "ISED."},
            {"level": "Basic + Honours", "start": 1990, "end": None, "callsigns": "Same prefix blocks",
             "privileges": "Full HF amateur spectrum in Canada.", "note": "Higher exam pass."},
        ],
    },
    "Germany": {
        "licences": [
            {"level": "Klasse E (Einführung)", "start": 2005, "end": None, "callsigns": "DO…, DN… (training prefixes vary)",
             "privileges": "Entry-level power/band limits.", "note": "Bundesnetzagentur."},
            {"level": "Klasse A (Zugang)", "start": 2005, "end": None, "callsigns": "DA–DR, DL, DF, DG… by Land",
             "privileges": "Full CEPT-aligned privileges.", "note": "Replaced older Class 1/2 structure."},
        ],
    },
    "France": {
        "licences": [
            {"level": "Certificat d'initiation", "start": 1997, "end": None, "callsigns": "F1xxx / F4xxx style by region",
             "privileges": "Limited bands/power.", "note": "ANFR."},
            {"level": "Licence", "start": 1921, "end": None, "callsigns": "F, TM, TK (Corsica)",
             "privileges": "Full national amateur allocation.", "note": ""},
        ],
    },
    "Italy": {
        "licences": [
            {"level": "Foundation (ES)", "start": 2005, "end": None, "callsigns": "IØ / IWØ blocks for new entrants",
             "privileges": "Limited segments.", "note": ""},
            {"level": "Full", "start": 1924, "end": None, "callsigns": "I, IS, IT",
             "privileges": "Full bands.", "note": ""},
        ],
    },
    "Spain": {
        "licences": [
            {"level": "Novice / entry", "start": 1992, "end": None, "callsigns": "EA–EE regional + suffix",
             "privileges": "Restricted power.", "note": ""},
            {"level": "Full", "start": 1924, "end": None, "callsigns": "EA–EE",
             "privileges": "Full allocation.", "note": ""},
        ],
    },
    "Netherlands": {
        "licences": [
            {"level": "F (Foundation)", "start": 2005, "end": None, "callsigns": "PD…, PF… novice blocks",
             "privileges": "Entry level.", "note": ""},
            {"level": "Full (N/F licence)", "start": 1923, "end": None, "callsigns": "PA–PI",
             "privileges": "Full CEPT.", "note": ""},
        ],
    },
    "Poland": {
        "licences": [
            {"level": "Entry / SWL path", "start": 2004, "end": None, "callsigns": "SP, SQ, SN, SO, SR, HF",
             "privileges": "By exam tier.", "note": ""},
            {"level": "Full", "start": 1924, "end": None, "callsigns": "SP + district digit",
             "privileges": "Full bands.", "note": ""},
        ],
    },
    "Australia": {
        "licences": [
            {"level": "Foundation", "start": 2005, "end": None, "callsigns": "VKxFxxx (F in suffix position)",
             "privileges": "Limited bands/power.", "note": "ACMA."},
            {"level": "Standard", "start": 2005, "end": None, "callsigns": "VKx… standard issue",
             "privileges": "Most bands.", "note": ""},
            {"level": "Advanced", "start": 2005, "end": None, "callsigns": "VKx… shorter / earlier blocks",
             "privileges": "Full spectrum including some Standard-only exclusions reversed.", "note": ""},
        ],
    },
    "Japan": {
        "licences": [
            {"level": "Fourth class (4級)", "start": 1950, "end": None, "callsigns": "JA/JS/JE… + long suffix",
             "privileges": "VHF/UHF centric historically.", "note": ""},
            {"level": "First class (1級)", "start": 1950, "end": None, "callsigns": "JA/JS 2×2 / 2×3",
             "privileges": "Full HF.", "note": "Reformed several times — check MIC."},
        ],
    },
    "England (UK)": {
        "summary": "See United Kingdom entry for Foundation / Intermediate / Full and G1–G8 series.",
    },
    "Scotland": {
        "summary": "UK licence classes — callsigns use GM/MM (Full), 2M0 (Intermediate), M7/MM6 (Foundation).",
        "licences": [
            {"level": "Foundation", "start": 2002, "end": None, "callsigns": "MM6, MM7, M6…", "privileges": "As UK Foundation.", "note": ""},
            {"level": "Intermediate", "start": 1991, "end": None, "callsigns": "2M0xxx", "privileges": "As UK Intermediate.", "note": ""},
            {"level": "Full", "start": 1991, "end": None, "callsigns": "GM, MM0", "privileges": "As UK Full.", "note": "Legacy GM/G8 calls."},
        ],
    },
    "Wales": {
        "licences": [
            {"level": "Foundation", "start": 2002, "end": None, "callsigns": "MW6, MW7", "privileges": "As UK Foundation.", "note": ""},
            {"level": "Intermediate", "start": 1991, "end": None, "callsigns": "2W0xxx", "privileges": "As UK Intermediate.", "note": ""},
            {"level": "Full", "start": 1991, "end": None, "callsigns": "GW, MW0", "privileges": "As UK Full.", "note": "Legacy GW/G5."},
        ],
    },
    "Northern Ireland": {
        "licences": [
            {"level": "Foundation", "start": 2002, "end": None, "callsigns": "MI6, MI7", "privileges": "As UK Foundation.", "note": ""},
            {"level": "Intermediate", "start": 1991, "end": None, "callsigns": "2I0xxx", "privileges": "As UK Intermediate.", "note": ""},
            {"level": "Full", "start": 1991, "end": None, "callsigns": "GI, MI0", "privileges": "As UK Full.", "note": "Legacy GI/G8."},
        ],
    },
    "Belgium": {
        "licences": [
            {"level": "ON3 (Foundation)", "start": 2008, "end": None, "callsigns": "ON3…", "privileges": "Entry.", "note": ""},
            {"level": "ON (Full)", "start": 1924, "end": None, "callsigns": "ON, OO, OP, OQ, OR, OS, OT", "privileges": "Full.", "note": ""},
        ],
    },
    "Austria": {
        "licences": [
            {"level": "Bewerber / entry", "start": 2005, "end": None, "callsigns": "OE… training", "privileges": "Limited.", "note": ""},
            {"level": "Full", "start": 1924, "end": None, "callsigns": "OE", "privileges": "Full.", "note": ""},
        ],
    },
    "Switzerland": {
        "licences": [
            {"level": "HB3 (entry)", "start": 2000, "end": None, "callsigns": "HB3…", "privileges": "Entry.", "note": ""},
            {"level": "Full", "start": 1924, "end": None, "callsigns": "HB, HB0", "privileges": "Full.", "note": ""},
        ],
    },
    "Czech Republic": {
        "licences": [
            {"level": "OK entry", "start": 2004, "end": None, "callsigns": "OL… learner", "privileges": "Limited.", "note": ""},
            {"level": "Full", "start": 1993, "end": None, "callsigns": "OK, OL", "privileges": "Full.", "note": ""},
        ],
    },
    "Brazil": {
        "licences": [
            {"level": "Classe C", "start": 1962, "end": None, "callsigns": "PU, PY, ZV", "privileges": "VHF/UHF focus.", "note": ""},
            {"level": "Classe A / B", "start": 1962, "end": None, "callsigns": "PP–PT", "privileges": "HF privileges by class.", "note": ""},
        ],
    },
}


def apply_licence_patches(entries):
    by_name = {e.get("country"): e for e in entries if e.get("country")}
    if "United Kingdom" not in by_name:
        entries.insert(0, dict(UK_ENTRY))
        by_name["United Kingdom"] = entries[0]
    for name, patch in PATCHES.items():
        if name not in by_name:
            continue
        ent = by_name[name]
        for key, val in patch.items():
            if key == "country":
                continue
            ent[key] = val
    return entries
