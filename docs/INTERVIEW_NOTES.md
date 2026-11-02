# SpendWell — Interview Notes

> The three problems in this design that are genuinely hard to get right, how SpendWell solves them, and exactly what to measure so the resume bullets are true.
> Rule for this document: **every number you quote must come from the bench table at the end.** Placeholders in brackets are not results yet.

---

## 0. How to use this document

1. Build the feature.
2. Run the drill or benchmark described under each problem.
3. Fill in the **Measured** column with your own numbers, on your own machine, with the stated dataset.
4. Only then write the resume bullet.

The interview version is: *problem → naive solution → why it breaks → design → how you proved it works → trade-off you accepted*. Rehearse that order. Interviewers care much more about the failure mode you anticipated than the library you picked.

---

## 1. Problem 1 — Recurring transactions must be idempotent

### The problem

A recurring rule ("₹25,000 rent on the 1st", "₹199 subscription monthly") must create exactly **one** transaction per occurrence, forever, even when:

- the API restarts mid-job,
- two instances run the scheduler at the same time (deploy overlap, accidental scale-out),
- the job runs twice because the previous run timed out but actually succeeded,
- the process was down for three weeks and must catch up,
- the occurrence day is the 31st and the month has 28 days,
- the user is in a timezone where "today" is not the server's today.

### The naive version and how it fails

```ts
// The version everyone writes first
const rules = await prisma.recurringRule.findMany({ where: { isActive: true } });
for (const rule of rules) {
  await prisma.transaction.create({ data: { ...rule, date: today } });
}
```

Failure modes, in the order they bite:

1. **Double run** → two rent transactions. A retry, a deploy, or a second instance is enough.
2. **Crash after insert, before `lastRunAt` update** → next run posts again (or, with the opposite ordering, skips a month forever).
3. **Catch-up** → after downtime, either everything is missed or 90 transactions appear at once.
4. **Month-end** → Jan 31 + "one month" lands on Mar 3 (or Feb 28 then Mar 28 forever) depending on the date library.
5. **Timezone** → a user in IST gets the rent posted on the 31st at 23:30 UTC, which is already the 1st for them — or the reverse.

### The design

**Two independent guarantees, because either alone is insufficient:**

**(a) A database invariant — the strongest guarantee.**

```prisma
@@unique([recurringRuleId, occurrenceDate], map: "transaction_recurring_occurrence_key")
```

A generated row is identified by `(rule, occurrence date)`. Manual transactions have both columns `NULL`, and PostgreSQL treats `NULL`s as distinct, so the constraint does not interfere with them. Even if the scheduler runs 50 times, Postgres will accept exactly one row per occurrence.

**(b) A job-level lock — an optimization, not the correctness argument.**

At job start, acquire `pg_try_advisory_lock(hashtext('spendwell:recurring'))` on a **dedicated `pg` connection** held for the duration of the run. If the lock is not acquired, log `cron_skipped: lock_held` and exit. The lock prevents wasted work; correctness still rests on (a). Prisma's pool makes session-level advisory locks awkward, so use a small dedicated `pg` client for the lock and Prisma for data. That is a deliberate, explainable split.

**(c) A transactional state machine per rule.**

For each due rule, in **one** transaction:

```ts
await prisma.$transaction(async (tx) => {
  // Re-check inside the transaction: the rule may have been paused since the scan.
  const rule = await tx.recurringRule.findFirst({
    where: { id, isActive: true, nextRunAt: { lte: todayForRule } },
  });
  if (!rule) return 'skipped';

  await tx.transaction.create({
    data: {
      userId: rule.userId,
      categoryId: rule.categoryId,
      type: rule.type,
      amount: rule.amount,
      currency: user.currency,
      date: rule.nextRunAt,
      source: 'RECURRING',
      recurringRuleId: rule.id,
      occurrenceDate: rule.nextRunAt,
    },
  });

  await tx.recurringRule.update({
    where: { id: rule.id },
    data: {
      lastRunAt: rule.nextRunAt,
      nextRunAt: computeNext(rule, rule.nextRunAt), // pure function, tested
    },
  });
});
```

The insert and the advance commit together or not at all. If a duplicate-key error (`P2002`) occurs, the occurrence was already posted by a previous attempt — **treat it as success and still advance `nextRunAt`**. That is the crucial branch: `P2002` is not an error, it is proof of idempotency.

