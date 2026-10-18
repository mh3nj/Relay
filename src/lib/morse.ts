/**
 * Core Morse code domain logic: the default (ITU) alphabet, and pure
 * encode/decode functions used across Learn, Practice, Translator, and
 * the Encyclopedia. Timing math (dot/dash/word-space durations, WPM,
 * Farnsworth spacing) also lives here so every feature computes it the
 * same way.
 */

export interface MorseSymbol {
  char: string;
  code: string; // dots/dashes, e.g. ".-"
  category: "letter" | "number" | "punctuation" | "prosign";
}

const LETTERS: [string, string][] = [
  ["A", ".-"], ["B", "-..."], ["C", "-.-."], ["D", "-.."], ["E", "."],
  ["F", "..-."], ["G", "--."], ["H", "...."], ["I", ".."], ["J", ".---"],
  ["K", "-.-"], ["L", ".-.."], ["M", "--"], ["N", "-."], ["O", "---"],
  ["P", ".--."], ["Q", "--.-"], ["R", ".-."], ["S", "..."], ["T", "-"],
  ["U", "..-"], ["V", "...-"], ["W", ".--"], ["X", "-..-"], ["Y", "-.--"],
  ["Z", "--.."],
];

const NUMBERS: [string, string][] = [
  ["0", "-----"], ["1", ".----"], ["2", "..---"], ["3", "...--"], ["4", "....-"],
  ["5", "....."], ["6", "-...."], ["7", "--..."], ["8", "---.."], ["9", "----."],
];

const PUNCTUATION: [string, string][] = [
  [".", ".-.-.-"], [",", "--..--"], ["?", "..--.."], ["'", ".----."],
  ["!", "-.-.--"], ["/", "-..-."], ["(", "-.--."], [")", "-.--.-"],
  ["&", ".-..."], [":", "---..."], [";", "-.-.-."], ["=", "-...-"],
  ["+", ".-.-."], ["-", "-....-"], ["_", "..--.-"], ['"', ".-..-."],
  ["$", "...-..-"], ["@", ".--.-."],
];

/**
 * Ä/Æ (".-.-") and Å/À (".--.-") are genuine real-world collisions in the
 * ITU extended Latin Morse table, not a data-entry mistake. International
 * Morse predates several accented Latin letters, so telegraphists relied on
 * language context to disambiguate them. Each character still *encodes* to
 * its correct, standard code (see CHAR_TO_MORSE below); only *decoding* a
 * shared code has to pick one canonical character. We pick the more common
 * of each pair (Ä over Æ, Å over À). See MORSE_TO_CHAR.
 */
const ACCENTED: [string, string][] = [
  ["Ä", ".-.-"], ["Å", ".--.-"], ["À", ".--.-"], ["É", "..-.."],
  ["È", ".-..-"], ["Ñ", "--.--"], ["Ö", "---."], ["Ü", "..--"],
  ["Ç", "-.-.."], ["Æ", ".-.-"],
];

export const DEFAULT_ALPHABET: MorseSymbol[] = [
  ...LETTERS.map(([char, code]) => ({ char, code, category: "letter" as const })),
  ...NUMBERS.map(([char, code]) => ({ char, code, category: "number" as const })),
  ...PUNCTUATION.map(([char, code]) => ({ char, code, category: "punctuation" as const })),
  ...ACCENTED.map(([char, code]) => ({ char, code, category: "letter" as const })),
];

export const CHAR_TO_MORSE: Record<string, string> = Object.fromEntries(
  DEFAULT_ALPHABET.map((s) => [s.char, s.code])
);

/** Codes that map to more than one character in DEFAULT_ALPHABET, and the
 * canonical character each decodes to. Kept explicit (rather than relying on
 * "last entry wins" object-key overwrite order) so the choice is documented,
 * not accidental. */
export const AMBIGUOUS_MORSE_CODES: Record<string, string> = {
  ".-.-": "Ä",
  ".--.-": "Å",
};

export const MORSE_TO_CHAR: Record<string, string> = {
  ...Object.fromEntries(DEFAULT_ALPHABET.map((s) => [s.code, s.char])),
  ...AMBIGUOUS_MORSE_CODES,
};

/** The Koch method learning order. Starts with K and M, adds one new
 * symbol at a time so early lessons stay high-contrast and learnable.
 * Now covers all 62 characters (A-Z, 0-9, accented, punctuation). */
export const KOCH_ORDER: string[] = [
  "K", "M", "U", "R", "E", "S", "N", "A", "P", "T", "L", "W", "I", ".",
  "J", "Z", "=", "F", "O", "Y", ",", "V", "G", "5", "/", "Q", "9", "2",
  "H", "3", "8", "B", "?", "4", "7", "C", "1", "D", "6", "0", "X",
  "$", "&", "+", "@", ")", "-", "\"", "(", "_", "'", ";", "!", ":",
  "Ä", "Å", "À", "É", "È", "Ñ", "Ö", "Ü", "Ç", "Æ",
];

