import { getAdminDb } from "@/lib/supabase";

export type LiveTestStatus = "pending" | "running" | "passed" | "failed" | "fixed" | "skipped" | "blocked";

export type LiveTestRun = {
  id: string;
  suite: string;
  status: LiveTestStatus;
  title: string;
  description: string | null;
  started_at: string;
  finished_at: string | null;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  fixed_tests: number;
  skipped_tests: number;
  pending_tests: number;
  muapi_cost_usd: number | string;
  emails_sent: number;
  test_orders_created: number;
  test_deliveries_created: number;
  report_path: string | null;
  metadata: Record<string, unknown>;
  is_test: boolean;
  created_at: string;
};

export type LiveTestStep = {
  id: string;
  run_id: string;
  status: LiveTestStatus;
  test_name: string;
  panel: string;
  actor: string;
  route: string | null;
  action_label: string | null;
  evidence_url: string | null;
  screenshot_path: string | null;
  trace_path: string | null;
  logs_path: string | null;
  error_message: string | null;
  fix_summary: string | null;
  data_created: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
};

export async function getLiveTestRuns(limit = 50) {
  try {
    return await getAdminDb().select<LiveTestRun>("live_test_runs", {
      select: "*",
      order: "created_at.desc",
      limit: String(limit),
    });
  } catch {
    return [];
  }
}

export async function getLiveTestSteps(runId?: string, limit = 250) {
  try {
    return await getAdminDb().select<LiveTestStep>("live_test_steps", {
      select: "*",
      ...(runId ? { run_id: `eq.${runId}` } : {}),
      order: "created_at.desc",
      limit: String(limit),
    });
  } catch {
    return [];
  }
}

export async function getLiveTestDashboard() {
  const [runs, steps] = await Promise.all([getLiveTestRuns(25), getLiveTestSteps(undefined, 250)]);
  const latest = runs[0] || null;
  const totals = runs.reduce(
    (acc, run) => {
      acc.total += Number(run.total_tests || 0);
      acc.passed += Number(run.passed_tests || 0);
      acc.failed += Number(run.failed_tests || 0);
      acc.fixed += Number(run.fixed_tests || 0);
      acc.pending += Number(run.pending_tests || 0);
      acc.muapiCost += Number(run.muapi_cost_usd || 0);
      acc.emails += Number(run.emails_sent || 0);
      acc.orders += Number(run.test_orders_created || 0);
      acc.deliveries += Number(run.test_deliveries_created || 0);
      return acc;
    },
    { total: 0, passed: 0, failed: 0, fixed: 0, pending: 0, muapiCost: 0, emails: 0, orders: 0, deliveries: 0 },
  );
  return { runs, steps, latest, totals };
}

export async function createLiveTestRun(input: {
  suite: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  const [run] = await getAdminDb().insert<LiveTestRun>("live_test_runs", {
    suite: input.suite,
    title: input.title,
    description: input.description || null,
    status: "running",
    metadata: input.metadata || {},
    is_test: true,
  });
  if (!run?.id) throw new Error("No se pudo crear live_test_runs.");
  return run;
}

export async function insertLiveTestSteps(steps: Array<Omit<Partial<LiveTestStep>, "id"> & {
  run_id: string;
  status: LiveTestStatus;
  test_name: string;
  panel: string;
  actor: string;
}>) {
  if (!steps.length) return [];
  return getAdminDb().insert<LiveTestStep>("live_test_steps", steps);
}

export async function finishLiveTestRun(runId: string, steps: Array<{ status: LiveTestStatus }>, extra: Partial<LiveTestRun> = {}) {
  const total = steps.length;
  const passed = steps.filter((step) => step.status === "passed").length;
  const failed = steps.filter((step) => step.status === "failed").length;
  const fixed = steps.filter((step) => step.status === "fixed").length;
  const skipped = steps.filter((step) => step.status === "skipped").length;
  const pending = steps.filter((step) => step.status === "pending" || step.status === "running").length;
  const status: LiveTestStatus = failed ? "failed" : pending ? "blocked" : "passed";
  await getAdminDb().update("live_test_runs", { id: runId }, {
    status,
    total_tests: total,
    passed_tests: passed,
    failed_tests: failed,
    fixed_tests: fixed,
    skipped_tests: skipped,
    pending_tests: pending,
    finished_at: new Date().toISOString(),
    ...extra,
  });
}