**(d) Pure recurrence math, tested without a database.**

`computeNext(rule, from)` handles:

- `interval` (every N periods),
- `anchorDay` retained from `startDate` for monthly/yearly,
- **clamping to month length but restoring the anchor**: Jan 31 → Feb 28 → **Mar 31**,
- Feb 29 yearly → Feb 28 in non-leap years,
- `endDate` stops,
- timezone-aware "today" via `Intl.DateTimeFormat` with the rule's stored timezone.

This is a pure function with a table-driven test suite (30+ cases). It is the part most likely to be wrong, and the cheapest part to test exhaustively.

**(e) Bounded catch-up.**

The job processes `nextRunAt <= today` but generates at most `RECURRING_CATCHUP_DAYS` (60) of missed occurrences per rule per run, then leaves `nextRunAt` in the future. It logs the gap and creates a `SYSTEM` notification only if the gap exceeds the window. Silent unbounded backfill is how a "fix" turns into 400 duplicate rent payments.

**Why this is effectively-once:** execution is *at-least-once* (cron can repeat, crash can retry), and the write is *idempotent* (a unique key plus a transactional state advance). At-least-once + idempotent = effectively-once. Say exactly that in the interview; it is the correct framing and shows you understand there is no magic exactly-once delivery.

### Trade-offs to state out loud

- A per-user queue (BullMQ/SQS) would isolate failures and scale better, but adds Redis, a worker deployable, and monitoring. At one instance and thousands of rules, cron + a lock + a unique key is simpler and **provably** safe.
- The advisory lock is Postgres-specific. That is fine — Postgres is already a hard dependency.
- The 15-minute cadence means a rule can post up to 15 minutes "late" but never early or twice. Product-acceptable; documented.
- `occurrenceDate` can differ from `date` if a user edits the generated transaction later. That is intentional: `occurrenceDate` is the idempotency key, `date` is the user-visible value.

### What to measure

| Metric | How | Target to beat | Measured |
|---|---|---|---|
| Duplicate transactions under 5 concurrent job processes × 200 due rules | Spawn 5 processes against one DB; assert `COUNT(*) = 200` | **0 duplicates** | [ ] |
| Duplicate transactions across 20 kill/restart cycles mid-job | Kill -9 the process at random points; restart; run again; assert exact count | **0 duplicates, 0 missed** | [ ] |
| Job duration, 10 000 due rules | Time the job, p50/p95 over 20 runs | p95 < 30 s | [ ] |
| Queries per rule | Prisma query log / `pg_stat_statements` | ≤ 4 (find, insert, update, user currency) | [ ] |
| Catch-up correctness | Simulate 90 days down; assert 60 days posted, gap logged, `nextRunAt` in the future | exactly 60 | [ ] |
| Month-end correctness | Unit matrix: 31st, 30th, 29th, leap year, interval 2 | 30/30 pass | [ ] |

**Drill script output to keep** (commit it under `docs/bench/`): the command, the seeded rule count, the process count, the final `COUNT(*)`, and the job log summary line.

### Resume bullet template (fill in real numbers)

> Built an idempotent recurring-transaction engine (node-cron + PostgreSQL advisory lock + unique occurrence key) that posts **[N]** scheduled entries with **0 duplicates** across **[N]** concurrent runs and **[N]** crash/restart cycles.

### Likely follow-up questions

- *Why not just check `lastRunAt`?* Because the insert and the update are two statements; a crash between them either double-posts or skips. The unique key is a database-level fact, not application state.
- *What if the user edits the generated transaction?* The occurrence key stays on the row, so the job still sees it as posted. Edits change `date`/`amount`, not `occurrenceDate`.
- *What if the lock is held by a dead process?* Session-level advisory locks are released when the connection dies; that is why the lock lives on a dedicated connection, not a pooled one.
- *How do you know it's exactly once?* I don't claim exactly-once delivery. I claim at-least-once execution with an idempotent write, and I proved zero duplicates under concurrency and restart.

---

## 2. Problem 2 — Analytics that stay fast as the ledger grows

### The problem

The dashboard and analytics screen need, for an arbitrary month and range:

- income, expense, net, count,
- spend by category with shares,
- an income-vs-expense trend with zero-filled buckets,
- budget status per category.

Doing this naively is slow in three different ways, and each has a different fix.

