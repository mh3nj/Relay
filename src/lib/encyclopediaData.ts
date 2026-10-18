export const NATO_PHONETIC: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
  F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett",
  K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
  P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
  U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee",
  Z: "Zulu",
};

export interface Prosign {
  name: string;
  code: string;
  meaning: string;
}

export const PROSIGNS: Prosign[] = [
  { name: "AR", code: ".-.-.", meaning: "End of message / over" },
  { name: "BT", code: "-...-", meaning: "New paragraph / break" },
  { name: "SK", code: "...-.-", meaning: "End of contact / out" },
  { name: "AS", code: ".-...", meaning: "Please wait / stand by" },
  { name: "KN", code: "-.--.", meaning: "Invite a specific station to transmit" },
  { name: "SOS", code: "...---...", meaning: "International distress signal" },
];

export interface Abbreviation {
  abbr: string;
  meaning: string;
}

export const ABBREVIATIONS: Abbreviation[] = [
  { abbr: "CQ", meaning: "Calling any station" },
  { abbr: "73", meaning: "Best regards" },
  { abbr: "88", meaning: "Love and kisses" },
  { abbr: "QRS", meaning: "Please send more slowly" },
  { abbr: "QRZ", meaning: "Who is calling me?" },
  { abbr: "QTH", meaning: "My location is…" },
  { abbr: "R", meaning: "Received / roger" },
  { abbr: "K", meaning: "Go ahead / over" },
  { abbr: "TU", meaning: "Thank you" },
  { abbr: "HW", meaning: "How do you copy?" },
];