/** Encode plain text into dot/dash Morse, space-separated per letter,
 * "/" between words. Unknown characters are dropped. */
export function textToMorse(
  text: string,
  dict: Record<string, string> = CHAR_TO_MORSE
): string {
  return text
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("")
        .map((ch) => dict[ch])
        .filter(Boolean)
        .join(" ")
    )
    .join(" / ");
}

/** Decode space-separated Morse (with "/" as word separator) back to text. */
export function morseToText(
  morse: string,
  dict: Record<string, string> = MORSE_TO_CHAR
): string {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => dict[code] ?? "")
        .join("")
    )
    .join(" ");
}

// ── Transliteration-based multi-lingual support ──────────────────
//
// International Morse Code was built for the Latin alphabet (A-Z),
// numbers, and punctuation. To support other scripts, we transliterate
// native characters to their closest Latin phonetic equivalent FIRST,
// then encode the Latin text using the standard ITU Morse table.
// This way users learn the GLOBAL Morse standard, not obscure
// regional variants.
//
// For abjads (Persian, Arabic) that elide short vowels, a pure
// letter-by-letter table is inadequate. We use a hybrid approach:
//   1. Word-based lexicon (primary): correct transliteration of
//      common words.
//   2. Letter-based fallback (secondary): reasonable defaults for
//      words not in the lexicon.

// ── Persian (Farsi) Word Lexicon ──────────────────────────────────
export const PERSIAN_LEXICON: Record<string, string> = {
  "سلام": "SALAM", "درود": "DOROOD", "خداحافظ": "KHODAAFES",
  "متشکرم": "MOTESHAKERAM", "مرسی": "MERSI", "بله": "BALEH",
  "خیر": "KHEYR", "لطفاً": "LOTFAN",
  "من": "MAN", "تو": "TO", "او": "U", "ما": "MAA",
  "شما": "SHOMAA", "آنها": "AANHAA", "ایشان": "EESHAN",
  "هستم": "HASTAM", "هست": "HAST", "دارم": "DAARAM",
  "دارد": "DAARAD", "رفتن": "RAFTAN", "آمدن": "AAMADAN",
  "دیدن": "DEEDAN", "شنیدن": "SHENIDAN", "گفتن": "GOFTAN",
  "زدن": "ZADAN",
  "کتاب": "KETAB", "خانه": "KHANEH", "مادر": "MADAR",
  "پدر": "PEDAR", "برادر": "BARAADAR", "خواهر": "KHAAHAR",
  "دوست": "DOOST", "کار": "KAAR", "زندگی": "ZENDEGI",
  "جهان": "JAHAN", "دنیا": "DONYA", "آب": "AB", "نور": "NOOR",
  "ماه": "MAAH", "سال": "SAAL", "روز": "ROOZ", "شب": "SHAB",
  "خوب": "KHUB", "بد": "BAD", "بزرگ": "BOZORG", "کوچک": "KUCHAK",
  "سرد": "SARD", "گرم": "GARM", "سبز": "SABZ", "سفید": "SEFID",
  "سیاه": "SIYAAH", "قرمز": "GHERMEZ", "آبی": "AABI",
  "زرد": "ZARD", "بلند": "BOLAND", "کوتاه": "KOTAAH",
  "چطور": "CHETOR", "چیست": "CHIST", "کجا": "KOJAA",
  "چرا": "CHERAA", "چگونه": "CHENIN", "خوبم": "KHUBAM",
  "خوبی": "KHUBI", "خوبید": "KHUBID",
};

export const PERSIAN_REVERSE_LEXICON: Record<string, string> = Object.fromEntries(
  Object.entries(PERSIAN_LEXICON).map(([n, l]) => [l, n])
);

// ── Arabic Word Lexicon ───────────────────────────────────────────
export const ARABIC_LEXICON: Record<string, string> = {
  "سلام": "SALAAM", "مرحبا": "MARHABA", "مع السلامة": "MAA SALAAMA",
  "شكراً": "SHUKRAN", "نعم": "NAAM", "لا": "LAA",
  "من فضلك": "MIN FADLAK",
  "أنا": "ANA", "أنت": "ANTA", "هو": "HUWA", "هي": "HIYA",
  "نحن": "NAHNU", "أنتم": "ANTUM", "هم": "HUM",
  "كتب": "KATABA", "قرأ": "QARA'A", "شرب": "SHARIBA",
  "أكل": "AKALA", "ذهب": "ZAHABA", "جاء": "JAA'A",
  "قال": "QAALA", "رأى": "RAA'A",
  "كتاب": "KITAB", "مدرسة": "MADRASA", "بيت": "BAYT",
  "شمس": "SHAMS", "قمر": "QAMAR", "رجل": "RAJUL",
  "امرأة": "IMRA'A", "ماء": "MAA", "هواء": "HAWAA",
  "أرض": "ARD", "سماء": "SAMAA", "طريق": "TAREEQ",
  "مدينة": "MADEENA", "قرية": "QARYA", "باب": "BAAB",
  "كبير": "KABEER", "صغير": "SAGHEER", "جديد": "JADEED",
  "قديم": "QADEEM", "طويل": "TAWEEL", "قصير": "QASEER",
  "جميل": "JAMEEL", "قبيح": "QABEEH",
  "كيف": "KAYFA", "ماذا": "MAAZAA", "أين": "AYNA",
  "متى": "MATAA", "لماذا": "LIMAZAA",
};