### The naive versions and how they fail

1. **Fetch rows and sum in JavaScript.** `findMany()` for the month, then `reduce`. At 100 k transactions this transfers tens of MB and blocks the event loop; at 1 M it times out. It also gets *worse* with pagination because the client only has one page.
2. **N+1 per category.** One query for categories, then one query per category for its total. 20 categories = 21 round trips; the dashboard's p95 becomes the sum of 21 latencies.
3. **`OFFSET` pagination on exports and deep pages.** `OFFSET 90000` still walks 90 000 index entries. Fine for page 3, bad for a full export or a "jump to end" UI.
4. **Missing/incorrect indexes.** A composite index in the wrong column order (`date, userId`) cannot serve the universal `userId = ?` predicate efficiently, and a single-column `userId` index leaves the range and sort to a heap scan + sort.

### The design

**(a) Push aggregation into Postgres, one query per chart.**

```sql
SELECT
  COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'),  0)::bigint AS income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::bigint AS expense,
  COUNT(*)::int AS transaction_count
FROM "Transaction"
WHERE "userId" = $1 AND date >= $2 AND date < $3;
```

One round trip, one scan. `FILTER` avoids two separate queries or a `CASE` mess.

**(b) Composite indexes that match the predicates, in predicate order.**

| Query shape | Index |
|---|---|
| User + date range + newest first | `(userId, date DESC, id DESC)` |
| User + category + date range | `(userId, categoryId, date DESC)` |
| User + type + date range | `(userId, type, date DESC)` |
| Substring search | GIN trgm on `note`, `merchant` |
| Budget month | `(userId, month)` |
| Due rules | `(isActive, nextRunAt)` |

`userId` first because it is present in **every** user query and is highly selective per user. `date` second because it is the range/sort column. `id` last for a stable order when dates tie, which also makes keyset pagination possible later.

**(c) Zero-fill time buckets in SQL.**

```sql
WITH periods AS (
  SELECT generate_series($2::date, $3::date, interval '1 month')::date AS period_start
), agg AS (
  SELECT date_trunc('month', date)::date AS period_start,
         SUM(amount) FILTER (WHERE type = 'INCOME')  AS income,
         SUM(amount) FILTER (WHERE type = 'EXPENSE') AS expense
  FROM "Transaction"
  WHERE "userId" = $1 AND date >= $2 AND date < $4
  GROUP BY 1
)
SELECT p.period_start,
       COALESCE(a.income, 0)::bigint  AS income,
       COALESCE(a.expense, 0)::bigint AS expense
FROM periods p LEFT JOIN agg a USING (period_start)
ORDER BY p.period_start;
```

A chart with missing months is a correctness bug, not a cosmetic one — the line implies data that does not exist.

**(d) Half-open date ranges.**

`date >= from AND date < toExclusive`. This is index-friendly, avoids `BETWEEN` off-by-one at month end, and works identically for `DATE` and `TIMESTAMP`.

**(e) Streaming export with keyset pagination.**

`WHERE (date, id) < ($lastDate, $lastId) ORDER BY date DESC, id DESC LIMIT 500`, looped. Memory stays flat and the last page is as fast as the first.

**(f) Only cache after measuring.**

No Redis, no materialized view in v1. If p95 at the target dataset is acceptable, caching adds invalidation bugs for no user-visible gain. The upgrade path (a monthly rollup table or a 60-second cache keyed by `userId:month`) is documented, not built.

### Trade-offs

- Raw SQL for three analytics queries means two query styles (Prisma + `$queryRaw`). Keeping raw SQL confined to repositories and parameterized with `Prisma.sql` keeps it safe and reviewable.
- `SUM(int)` returns `bigint`; the API must convert to a safe `number` (helper throws above `Number.MAX_SAFE_INTEGER`) instead of letting `JSON.stringify` crash on a `BigInt`.
- Indexes cost write throughput. Five indexes on a ledger is a real cost; it is justified because reads (dashboard, list, analytics) outnumber writes roughly 10:1 in this product. At a true write-heavy scale, you would drop the type index and roll up instead.

### What to measure

