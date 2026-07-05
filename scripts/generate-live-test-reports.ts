import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const docsDir = join(process.cwd(), "docs");
mkdirSync(docsDir, { recursive: true });

function readJsonReport() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "output/playwright/results.json"), "utf8"));
  } catch {
    return null;
  }
}

type PlaywrightSuite = {
  specs?: Array<{
    tests?: Array<{
      results?: Array<{ status?: string }>;
    }>;
  }>;
  suites?: PlaywrightSuite[];
};

function counts() {
  const report = readJsonReport() as { suites?: PlaywrightSuite[] } | null;
  if (!report?.suites) return { passed: 0, failed: 0, skipped: 0, total: 0, blocked: true };
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const walk = (suite: PlaywrightSuite) => {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results?.[test.results.length - 1];
        if (!result) continue;
        if (result.status === "passed") passed += 1;
        else if (result.status === "skipped") skipped += 1;
        else failed += 1;
      }
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const suite of report.suites) walk(suite);
  return { passed, failed, skipped, total: passed + failed + skipped, blocked: failed > 0 };
}

const result = counts();
const status = result.blocked ? "BLOCKED" : "PASSED";
const now = new Date().toISOString();

const common = `# AFFILIX Live QA\n\nFecha: ${now}\n\nTotal: ${result.total}\nPasadas: ${result.passed}\nFallidas: ${result.failed}\nSkipped: ${result.skipped}\n\nArtefactos: output/playwright/html-report/index.html\n`;

const files: Record<string, string> = {
  "LIVE_BROWSER_TEST_REPORT.md": `${common}\n## Navegador\nPlaywright ejecutado contra NEXT_PUBLIC_APP_URL o https://affilix.es.\n`,
  "PLAYWRIGHT_E2E_REPORT.md": `${common}\n## Suites\npublic, admin, affiliate, checkout-delivery, muapi, permissions, live-tests.\n`,
  "MUAPI_TEST_REPORT.md": `${common}\n## MuAPI\nLa suite verifica endpoint de balance. Generaciones reales dependen de MUAPI_API_KEY y presupuesto configurado.\n`,
  "STRIPE_TEST_REPORT.md": `${common}\n## Stripe\nLa suite verifica rutas de checkout/entrega. Pago real test requiere STRIPE_SECRET_KEY y webhook local/preview activo.\n`,
  "EMAIL_TEST_REPORT.md": `${common}\n## Email\nResend se registra como skipped operativo cuando RESEND_API_KEY no esta configurado.\n`,
  "PERMISSIONS_TEST_REPORT.md": `${common}\n## Permisos\nSe valida que endpoint interno critico rechaza ejecucion sin secreto.\n`,
  "FINAL_QA_REPORT.md": `${common}\nAFFILIX Digital Hub QA Status: ${status}\n`,
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(docsDir, name), content);
}

try {
  const audit = readFileSync(join(process.cwd(), "AUDIT_BUTTONS_REPORT.md"), "utf8");
  writeFileSync(join(docsDir, "AUDIT_BUTTONS_REPORT.md"), audit);
} catch {
  writeFileSync(join(docsDir, "AUDIT_BUTTONS_REPORT.md"), "# AUDIT BUTTONS REPORT\n\nNo ejecutado.\n");
}

console.log(`QA reports generated: ${status}`);