export const ARABIC_REVERSE_LEXICON: Record<string, string> = Object.fromEntries(
  Object.entries(ARABIC_LEXICON).map(([n, l]) => [l, n])
);

/** Apply a transliteration table (ordered [from, to] pairs) to a
 * string. Longer entries are matched first (greedy), so multi-character
 * tokens like "Sh" take priority over "S" + "h". */
export function applyTransliteration(
  text: string,
  table: readonly (readonly [string, string])[]
): string {
  const sorted = [...table].sort((a, b) => b[0].length - a[0].length);
  let out = "";
  let i = 0;
  while (i < text.length) {
    let matched: string | null = null;
    for (const [from, to] of sorted) {
      if (text.slice(i, i + from.length) === from) {
        matched = to;
        i += from.length;
        break;
      }
    }
    out += matched ?? text[i++];
  }
  return out;
}

/**
 * Hybrid transliteration for abjads (Persian, Arabic): first tries a
 * word-based lexicon for correct vowel-aware transliteration, then
 * falls back to the letter table. Strips common trailing punctuation
 * before lexicon lookup and re-attaches it afterward.
 */
export function transliterateHybrid(
  text: string,
  lang: string,
  table: readonly (readonly [string, string])[]
): string {
  const lexicon = lang === "fa" ? PERSIAN_LEXICON : lang === "ar" ? ARABIC_LEXICON : null;
  if (!lexicon) return applyTransliteration(text, table);

  const punc = /[،؟!.,;?]/g;
  return text
    .split(/\s+/)
    .map((word) => {
      const stripped = word.replace(punc, "");
      const suffixPunc = word.slice(stripped.length);
      const mapped = lexicon[stripped];
      return (mapped ?? applyTransliteration(stripped, table)) + suffixPunc;
    })
    .join(" ");
}

/** Reverse hybrid: decode Latin text back to native script using
 *  the reverse lexicon first, then the letter table as fallback. */
export function reverseTransliterateHybrid(
  latin: string,
  lang: string,
  table: readonly (readonly [string, string])[]
): string {
  const revLexicon = lang === "fa" ? PERSIAN_REVERSE_LEXICON : lang === "ar" ? ARABIC_REVERSE_LEXICON : null;
  if (!revLexicon) return applyTransliteration(latin, table);

  return latin
    .split(/\s+/)
    .map((word) => revLexicon[word] ?? applyTransliteration(word, table))
    .join(" ");
}

export interface TransliterationPreset {
  name: string;
  /** Native chars → Latin letter(s) (longer entries first for greedy matching) */
  toLatin: readonly (readonly [string, string])[];
  /** Latin → native char(s) for reverse transliteration */
  fromLatin: readonly (readonly [string, string])[];
}