| Metric | How | Target to beat | Measured |
|---|---|---|---|
| Seed size | `seed-bench.ts --user bench@... --transactions 100000` | 100 k rows in one user, 24 months | [ ] |
| Summary query p50/p95/p99 | 50 runs after warmup, `EXPLAIN (ANALYZE, BUFFERS)` recorded | p95 < 100 ms | [ ] |
| By-category p95 | Same, 20 categories | p95 < 120 ms | [ ] |
| 6-month trend p95 | Same | p95 < 120 ms | [ ] |
| Rows read per query | `EXPLAIN` actual rows + `pg_stat_statements` | no sequential scan on `Transaction` | [ ] |
| Before/after index improvement | Drop the composite index, rerun, restore | ≥ 5× improvement | [ ] |
| HTTP layer p95 | `autocannon -c 20 -d 30` against the endpoint | p95 < 150 ms | [ ] |
| Export memory | 50 k rows, RSS sampled during stream | < 100 MB | [ ] |

**How to benchmark honestly:** state the hardware (e.g. "Ryzen 5, 16 GB, Postgres 16 in Docker, default config"), dataset (rows, months, categories), concurrency, warm vs cold, and number of runs. p95 of 50 runs after 5 warmups is a defensible minimum. Never quote a single warm run.

Template for the bench table:

| Endpoint | Dataset | p50 | p95 | p99 | Plan |
|---|---|---|---|---|---|
| `GET /analytics/summary` | 100 k tx / 24 mo | [ ] | [ ] | [ ] | Index Scan → Aggregate |
| `GET /analytics/by-category` | 100 k tx / 20 cat | [ ] | [ ] | [ ] | Bitmap Heap + HashAggregate |
| `GET /analytics/trend` | 100 k tx / 24 mo | [ ] | [ ] | [ ] | Index Scan + GroupAggregate |

### Resume bullet template

> Cut dashboard analytics p95 from **[X] ms to [Y] ms** at **[N]** transactions by replacing per-category N+1 queries with single `FILTER` aggregates and adding composite `(userId, date)` / `(userId, categoryId, date)` indexes (**[Z]** fewer rows read, verified with `EXPLAIN ANALYZE`).

### Likely follow-up questions

- *Why not compute totals on the client?* The list is paginated, so the client only has one page. Totals must come from the full filtered set in the database.
- *Why `FILTER` instead of `CASE WHEN`?* Same plan, clearer intent, and Postgres can use it in a single aggregate node. `FILTER` is standard SQL and reads better in review.
- *Would you add a materialized view?* Only if measured p95 exceeded the target after indexing. At that point I'd add a monthly rollup keyed by `(userId, categoryId, month)` refreshed on write or by cron, and accept the invalidation complexity.
- *What about `COUNT(*)` on every page?* It is a second scan of the same filtered set. At 100 k rows it is cheap; if it became the bottleneck, I'd switch the UI to "load more" with `hasMore` and skip the exact total.

---

## 3. Problem 3 — CSV import: validation, partial failure, and duplicate detection

### The problem

Users arrive with a bank export. The file can be 3 rows or 5 000, have quoted commas and newlines, use `1,234.50` or `1234.5`, contain an unknown category, repeat rows, or be uploaded twice because the first attempt "seemed slow". The import must:

- never write a partial file,
- never create duplicate ledger entries on re-upload,
- report exactly which rows failed and why,
- not blow up memory or the event loop,
- not turn user text into an Excel formula on export.

### The naive version and how it fails

```ts
const rows = Papa.parse(csvText, { header: true, dynamicTyping: true }).data;
for (const row of rows) {
  await prisma.transaction.create({ data: map(row) });   // loop of awaits
}
```

Problems:

1. **Partial writes.** Row 4 999 fails; rows 1–4 998 are already committed and the user has no batch id to undo them.
2. **`dynamicTyping: true`** turns `"249.50"` into a float and `"00123"` into `123`. Money parsed as a float and multiplied by 100 drifts (`19.99 * 100 = 1998.9999999999998`).
3. **Duplicates.** Re-uploading the same file doubles the ledger. Matching on `date + amount` alone falsely merges two coffees.
4. **No row-level errors.** The user sees "import failed" with no idea which row or column.
5. **Memory.** A 50 MB file parsed fully into an array plus a Prisma loop is slow and can OOM a small container.
6. **CSV injection.** A note beginning with `=` becomes a formula when the export is opened in Excel.

### The design

**(a) Hard limits before parsing.**

