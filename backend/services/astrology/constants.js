// ─────────────────────────────────────────────────────────────────────────
// Shared Vedic astrology reference data.
// Extracted verbatim from the original astroEngine.js. These values are
// pure data (no logic) and are consumed by multiple engines, so they live
// in one shared module instead of being duplicated or scattered.
// ─────────────────────────────────────────────────────────────────────────

export const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const PLANETS = [
  "Sun ☀️", "Moon 🌙", "Mars ♂", "Mercury ☿", "Jupiter ♃",
  "Venus ♀", "Saturn ♄", "Rahu 🌑", "Ketu 🌕",
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

// Sign lord (ruling planet) — used for gemstone / mantra / remedy mapping.
export const SIGN_LORD = {
  Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
  Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars",
  Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
};

export const PLANET_REMEDY = {
  Sun: { gemstone: "Ruby", mantra: "Om Suryaya Namah", day: "Sunday", deity: "Surya" },
  Moon: { gemstone: "Pearl", mantra: "Om Chandraya Namah", day: "Monday", deity: "Chandra" },
  Mars: { gemstone: "Red Coral", mantra: "Om Angarakaya Namah", day: "Tuesday", deity: "Hanuman" },
  Mercury: { gemstone: "Emerald", mantra: "Om Budhaya Namah", day: "Wednesday", deity: "Vishnu" },
  Jupiter: { gemstone: "Yellow Sapphire", mantra: "Om Gurave Namah", day: "Thursday", deity: "Brihaspati" },
  Venus: { gemstone: "Diamond / White Sapphire", mantra: "Om Shukraya Namah", day: "Friday", deity: "Lakshmi" },
  Saturn: { gemstone: "Blue Sapphire", mantra: "Om Shanaischaraya Namah", day: "Saturday", deity: "Shani" },
};