export const TRANSLITERATION_PRESETS: Record<string, TransliterationPreset> = {
  default: {
    name: "Default (ITU)",
    toLatin: [],
    fromLatin: [],
  },

  // Persian (Farsi): UniPers transliteration (fixed fallback)
  fa: {
    name: "Persian (فارسی)",
    toLatin: [
      ["آ", "AA"], ["چ", "CH"], ["ش", "SH"], ["ژ", "ZH"], ["خ", "KH"],
      ["غ", "GH"], ["ع", "A"], ["ئ", "Y"], ["أ", "A"], ["إ", "A"],
      ["ا", "A"], ["ب", "B"], ["پ", "P"], ["ت", "T"], ["ث", "S"],
      ["ج", "J"], ["ح", "H"], ["د", "D"], ["ذ", "Z"], ["ر", "R"],
      ["ز", "Z"], ["س", "S"], ["ص", "S"], ["ض", "Z"], ["ط", "T"],
      ["ظ", "Z"], ["ف", "F"], ["ق", "GH"], ["ک", "K"], ["گ", "G"],
      ["ل", "L"], ["م", "M"], ["ن", "N"],
      ["و", "U"],
      ["ه", "H"], ["ی", "Y"],
      ["۰", "0"], ["۱", "1"], ["۲", "2"], ["۳", "3"],
      ["۴", "4"], ["۵", "5"], ["۶", "6"], ["۷", "7"],
      ["۸", "8"], ["۹", "9"],
      ["،", ","], ["؟", "?"], ["؛", ";"], [".", "."],
      ["!", "!"],
    ],
    fromLatin: [
      ["AA", "آ"], ["SH", "ش"], ["KH", "خ"], ["ZH", "ژ"], ["GH", "غ"],
      ["CH", "چ"], ["A", "ا"], ["B", "ب"], ["P", "پ"],
      ["T", "ت"], ["J", "ج"], ["H", "ح"], ["D", "د"],
      ["R", "ر"], ["S", "س"], ["Z", "ز"], ["F", "ف"],
      ["K", "ک"], ["G", "گ"], ["L", "ل"], ["M", "م"],
      ["N", "ن"], ["U", "و"], ["V", "و"],
      ["Y", "ی"], ["I", "ی"],
      ["0", "۰"], ["1", "۱"], ["2", "۲"], ["3", "۳"],
      ["4", "۴"], ["5", "۵"], ["6", "۶"], ["7", "۷"],
      ["8", "۸"], ["9", "۹"],
      [",", "،"], ["?", "؟"], [";", "؛"], [".", "."],
      ["!", "!"],
    ],
  },

  // Arabic: ISO 233 transliteration (fixed fallback)
  ar: {
    name: "Arabic (العربية)",
    toLatin: [
      ["آ", "AA"], ["ش", "SH"], ["خ", "KH"], ["ث", "TH"], ["ذ", "DH"],
      ["غ", "GH"], ["ع", "A"], ["أ", "A"], ["إ", "A"], ["ة", "H"],
      ["ا", "A"], ["ب", "B"], ["ت", "T"], ["ج", "J"],
      ["ح", "H"], ["د", "D"], ["ر", "R"], ["ز", "Z"],
      ["س", "S"], ["ص", "S"], ["ض", "D"], ["ط", "T"],
      ["ظ", "Z"], ["ف", "F"], ["ق", "Q"], ["ك", "K"],
      ["ل", "L"], ["م", "M"], ["ن", "N"],
      ["و", "U"],
      ["ه", "H"], ["ي", "Y"],
      ["٠", "0"], ["١", "1"], ["٢", "2"], ["٣", "3"],
      ["٤", "4"], ["٥", "5"], ["٦", "6"], ["٧", "7"],
      ["٨", "8"], ["٩", "9"],
      ["،", ","], ["؟", "?"], ["؛", ";"], [".", "."],
      ["!", "!"],
    ],
    fromLatin: [
      ["AA", "آ"], ["SH", "ش"], ["KH", "خ"], ["TH", "ث"], ["DH", "ذ"],
      ["GH", "غ"], ["A", "ا"], ["B", "ب"], ["T", "ت"],
      ["J", "ج"], ["H", "ح"], ["D", "د"], ["R", "ر"],
      ["S", "س"], ["Q", "ق"], ["K", "ك"], ["L", "ل"],
      ["M", "م"], ["N", "ن"], ["U", "و"], ["W", "و"],
      ["Y", "ي"], ["I", "ي"],
      ["0", "٠"], ["1", "١"], ["2", "٢"], ["3", "٣"],
      ["4", "٤"], ["5", "٥"], ["6", "٦"], ["7", "٧"],
      ["8", "٨"], ["9", "٩"],
      [",", "،"], ["?", "؟"], [";", "؛"], [".", "."],
      ["!", "!"],
    ],
  },

  // Turkish (Latin script; special chars map to closest Latin)
  tr: {
    name: "Turkish (Türkçe)",
    toLatin: [
      ["Ç", "C"], ["Ğ", "G"], ["İ", "I"], ["Ö", "O"],
      ["Ş", "S"], ["Ü", "U"],
      ["ç", "C"], ["ğ", "G"], ["ı", "I"], ["ö", "O"],
      ["ş", "S"], ["ü", "U"],
    ],
    fromLatin: [
      ["C", "Ç"], ["G", "Ğ"], ["I", "İ"], ["O", "Ö"],
      ["S", "Ş"], ["U", "Ü"],
    ],
  },

  // French: accented chars → base Latin
  fr: {
    name: "French (Français)",
    toLatin: [
      ["À", "A"], ["Â", "A"], ["Æ", "AE"], ["Ç", "C"],
      ["É", "E"], ["È", "E"], ["Ê", "E"], ["Ë", "E"],
      ["Î", "I"], ["Ï", "I"], ["Ô", "O"], ["Œ", "OE"],
      ["Ù", "U"], ["Û", "U"], ["Ü", "U"], ["Ÿ", "Y"],
      ["à", "A"], ["â", "A"], ["æ", "AE"], ["ç", "C"],
      ["é", "E"], ["è", "E"], ["ê", "E"], ["ë", "E"],
      ["î", "I"], ["ï", "I"], ["ô", "O"], ["œ", "OE"],
      ["ù", "U"], ["û", "U"], ["ü", "U"], ["ÿ", "Y"],
    ],
    fromLatin: [
      ["AE", "Æ"], ["OE", "Œ"], ["A", "À"], ["C", "Ç"],
      ["E", "É"], ["I", "Î"], ["O", "Ô"], ["U", "Û"],
      ["Y", "Ÿ"],
    ],
  },

  // German: Umlauts → AE/OE/UE or official Morse equivalents
  de: {
    name: "German (Deutsch)",
    toLatin: [
      ["Ä", "AE"], ["Ö", "OE"], ["Ü", "UE"], ["ß", "SS"],
      ["ä", "AE"], ["ö", "OE"], ["ü", "UE"],
    ],
    fromLatin: [
      ["AE", "Ä"], ["OE", "Ö"], ["UE", "Ü"], ["SS", "ß"],
    ],
  },

  // Spanish: accented chars → base Latin
  es: {
    name: "Spanish (Español)",
    toLatin: [
      ["Á", "A"], ["É", "E"], ["Í", "I"], ["Ñ", "N"],
      ["Ó", "O"], ["Ú", "U"], ["Ü", "U"],
      ["á", "A"], ["é", "E"], ["í", "I"], ["ñ", "N"],
      ["ó", "O"], ["ú", "U"], ["ü", "U"],
      ["¿", "?"], ["¡", "!"],
    ],
    fromLatin: [
      ["A", "Á"], ["E", "É"], ["I", "Í"], ["N", "Ñ"],
      ["O", "Ó"], ["U", "Ú"],
    ],
  },

  // Russian (Cyrillic): BGN/PCGN transliteration
  ru: {
    name: "Russian (Русский)",
    toLatin: [
      ["Щ", "SHCH"], ["Ш", "SH"], ["Ч", "CH"], ["Ц", "TS"],
      ["Ю", "YU"], ["Я", "YA"], ["Ж", "ZH"], ["Х", "KH"],
      ["Ё", "E"], ["Й", "Y"], ["Ъ", ""],  ["Ь", ""],
      ["Э", "E"], ["А", "A"], ["Б", "B"], ["В", "V"],
      ["Г", "G"], ["Д", "D"], ["Е", "E"], ["З", "Z"],
      ["И", "I"], ["К", "K"], ["Л", "L"], ["М", "M"],
      ["Н", "N"], ["О", "O"], ["П", "P"], ["Р", "R"],
      ["С", "S"], ["Т", "T"], ["У", "U"], ["Ф", "F"],
      ["Ы", "Y"],
      ["щ", "SHCH"], ["ш", "SH"], ["ч", "CH"], ["ц", "TS"],
      ["ю", "YU"], ["я", "YA"], ["ж", "ZH"], ["х", "KH"],
      ["ё", "E"], ["й", "Y"], ["ъ", ""],  ["ь", ""],
      ["э", "E"], ["а", "A"], ["б", "B"], ["в", "V"],
      ["г", "G"], ["д", "D"], ["е", "E"], ["з", "Z"],
      ["и", "I"], ["к", "K"], ["л", "L"], ["м", "M"],
      ["н", "N"], ["о", "O"], ["п", "P"], ["р", "R"],
      ["с", "S"], ["т", "T"], ["у", "U"], ["ф", "F"],
      ["ы", "Y"],
    ],
    fromLatin: [
      ["SHCH", "Щ"], ["SH", "Ш"], ["CH", "Ч"], ["TS", "Ц"],
      ["YU", "Ю"], ["YA", "Я"], ["ZH", "Ж"], ["KH", "Х"],
      ["A", "А"], ["B", "Б"], ["V", "В"], ["G", "Г"],
      ["D", "Д"], ["E", "Е"], ["Z", "З"], ["I", "И"],
      ["Y", "Й"], ["K", "К"], ["L", "Л"], ["M", "М"],
      ["N", "Н"], ["O", "О"], ["P", "П"], ["R", "Р"],
      ["S", "С"], ["T", "Т"], ["U", "У"], ["F", "Ф"],
    ],
  },

  // Korean (Hangul): Revised Romanization
  ko: {
    name: "Korean (한국어)",
    toLatin: [
      ["ㄱ", "G"], ["ㄴ", "N"], ["ㄷ", "D"], ["ㄹ", "R"],
      ["ㅁ", "M"], ["ㅂ", "B"], ["ㅅ", "S"], ["ㅇ", "NG"],
      ["ㅈ", "J"], ["ㅊ", "CH"], ["ㅋ", "K"], ["ㅌ", "T"],
      ["ㅍ", "P"], ["ㅎ", "H"],
      ["ㅏ", "A"], ["ㅑ", "YA"], ["ㅓ", "EO"], ["ㅕ", "YEO"],
      ["ㅗ", "O"], ["ㅛ", "YO"], ["ㅜ", "U"], ["ㅠ", "YU"],
      ["ㅡ", "EU"], ["ㅣ", "I"],
      ["가", "GA"], ["나", "NA"], ["다", "DA"], ["라", "RA"],
      ["마", "MA"], ["바", "BA"], ["사", "SA"], ["아", "A"],
      ["자", "JA"], ["차", "CHA"], ["카", "KA"], ["타", "TA"],
      ["파", "PA"], ["하", "HA"],
      ["안", "AN"], ["녕", "NYEONG"], ["요", "YO"],
      ["한", "HAN"], ["국", "GUK"], ["어", "EO"],
      ["세", "SE"], ["계", "GYE"],
    ],
    fromLatin: [
      ["GA", "가"], ["NA", "나"], ["DA", "다"], ["RA", "라"],
      ["MA", "마"], ["BA", "바"], ["SA", "사"],
      ["JA", "자"], ["CHA", "차"], ["KA", "카"], ["TA", "타"],
      ["PA", "파"], ["HA", "하"],
      ["G", "ㄱ"], ["N", "ㄴ"], ["D", "ㄷ"], ["R", "ㄹ"],
      ["M", "ㅁ"], ["B", "ㅂ"], ["S", "ㅅ"], ["J", "ㅈ"],
      ["CH", "ㅊ"], ["K", "ㅋ"], ["T", "ㅌ"], ["P", "ㅍ"],
      ["H", "ㅎ"],
      ["A", "ㅏ"], ["YA", "ㅑ"], ["EO", "ㅓ"], ["YEO", "ㅕ"],
      ["O", "ㅗ"], ["YO", "ㅛ"], ["U", "ㅜ"], ["YU", "ㅠ"],
      ["EU", "ㅡ"], ["I", "ㅣ"],
      ["NG", "ㅇ"],
    ],
  },

  // Japanese (Kana): Hepburn Romaji
  ja: {
    name: "Japanese (日本語)",
    toLatin: [
      ["シ", "SHI"], ["ジ", "JI"], ["チ", "CHI"], ["ツ", "TSU"],
      ["シャ", "SHA"], ["シュ", "SHU"], ["ショ", "SHO"],
      ["チャ", "CHA"], ["チュ", "CHU"], ["チョ", "CHO"],
      ["ジャ", "JA"], ["ジュ", "JU"], ["ジョ", "JO"],
      ["あ", "A"], ["い", "I"], ["う", "U"], ["え", "E"],
      ["お", "O"],
      ["か", "KA"], ["き", "KI"], ["く", "KU"], ["け", "KE"],
      ["こ", "KO"],
      ["さ", "SA"], ["す", "SU"], ["せ", "SE"], ["そ", "SO"],
      ["た", "TA"], ["て", "TE"], ["と", "TO"],
      ["な", "NA"], ["に", "NI"], ["ぬ", "NU"], ["ね", "NE"],
      ["の", "NO"],
      ["は", "HA"], ["ひ", "HI"], ["ふ", "FU"], ["へ", "HE"],
      ["ほ", "HO"],
      ["ま", "MA"], ["み", "MI"], ["む", "MU"], ["め", "ME"],
      ["も", "MO"],
      ["や", "YA"], ["ゆ", "YU"], ["よ", "YO"],
      ["ら", "RA"], ["り", "RI"], ["る", "RU"], ["れ", "RE"],
      ["ろ", "RO"],
      ["わ", "WA"], ["を", "WO"], ["ん", "N"],
      ["が", "GA"], ["ぎ", "GI"], ["ぐ", "GU"], ["げ", "GE"],
      ["ご", "GO"],
      ["ざ", "ZA"], ["ず", "ZU"], ["ぜ", "ZE"], ["ぞ", "ZO"],
      ["だ", "DA"], ["で", "DE"], ["ど", "DO"],
      ["ば", "BA"], ["び", "BI"], ["ぶ", "BU"], ["べ", "BE"],
      ["ぼ", "BO"],
      ["ぱ", "PA"], ["ぴ", "PI"], ["ぷ", "PU"], ["ぺ", "PE"],
      ["ぽ", "PO"],
      ["ア", "A"], ["イ", "I"], ["ウ", "U"], ["エ", "E"],
      ["オ", "O"],
      ["カ", "KA"], ["キ", "KI"], ["ク", "KU"], ["ケ", "KE"],
      ["コ", "KO"],
      ["サ", "SA"], ["ス", "SU"], ["セ", "SE"], ["ソ", "SO"],
      ["タ", "TA"], ["テ", "TE"], ["ト", "TO"],
      ["ナ", "NA"], ["ニ", "NI"], ["ヌ", "NU"], ["ネ", "NE"],
      ["ノ", "NO"],
      ["ハ", "HA"], ["ヒ", "HI"], ["フ", "FU"], ["ヘ", "HE"],
      ["ホ", "HO"],
      ["マ", "MA"], ["ミ", "MI"], ["ム", "MU"], ["メ", "ME"],
      ["モ", "MO"],
      ["ヤ", "YA"], ["ユ", "YU"], ["ヨ", "YO"],
      ["ラ", "RA"], ["リ", "RI"], ["ル", "RU"], ["レ", "RE"],
      ["ロ", "RO"],
      ["ワ", "WA"], ["ヲ", "WO"], ["ン", "N"],
    ],
    fromLatin: [
      ["SHI", "シ"], ["JI", "ジ"], ["CHI", "チ"], ["TSU", "ツ"],
      ["SHA", "シャ"], ["SHU", "シュ"], ["SHO", "ショ"],
      ["CHA", "チャ"], ["CHU", "チュ"], ["CHO", "チョ"],
      ["JA", "ジャ"], ["JU", "ジュ"], ["JO", "ジョ"],
      ["A", "ア"], ["I", "イ"], ["U", "ウ"], ["E", "エ"],
      ["O", "オ"],
      ["KA", "カ"], ["KI", "キ"], ["KU", "ク"], ["KE", "ケ"],
      ["KO", "コ"],
      ["SA", "サ"], ["SU", "ス"], ["SE", "セ"], ["SO", "ソ"],
      ["TA", "タ"], ["TE", "テ"], ["TO", "ト"],
      ["NA", "ナ"], ["NI", "ニ"], ["NU", "ヌ"], ["NE", "ネ"],
      ["NO", "ノ"],
      ["HA", "ハ"], ["HI", "ヒ"], ["FU", "フ"], ["HE", "ヘ"],
      ["HO", "ホ"],
      ["MA", "マ"], ["MI", "ミ"], ["MU", "ム"], ["ME", "メ"],
      ["MO", "モ"],
      ["YA", "ヤ"], ["YU", "ユ"], ["YO", "ヨ"],
      ["RA", "ラ"], ["RI", "リ"], ["RU", "ル"], ["RE", "レ"],
      ["RO", "ロ"],
      ["WA", "ワ"], ["WO", "ヲ"], ["N", "ン"],
      ["GA", "ガ"], ["GI", "ギ"], ["GU", "グ"], ["GE", "ゲ"],
      ["GO", "ゴ"],
      ["ZA", "ザ"], ["ZU", "ズ"], ["ZE", "ゼ"], ["ZO", "ゾ"],
      ["DA", "ダ"], ["DE", "デ"], ["DO", "ド"],
      ["BA", "バ"], ["BI", "ビ"], ["BU", "ブ"], ["BE", "ベ"],
      ["BO", "ボ"],
      ["PA", "パ"], ["PI", "ピ"], ["PU", "プ"], ["PE", "ペ"],
      ["PO", "ポ"],
    ],
  },

  // Greek: ISO 843 transliteration
  el: {
    name: "Greek (Ελληνικά)",
    toLatin: [
      ["Θ", "TH"], ["θ", "TH"],
      ["Χ", "CH"], ["χ", "CH"],
      ["Ψ", "PS"], ["ψ", "PS"],
      ["Α", "A"], ["α", "A"],
      ["Β", "V"], ["β", "V"],
      ["Γ", "G"], ["γ", "G"],
      ["Δ", "D"], ["δ", "D"],
      ["Ε", "E"], ["ε", "E"],
      ["Ζ", "Z"], ["ζ", "Z"],
      ["Η", "I"], ["η", "I"],
      ["Ι", "I"], ["ι", "I"],
      ["Κ", "K"], ["κ", "K"],
      ["Λ", "L"], ["λ", "L"],
      ["Μ", "M"], ["μ", "M"],
      ["Ν", "N"], ["ν", "N"],
      ["Ξ", "X"], ["ξ", "X"],
      ["Ο", "O"], ["ο", "O"],
      ["Π", "P"], ["π", "P"],
      ["Ρ", "R"], ["ρ", "R"],
      ["Σ", "S"], ["σ", "S"], ["ς", "S"],
      ["Τ", "T"], ["τ", "T"],
      ["Υ", "Y"], ["υ", "Y"],
      ["Φ", "F"], ["φ", "F"],
      ["Ω", "O"], ["ω", "O"],
    ],
    fromLatin: [
      ["TH", "Θ"], ["CH", "Χ"], ["PS", "Ψ"],
      ["A", "Α"], ["V", "Β"], ["G", "Γ"],
      ["D", "Δ"], ["E", "Ε"], ["Z", "Ζ"],
      ["I", "Ι"], ["K", "Κ"], ["L", "Λ"],
      ["M", "Μ"], ["N", "Ν"], ["X", "Ξ"],
      ["O", "Ο"], ["P", "Π"], ["R", "Ρ"],
      ["S", "Σ"], ["T", "Τ"], ["Y", "Υ"],
      ["F", "Φ"],
    ],
  },

  // Hebrew: Academic transliteration
  he: {
    name: "Hebrew (עברית)",
    toLatin: [
      ["ש", "SH"], ["צ", "TS"], ["ת", "T"],
      ["א", "A"], ["ב", "B"], ["ג", "G"],
      ["ד", "D"], ["ה", "H"], ["ו", "V"],
      ["ז", "Z"], ["ח", "H"], ["ט", "T"],
      ["י", "Y"], ["כ", "K"], ["ל", "L"],
      ["מ", "M"], ["נ", "N"], ["ס", "S"],
      ["ע", "A"], ["פ", "P"], ["ק", "K"],
      ["ר", "R"],
      ["ך", "K"], ["ם", "M"], ["ן", "N"],
      ["ף", "P"], ["ץ", "TS"],
    ],
    fromLatin: [
      ["SH", "ש"], ["TS", "צ"],
      ["A", "א"], ["B", "ב"], ["G", "ג"],
      ["D", "ד"], ["H", "ה"], ["V", "ו"],
      ["Z", "ז"], ["T", "ט"], ["Y", "י"],
      ["K", "כ"], ["L", "ל"], ["M", "מ"],
      ["N", "נ"], ["S", "ס"], ["P", "פ"],
      ["R", "ר"],
    ],
  },

  // Chinese (Mandarin): Pinyin without tone marks
  zh: {
    name: "Chinese (中文)",
    toLatin: [
      ["zh", "ZH"], ["ch", "CH"], ["sh", "SH"],
      ["ai", "AI"], ["ei", "EI"], ["ui", "UI"],
      ["ao", "AO"], ["ou", "OU"], ["iu", "IU"],
      ["ie", "IE"], ["üe", "UE"], ["er", "ER"],
      ["an", "AN"], ["en", "EN"], ["in", "IN"],
      ["un", "UN"], ["vn", "VN"],
      ["ang", "ANG"], ["eng", "ENG"], ["ing", "ING"],
      ["ong", "ONG"],
      ["a", "A"], ["b", "B"], ["c", "C"], ["d", "D"],
      ["e", "E"], ["f", "F"], ["g", "G"], ["h", "H"],
      ["i", "I"], ["j", "J"], ["k", "K"], ["l", "L"],
      ["m", "M"], ["n", "N"], ["o", "O"], ["p", "P"],
      ["q", "Q"], ["r", "R"], ["s", "S"], ["t", "T"],
      ["u", "U"], ["v", "V"], ["w", "W"], ["x", "X"],
      ["y", "Y"], ["z", "Z"],
    ],
    fromLatin: [],
  },
};