5 MB, 5 000 data rows, UTF-8. Reject with `413` / `400 IMPORT_INVALID_FILE` before doing any work. Synchronous processing is a deliberate v1 boundary; async import (`202 + jobId`) is the documented upgrade for larger files.

**(b) Parse without type coercion, validate every row with Zod.**

```ts
const parsed = Papa.parse(buffer.toString('utf8'), {
  header: true,
  skipEmptyLines: 'greedy',
  transformHeader: (h) => h.trim().toLowerCase(),
  // dynamicTyping stays false
});
```

Each raw string goes through `csvRowSchema`:

- `date`: `YYYY-MM-DD` (or `YYYY/MM/DD` normalized) → a `Date` at UTC midnight; anything else → `INVALID_DATE`.
- `amount`: **string → integer minor units without float**. Split on `.`, validate digits, pad/truncate to the currency exponent, `Number(intPart + fractionPadded)`. `1,234.50` is rejected explicitly (ambiguous thousands separator), not silently accepted.
- `type`: `INCOME`/`EXPENSE`, plus `CREDIT`/`DEBIT` aliases.
- `category`: case-insensitive match against the user's **active** categories; unknown → `UNKNOWN_CATEGORY` unless `createMissingCategories=true`.
- Category type must match row type → `CATEGORY_TYPE_MISMATCH`.
- `note` ≤ 280, `merchant` ≤ 80.

The error object is `{ row, code, message }`, capped at 100 for the response and the stored report, with `summary.failed` carrying the true count.

**(c) Validate the whole file before writing anything.**

Phase 1: parse + validate + resolve categories + compute fingerprints, entirely in memory (5 000 rows is a few MB). Phase 2: write only if the caller confirms. `dryRun=true` stops after phase 1 and returns the same report — that is the preview UI.

**(d) Duplicate detection with a deterministic fingerprint.**

```text
fingerprint = sha256(
  userId | date | type | amountMinor | categoryId | lower(trim(note ?? ''))
)
```

Stored on the transaction (`importFingerprint`), with a unique constraint:

```prisma
@@unique([userId, importFingerprint], map: "transaction_import_fingerprint_key")
```

Why this exact set:

- `date + amount` alone merges two legitimate identical coffees.
- `note` distinguishes them, but only when the user wrote one.
- `userId` scopes duplicates per account.
- `categoryId` prevents re-importing the same expense under a different category from being silently dropped... actually it makes them **distinct**, which is correct: moving a row to another category is a different ledger entry.

Within the file, a repeated fingerprint is counted once and reported as a duplicate, not as an error. Across files, the unique index is the final guard. `allowDuplicates=true` bypasses dedupe by writing `importFingerprint = NULL`; the user is explicitly opting out of the safety net.

**(e) One transaction for all writes, chunked.**

```ts
await prisma.$transaction(async (tx) => {
  for (const chunk of chunks(validRows, 500)) {
    await tx.transaction.createMany({ data: chunk, skipDuplicates: true });
  }
  await tx.importBatch.update({ where: { id: batchId }, data: { status: 'COMPLETED', ... } });
}, { timeout: 30_000, maxWait: 5_000 });
```

- All-or-nothing visibility: a failure at row 2 500 leaves nothing behind.
- `skipDuplicates` is a **safety net** (a concurrent import of the same file), not the primary dedupe. Pre-filtering against already-known fingerprints is what produces accurate `skippedDuplicates` counts.
- The 30 s timeout is set explicitly because Prisma's 5 s default would abort a legitimate 5 000-row import.

**(f) Export hardening.**

- RFC 4180 quoting for commas, quotes, newlines.
- UTF-8 BOM so Excel detects encoding.
- **Formula injection defense:** any cell starting with `=`, `+`, `-`, `@`, tab, or CR is prefixed with `'` (documented in the README, and stripped again on import). Without this, a note like `=HYPERLINK("http://evil","click")` becomes a live formula in someone's spreadsheet.
- Amounts exported in major units (`249.00`) using the currency exponent, because spreadsheets expect decimals; re-import converts the string back to integer minor units with the same tested parser.

### Trade-offs

