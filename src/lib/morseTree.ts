import { CHAR_TO_MORSE, AMBIGUOUS_MORSE_CODES } from "@/lib/morse";

/**
 * One real fix, not just original code: getMorseTree() used to build
 * each leaf's `char` purely by "last entry in CHAR_TO_MORSE at this
 * path wins", the same last-write-wins pattern MORSE_TO_CHAR itself
 * used to have before it was fixed to use AMBIGUOUS_MORSE_CODES. That
 * left this tree disagreeing with MORSE_TO_CHAR about which of Ä/Æ or
 * Å/À a shared code represents (walking here for ".-.-" landed on
 * "Æ" while decoding ".-.-" elsewhere in the app returned "Ä").
 * getMorseTree() now applies the same documented canonical choice so
 * both decode paths agree.
 */

export interface MorseNode {
  path: string;
  char: string | null;
  dot: MorseNode | null;
  dash: MorseNode | null;
  depth: number;
}

let cachedTree: MorseNode | null = null;

export function getMorseTree(): MorseNode {
  if (cachedTree) return cachedTree;
  const root: MorseNode = { path: "", char: null, dot: null, dash: null, depth: 0 };
  for (const [char, code] of Object.entries(CHAR_TO_MORSE)) {
    let node = root;
    for (const sym of code) {
      if (sym === ".") {
        if (!node.dot) node.dot = { path: node.path + ".", char: null, dot: null, dash: null, depth: node.depth + 1 };
        node = node.dot;
      } else {
        if (!node.dash) node.dash = { path: node.path + "-", char: null, dot: null, dash: null, depth: node.depth + 1 };
        node = node.dash;
      }
    }
    node.char = char;
  }
  for (const [code, canonicalChar] of Object.entries(AMBIGUOUS_MORSE_CODES)) {
    const node = walkTree(root, code);
    if (node) node.char = canonicalChar;
  }
  cachedTree = root;
  return root;
}

export function isPrefix(path: string): boolean {
  return Object.values(CHAR_TO_MORSE).some((code) => code !== path && code.startsWith(path));
}

export function walkTree(root: MorseNode, path: string): MorseNode | null {
  let node = root;
  for (const sym of path) {
    if (sym === ".") { if (!node.dot) return null; node = node.dot; }
    else { if (!node.dash) return null; node = node.dash; }
  }
  return node;
}

export interface BounceResult {
  node: MorseNode | null;
  char: string | null;
  isBounce: boolean;
}

export function navigateFrom(root: MorseNode, path: string, input: "." | "-"): BounceResult {
  const nextPath = path + input;
  const node = walkTree(root, nextPath);
  if (node) {
    return { node, char: node.char, isBounce: false };
  }
  if (isPrefix(nextPath)) {
    return { node: null, char: null, isBounce: false };
  }
  return { node: root, char: null, isBounce: true };
}

export function collectNodes(root: MorseNode): MorseNode[] {
  const result: MorseNode[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);
    if (node.dash) stack.push(node.dash);
    if (node.dot) stack.push(node.dot);
  }
  return result;
}
