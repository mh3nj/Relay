import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { getMorseTree, walkTree, isPrefix, type MorseNode } from "@/lib/morseTree";
import { CHAR_TO_MORSE } from "@/lib/morse";
import { playCorrectSfx, playWrongSfx } from "@/lib/gameSfx";
import { cn } from "@/lib/utils";

const TOP_OFFSET = 36;
const BOTTOM_PAD = 32;

interface LayoutNode {
  node: MorseNode;
  x: number;
  y: number;
}

interface PracticeStats {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}

function treeMaxDepth(node: MorseNode, limit: number): number {
  if (node.depth >= limit) return node.depth;
  let d = node.depth;
  if (node.dot) d = Math.max(d, treeMaxDepth(node.dot, limit));
  if (node.dash) d = Math.max(d, treeMaxDepth(node.dash, limit));
  return d;
}

function layoutOnCanvas(root: MorseNode, w: number, containerH: number): LayoutNode[] {
  const maxD = Math.min(treeMaxDepth(root, 6), 6);
  const availableH = containerH - TOP_OFFSET - BOTTOM_PAD;
  const vSpacing = Math.min(60, Math.max(22, Math.floor(availableH / Math.max(maxD, 1))));
  const rows: MorseNode[][] = [];
  const stack = [root];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (n.depth > maxD) continue;
    if (!rows[n.depth]) rows[n.depth] = [];
    rows[n.depth].push(n);
    if (n.dot) stack.push(n.dot);
    if (n.dash) stack.push(n.dash);
  }
  const result: LayoutNode[] = [];
  const visited = new Set<MorseNode>();
  const q = [root];
  visited.add(root);
  while (q.length > 0) {
    const n = q.shift()!;
    if (n.depth > maxD) continue;
    const row = rows[n.depth];
    const count = row?.length ?? 1;
    const spread = Math.min(w * 0.88, (count - 1) * 55);
    const left = (w - spread) / 2;
    const idx = row?.indexOf(n) ?? 0;
    const x = count > 1 ? left + (idx / (count - 1)) * spread : w / 2;
    const y = TOP_OFFSET + n.depth * vSpacing;
    result.push({ node: n, x, y });
    if (n.dot && !visited.has(n.dot)) { visited.add(n.dot); q.push(n.dot); }
    if (n.dash && !visited.has(n.dash)) { visited.add(n.dash); q.push(n.dash); }
  }
  return result;
}

function calcHeight(laid: LayoutNode[]): number {
  let maxY = 0;
  for (const ln of laid) {
    if (ln.y > maxY) maxY = ln.y;
  }
  return maxY + BOTTOM_PAD;
}

function pathDisplay(path: string): string {
  if (!path) return "⏺";
  return path.split("").map((s) => (s === "." ? "•" : "-")).join(" ");
}