- The fingerprint can miss a true duplicate if the user changes the note between uploads. That is acceptable: the constraint is a safety net, and `allowDuplicates` exists for edge cases.
- Synchronous import caps the product at 5 000 rows. Beyond that, a background job and progress UI are the honest answer — not a bigger timeout.
- One large transaction holds locks on the inserted range for its duration. At 5 000 rows this is sub-second locally; it would not be acceptable for 500 000 rows.
- Formula-injection escaping modifies exported text. The import strips the guard prefix, so a round-trip is lossless for SpendWell → SpendWell; a third-party tool sees an apostrophe. Document it.

### What to measure

| Metric | How | Target to beat | Measured |
|---|---|---|---|
| Import time, 5 000 rows | Time `POST /transactions/import` end to end, 10 runs | < 5 s p95 | [ ] |
| Peak RSS during import | Sample `process.memoryUsage().rss` every 100 ms | < 150 MB | [ ] |
| Re-import the same 5 000-row file | Upload twice | `imported: 0`, `skippedDuplicates: 5000`, 0 new rows | [ ] |
| Partial-failure safety | Force a DB error at chunk 5 (mock/constraint), then count rows | 0 rows written | [ ] |
| Row-level error accuracy | Fixture with 7 bad rows at known line numbers | 7/7 correct `{row, code}` | [ ] |
| Round-trip equality | Export 200 tx → import into a fresh account | totals equal to the paise | [ ] |
| Malformed-file handling | 10 MB file, 5 001 rows, binary junk, missing header | 413 / 422 / 400, never a 500 | [ ] |

### Resume bullet template

> Built a transactional CSV import with row-level validation and SHA-256 fingerprint deduplication that imports **[N]** rows in **[T]** s, rejects **[N]** malformed rows with exact line numbers, and produces **0 duplicates** on re-upload of the same file.

### Likely follow-up questions

- *Why not use the bank's CSV format directly?* Every bank differs. A documented template plus tolerant aliases (`CREDIT`/`DEBIT`, `YYYY/MM/DD`) is the 80% solution; per-bank adapters are a product decision.
- *Why hash the note instead of comparing rows?* Comparing composite tuples is possible, but a fixed-length hash makes a single-column unique index cheap and keeps the dedupe rule in one documented place.
- *What if two rows are genuinely identical?* They are skipped by default; the user can re-run with `allowDuplicates=true`. This is a product trade-off, not a technical limitation, and it is stated in the import UI.
- *Why not stream the parse?* The 5 000-row cap makes buffering safe and much simpler. Streaming would matter at 500 k rows, where the right answer is a background job anyway.

---

## 4. Honorable mention — refresh-token rotation and reuse detection

Not one of the three, but a strong 60-second answer if asked about auth.

- Access token: JWT, 15 min, **memory only** (never `localStorage`).
- Refresh token: 256-bit random, `httpOnly` cookie, **only the SHA-256 hash stored**, 30 days.
- Every refresh rotates: the old row gets `revokedAt` + `replacedById`, a new row joins the same `familyId`.
- Presenting an already-rotated token means the cookie leaked or two clients raced. The API revokes the **entire family** and returns `401 REFRESH_TOKEN_REUSED`. The client's single-flight refresh makes the race case rare; the family revocation makes theft detectable.
- Trade-off: rotation adds a DB write per refresh and a retry path in the client. Worth it — a non-rotating refresh token is a 30-day bearer token sitting in a browser.

**Measure:** concurrent-refresh drill (two tabs) → exactly one rotation succeeds and the other either reuses the new token or is logged out cleanly; 0 families left active after a simulated stolen-token replay.

---

## 5. Numbers table — fill this in

Do not put anything in the "Measured" column until you have run the drill. Copy this table into the README when it is real.

| # | Claim | Metric | Target | Measured | Command / evidence |
|---|---|---|---|---|---|
| 1 | Recurring job is idempotent | duplicate rows | 0 | [ ] | `pnpm drill:recurring --processes 5 --rules 200` |
| 2 | Recovers from crashes | duplicates / missed | 0 / 0 | [ ] | `pnpm drill:recurring --kill 20` |
| 3 | Fast analytics at 100 k rows | summary p95 | < 100 ms | [ ] | `pnpm bench:api` |
| 4 | Indexes actually used | seq scans on `Transaction` | 0 | [ ] | `EXPLAIN (ANALYZE, BUFFERS)` |
| 5 | Import throughput | 5 k rows p95 | < 5 s | [ ] | `pnpm bench:import` |
| 6 | Import is duplicate-safe | dupes on re-upload | 0 | [ ] | `pnpm drill:import-dup` |
| 7 | Import is all-or-nothing | rows after forced failure | 0 | [ ] | `pnpm drill:import-fail` |
| 8 | Export is memory-flat | peak RSS, 50 k rows | < 100 MB | [ ] | `pnpm bench:export` |
| 9 | Auth rotation is safe | families left after replay | 0 | [ ] | `pnpm drill:refresh-reuse` |

