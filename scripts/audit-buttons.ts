import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

type Finding = {
  file: string;
  line: number;
  issue: string;
  snippet: string;
};

const root = process.cwd();
const findings: Finding[] = [];
const extensions = new Set([".tsx", ".ts", ".jsx", ".js"]);

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "desktop", "output"].includes(entry) || entry.startsWith(".next-")) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if ([...extensions].some((ext) => path.endsWith(ext))) auditFile(path);
  }
}

function add(file: string, index: number, lines: string[], issue: string) {
  findings.push({
    file: file.replace(root + "\\", "").replace(root + "/", ""),
    line: index + 1,
    issue,
    snippet: lines[index]?.trim().slice(0, 220) || "",
  });
}

function auditFile(file: string) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/href=["']#["']/.test(line)) add(file, index, lines, "href # decorativo");
    if (/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(line)) add(file, index, lines, "onClick vacio");
    if (/console\.log\(/.test(line) && /\\(app|components|lib|hooks)\\/.test(file.replaceAll("/", "\\"))) add(file, index, lines, "console.log en codigo UI/API");
    if (/alert\(/.test(line)) add(file, index, lines, "alert usado como accion");
    if (/<button\b[^>]*>.*<\/button>/.test(line) && !/type=|onClick=|formAction=|aria-label=/.test(line)) add(file, index, lines, "button inline sin type/onClick/formAction/aria-label");
  });
}

walk(root);

const report = [
  "# AUDIT BUTTONS REPORT",
  "",
  `Fecha: ${new Date().toISOString()}`,
  `Total hallazgos: ${findings.length}`,
  "",
  "| Archivo | Linea | Incidencia | Snippet |",
  "|---|---:|---|---|",
  ...findings.map((finding) => `| \`${finding.file}\` | ${finding.line} | ${finding.issue} | \`${finding.snippet.replaceAll("|", "\\|")}\` |`),
  "",
  findings.length === 0 ? "Resultado: 0 botones decorativos detectados por auditoria estatica." : "Resultado: revisar hallazgos y corregir o justificar.",
  "",
].join("\n");

writeFileSync(join(root, "AUDIT_BUTTONS_REPORT.md"), report);
process.stdout.write(report);

if (findings.length > 0) process.exitCode = 1;