export function MorseTreeExplorer() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [path, setPath] = useState("");
  const [bounce, setBounce] = useState(false);
  const [stats, setStats] = useState<PracticeStats>({ correct: 0, incorrect: 0, streak: 0, bestStreak: 0 });
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const treeRef = useRef(getMorseTree());

  const currentNode = path ? walkTree(treeRef.current, path) : treeRef.current;
  const currentChar = currentNode?.char ?? null;

  const navigate = useCallback(
    (input: "." | "-") => {
      if (!active) return;
      const nextPath = path + input;
      const node = walkTree(treeRef.current, nextPath);
      if (node) {
        setPath(nextPath);
        setBounce(false);
        if (node.char) {
          playCorrectSfx();
          setStats((prev) => ({
            correct: prev.correct + 1,
            incorrect: prev.incorrect,
            streak: prev.streak + 1,
            bestStreak: Math.max(prev.bestStreak, prev.streak + 1),
          }));
        }
        return;
      }
      if (isPrefix(nextPath)) {
        setPath(nextPath);
        setBounce(false);
        return;
      }
      setBounce(true);
      playWrongSfx();
      setStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1, streak: 0 }));
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
      bounceTimer.current = setTimeout(() => {
        setBounce(false);
        setPath("");
      }, 600);
    },
    [path, active]
  );

  useEffect(() => {
    return () => {
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
    };
  }, []);

  const start = () => { setActive(true); setPath(""); setBounce(false); setStats({ correct: 0, incorrect: 0, streak: 0, bestStreak: 0 }); };
  const stop = () => { setActive(false); setPath(""); setBounce(false); };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "ControlLeft" || e.key === "." || e.key === "4") {
        e.preventDefault();
        navigate(".");
      } else if (e.code === "ControlRight" || e.key === "-" || e.key === "6") {
        e.preventDefault();
        navigate("-");
      } else if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        navigate(".");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const totalAttempts = stats.correct + stats.incorrect;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0;

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth || 600;
      const maxViewH = Math.min(window.innerHeight * 0.6, 500);
      const laid = active ? layoutOnCanvas(treeRef.current, w, maxViewH) : [];
      const h = active ? calcHeight(laid) : Math.min(200, maxViewH);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      if (!active) {
        ctx.fillStyle = "#7c7d9b";
        ctx.font = "16px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t("practice.modes.morseTree.idle"), w / 2, h / 2);
        return;
      }

      const pathSet = new Set<string>();
      let acc = "";
      for (const sym of path) {
        acc += sym;
        pathSet.add(acc);
      }
      pathSet.add("");

      ctx.strokeStyle = "#3c3d4b";
      ctx.lineWidth = 1.5;
      for (const ln of laid) {
        for (const child of [ln.node.dot, ln.node.dash]) {
          if (!child) continue;
          const cl = laid.find((l) => l.node === child);
          if (!cl) continue;
          const onPath = pathSet.has(ln.node.path) && pathSet.has(child.path);
          ctx.strokeStyle = onPath ? "#c0c1ff" : "#3c3d4b";
          ctx.lineWidth = onPath ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.moveTo(ln.x, ln.y);
          ctx.lineTo(cl.x, cl.y);
          ctx.stroke();
        }
      }

      const validCodes = new Set(Object.values(CHAR_TO_MORSE));
      ctx.textBaseline = "middle";

      for (const ln of laid) {
        const isOnPath = pathSet.has(ln.node.path);
        const isCurrent = ln.node.path === path;
        const radius = isCurrent ? 24 : 18;

        if (isCurrent) {
          ctx.beginPath();
          ctx.arc(ln.x, ln.y, 26, 0, Math.PI * 2);
          ctx.strokeStyle = "#c0c1ff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(ln.x, ln.y, radius, 0, Math.PI * 2);
        if (isCurrent) {
          ctx.fillStyle = "#c0c1ff";
        } else if (isOnPath) {
          ctx.fillStyle = "#6c6d8b";
        } else if (ln.node.char) {
          ctx.fillStyle = "#4c4d6b";
        } else {
          ctx.fillStyle = "#2c2d3b";
        }
        ctx.fill();

        if (isCurrent) {
          ctx.fillStyle = "#13131b";
          ctx.font = "bold 13px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(ln.node.char ?? "?", ln.x, ln.y);
        } else if (ln.node.char) {
          ctx.fillStyle = "#d0d0e8";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(ln.node.char, ln.x, ln.y);
        } else if (validCodes.has(ln.node.path)) {
          ctx.fillStyle = "#7c7d9b";
          ctx.font = "9px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("?", ln.x, ln.y);
        }
      }

      ctx.textBaseline = "top";

      if (bounce) {
        ctx.fillStyle = "#f28b82";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t("practice.modes.morseTree.deadEnd"), w / 2, 130);
      }

      const pd = pathDisplay(path);
      const charSuffix = currentChar ? t("practice.modes.morseTree.pathEquals", { char: currentChar }) : "";
      ctx.fillStyle = "#a0a0c0";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${t("practice.modes.morseTree.path")}: ${pd}${charSuffix}`, 10, 8);
    };

    draw();

    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, path, bounce, t, currentChar]);

  return (
    <div className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-lg flex flex-col gap-md">
      <div className="flex justify-between items-center">
        <h3 className="font-heading-md text-heading-md text-on-surface">
          {t("practice.modes.morseTree.title")}
        </h3>
        <div className="flex gap-sm">
          {active ? (
            <button
              onClick={stop}
              className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-error text-on-error hover:opacity-90 transition-opacity flex items-center gap-xs"
            >
              <Icon name="stop" className="w-4 h-4" />
              {t("common.stop")}
            </button>
          ) : (
            <button
              onClick={start}
              className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity flex items-center gap-xs"
            >
              <Icon name="play" className="w-4 h-4" />
              {t("common.start")}
            </button>
          )}
        </div>
      </div>

      {active && (
        <div className="flex items-center justify-center gap-lg text-label-sm text-on-surface-variant">
          <span>{t("practice.modes.morseTree.correct")}: <strong className="text-primary">{stats.correct}</strong></span>
          <span>{t("practice.modes.morseTree.incorrect")}: <strong className="text-error">{stats.incorrect}</strong></span>
          <span>{t("practice.modes.morseTree.accuracy")}: <strong className={cn(accuracy >= 80 ? "text-primary" : "text-tertiary")}>{accuracy}%</strong></span>
          <span>{t("practice.modes.morseTree.streak")}: <strong className="text-primary">{stats.streak}</strong></span>
        </div>
      )}

      <div ref={containerRef} className="w-full rounded-lg overflow-auto" style={{ maxHeight: '60vh' }}>
        <canvas ref={canvasRef} className="block" />
      </div>

      {active && (
        <div className="flex justify-center gap-md">
          <button
            onClick={() => navigate(".")}
            className="w-20 h-14 rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center gap-sm hover:border-primary hover:bg-surface-container transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="font-body-md text-body-md text-on-surface font-medium">•</span>
          </button>
          <button
            onClick={() => navigate("-")}
            className="w-20 h-14 rounded-xl border-2 border-dashed border-outline-variant bg-surface flex items-center justify-center gap-sm hover:border-primary hover:bg-surface-container transition-colors"
          >
            <span className="w-8 h-2 rounded-sm bg-primary" />
            <span className="font-body-md text-body-md text-on-surface font-medium">-</span>
          </button>
        </div>
      )}

      {active && (
        <p className="text-center text-label-sm text-on-surface-variant">
          {t("practice.modes.morseTree.hint")}
        </p>
      )}
    </div>
  );
}