Also record, once, in the bench README: CPU, RAM, OS, Node version, Postgres version, Docker vs native, dataset seed, and whether the DB was warm.

---

## 6. The 90-second architecture pitch

> "SpendWell is a mobile-first expense tracker. It's a modular monolith: a React/TypeScript SPA, an Express/TypeScript API, and PostgreSQL through Prisma, deployed as two stateless services. Inside the API I keep routes → controllers → services → repositories, so HTTP never touches the ORM and every user-owned query is scoped by `userId` at the repository boundary.
>
> Auth uses a 15-minute JWT access token held in memory and a rotating refresh token in an httpOnly cookie; reusing a rotated token revokes the whole token family. Money is stored as integer minor units everywhere, and transaction dates are calendar dates, so month totals don't drift with timezones.
>
> The parts I'd highlight are the three places where naive code corrupts data: recurring transactions are idempotent through a unique `(rule, occurrenceDate)` key plus a transactional state advance, so a retry can't double-post; analytics is pushed into SQL with composite `(userId, date)` indexes and grouped queries, so the dashboard stays fast; and CSV import validates the whole file, dedupes by fingerprint, and writes in one transaction, so a re-upload or a mid-file failure can't corrupt the ledger. I measured [X] on each and kept the drill scripts."

Then stop. Let them pick the thread.

---

## 7. Questions you will get, and honest answers

| Question | Answer |
|---|---|
| Why a monolith? | One transaction boundary for transaction + budget alert + notification; one deploy; one log stream. The domain is small and I'm one developer. Microservices would add failure modes without user value. Scale-out path is stateless API replicas + a worker for cron. |
| Why not Next.js? | The app is auth-gated and client-heavy; a Vite SPA plus a separate API is simpler to reason about and deploy independently, and the landing page is the only SEO surface — it can be static. Next.js would be justified if SEO or server-rendered dashboards mattered. |
| Why Prisma? | Typed schema, migrations, and client in one tool; the schema is the data-model documentation. Cost: complex analytics needs `$queryRaw`, so I keep raw SQL confined to repositories. |
| How do you stop user A reading user B's data? | Every repository method takes `userId` and puts it first in `where`; services re-check ownership before mutations; cross-user access returns 404, not 403, and there's a test per resource. |
| What happens if the access token expires mid-request? | The API returns `TOKEN_EXPIRED`; the client does one single-flight refresh and retries the original request once. If refresh fails, it clears auth and routes to login. |
| Why integer minor units? | Float money drifts (`19.99 * 100`), and aggregates amplify it. Integers make sums exact and let SQL do the math safely. Every boundary uses one `money.ts` parser. |
| What would you change at 10× traffic? | Move cron to a dedicated worker with a real queue, add a monthly rollup table or short-TTL cache for analytics, move imports to async jobs, and add read replicas for analytics. I'd do them in that order, driven by measured p95. |
| What's the biggest weakness? | No real users yet, so the dataset is synthetic and the benchmarks are local. I've stated the hardware and methodology so the numbers can be reproduced, and I would not claim production scale. |
| What was the hardest bug? | [Pick one real one from the build. Best candidates: month-end clamping, the Prisma `BigInt` serialization crash, refresh cookie path blocking `/users/me`, or a partial import.] Use the structure: symptom → wrong hypothesis → how you isolated it → fix → regression test. |

---

## 8. What not to claim

- **"Handles millions of users."** It has never had one real user. Say "designed for personal-scale data; benchmarked at 100 k transactions."
- **"Exactly-once delivery."** Say "at-least-once execution with idempotent writes."
- **"Zero downtime deploys."** Unless you actually run two instances behind a proxy and migrate expand/contract. Say "backward-compatible migrations and a documented rollback."
- **"Microservices architecture."** It is deliberately not one.
- **Any number you did not measure.** One probing question ("how did you measure p95?") turns an inflated bullet into a credibility problem.
