import { describe, it, expect } from "vitest";
import {
  FESTIVAL_KEYS, listFestivalDefinitions, getFestivalDefinition,
  computeFestivalsForYear, computeFestivalForYear,
} from "../../services/astrology/festivalEngine.js";

const EXPECTED_KEYS = [
  "ekadashi", "purnima", "amavasya", "sankranti", "pradosh", "chaturthi",
  "navratri", "maha_shivratri", "ram_navami", "janmashtami", "hanuman_jayanti",
  "holi", "diwali", "raksha_bandhan", "guru_purnima", "karva_chauth",
  "basant_panchami", "dev_uthani_ekadashi", "sharad_purnima",
];

describe("FESTIVAL_KEYS", () => {
  it("exposes all 19 festivals named in the V4.5 Phase 1A spec", () => {
    expect(FESTIVAL_KEYS.sort()).toEqual([...EXPECTED_KEYS].sort());
  });
});

describe("listFestivalDefinitions", () => {
  it("returns static metadata (no dates) for every festival", () => {
    const list = listFestivalDefinitions();
    expect(list.length).toBe(19);
    for (const f of list) {
      expect(f.key).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.type).toBeTruthy();
      expect(f.importance).toBeTruthy();
      expect(f.date).toBeUndefined();
    }
  });
});

describe("getFestivalDefinition", () => {
  it("returns null for an unknown key", () => {
    expect(getFestivalDefinition("not-a-real-festival")).toBeNull();
  });

  it("returns the full definition for a known key", () => {
    const def = getFestivalDefinition("diwali");
    expect(def.name).toBe("Diwali");
    expect(def.recurrence).toBe("tithi-in-window");
  });
});

describe("computeFestivalsForYear", () => {
  const YEAR = 2026;
  const festivals = computeFestivalsForYear(YEAR);

  it("returns at least one occurrence for every supported festival", () => {
    const keysSeen = new Set(festivals.map((f) => f.key));
    for (const key of EXPECTED_KEYS) {
      expect(keysSeen.has(key)).toBe(true);
    }
  });

  it("returns dates sorted in ascending order", () => {
    for (let i = 1; i < festivals.length; i++) {
      expect(festivals[i].date >= festivals[i - 1].date).toBe(true);
    }
  });

  it("every occurrence's date falls within the requested year", () => {
    for (const f of festivals) {
      expect(f.date.startsWith(String(YEAR))).toBe(true);
    }
  });

  it("Ekadashi occurs roughly twice a month (22-26 times a year)", () => {
    const count = festivals.filter((f) => f.key === "ekadashi").length;
    expect(count).toBeGreaterThanOrEqual(22);
    expect(count).toBeLessThanOrEqual(26);
  });

  it("Purnima and Amavasya each occur roughly once a month (11-13 times a year)", () => {
    for (const key of ["purnima", "amavasya"]) {
      const count = festivals.filter((f) => f.key === key).length;
      expect(count).toBeGreaterThanOrEqual(11);
      expect(count).toBeLessThanOrEqual(13);
    }
  });

  it("Diwali occurs exactly once and falls on an Amavasya", () => {
    const diwali = festivals.filter((f) => f.key === "diwali");
    expect(diwali.length).toBe(1);
    expect(diwali[0].date >= `${YEAR}-10-10`).toBe(true);
    expect(diwali[0].date <= `${YEAR}-11-20`).toBe(true);
  });

  it("Navratri spans 9 days from its start date", () => {
    const [navratri] = festivals.filter((f) => f.key === "navratri");
    expect(navratri.durationDays).toBe(9);
    const start = new Date(`${navratri.date}T00:00:00Z`);
    const end = new Date(`${navratri.endDate}T00:00:00Z`);
    expect(Math.round((end - start) / 86400000)).toBe(8);
  });

  it("Makar Sankranti falls on a fixed solar date (Jan 14) every year", () => {
    const [sankranti] = festivals.filter((f) => f.key === "sankranti");
    expect(sankranti.date).toBe(`${YEAR}-01-14`);
  });

  it("every occurrence exposes the full Festival Data contract", () => {
    for (const f of festivals) {
      expect(f.name).toBeTruthy();
      expect(f.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.type).toBeTruthy();
      expect(f.importance).toBeTruthy();
      expect(f.description).toBeTruthy();
      expect(f.historicalBackground).toBeTruthy();
      expect(f.religiousSignificance).toBeTruthy();
      expect(Array.isArray(f.recommendedActivities)).toBe(true);
      expect(Array.isArray(f.rituals)).toBe(true);
      expect(f.fastingInfo).toBeTruthy();
      expect(Array.isArray(f.region)).toBe(true);
    }
  });

  it("is deterministic — same year always produces the same result", () => {
    const a = computeFestivalsForYear(2027);
    const b = computeFestivalsForYear(2027);
    expect(a).toEqual(b);
  });
});

describe("computeFestivalForYear", () => {
  it("returns an empty array for an unknown key", () => {
    expect(computeFestivalForYear("not-a-real-festival", 2026)).toEqual([]);
  });

  it("returns only that festival's occurrences", () => {
    const occurrences = computeFestivalForYear("holi", 2026);
    expect(occurrences.every((o) => o.key === "holi")).toBe(true);
    expect(occurrences.length).toBe(1);
  });
});