/** Validate a raw dot/dash string contains only valid Morse characters. */
export function isValidMorseToken(token: string): boolean {
  return /^[.-]+$/.test(token);
}

export interface MorseTiming {
  ditMs: number;
  dahMs: number;
  intraCharGapMs: number;
  interCharGapMs: number;
  wordGapMs: number;
}

/**
 * Standard timing derivation from WPM using the PARIS standard (50 dit
 * units per word), with optional Farnsworth spacing that slows only the
 * inter-character/word gaps while keeping character speed at wpm.
 */
export function timingForWpm(wpm: number, farnsworthWpm?: number): MorseTiming {
  const effectiveWpm = farnsworthWpm && farnsworthWpm < wpm ? farnsworthWpm : wpm;

  // Farnsworth: character timing stays at `wpm`, spacing is stretched to
  // match the slower `effectiveWpm`.
  const standardDitMs = 1200 / wpm;
  const farnsworthDitMs = 1200 / effectiveWpm;
  // Solve for the extra gap needed so that the average word duration
  // matches effectiveWpm while dit/dah/intra-char gaps stay at `wpm`.
  const totalStdUnitsPerWord = 50;
  const charUnitsPerWord = 31; // approx dits+dahs+intra-char gaps for PARIS at std speed
  const spacingUnitsPerWord = totalStdUnitsPerWord - charUnitsPerWord;
  const stdCharTime = charUnitsPerWord * standardDitMs;
  const targetWordTime = totalStdUnitsPerWord * farnsworthDitMs;
  const spacingTime = Math.max(targetWordTime - stdCharTime, spacingUnitsPerWord * standardDitMs);
  const spacingUnitMs = spacingTime / spacingUnitsPerWord;

  return {
    ditMs: standardDitMs,
    dahMs: standardDitMs * 3,
    intraCharGapMs: standardDitMs,
    interCharGapMs: spacingUnitMs * 3,
    wordGapMs: spacingUnitMs * 7,
  };
}
