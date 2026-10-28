import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("migration: private tables, seeded admins, atomic claims/outbox, optimistic locking, one-use login and rate limits", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20261028_returns.sql", import.meta.url),
        "utf8",
      ),
    );
    assert.deepEqual(
      (
        await db.query("select email from returns_admins order by email")
      ).rows.map((r) => r.email),
      ["chris@dealsandstealsmd.com", "keeley@dealsandstealsmd.com"],
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int as n from pg_tables where tablename like 'returns_%' and rowsecurity",
        )
      ).rows[0].n,
      6,
    );
    assert.equal(
      (
        await db.query(
          "select public from storage.buckets where id='returns-evidence'",
        )
      ).rows[0].public,
      false,
    );
    assert.equal(
      (
        await db.query(
          "select has_table_privilege('anon','returns_claims','SELECT') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (
        await db.query(
          "select has_function_privilege('anon','returns_save_claim(jsonb,integer,text,text,jsonb)','EXECUTE') as allowed",
        )
      ).rows[0].allowed,
      false,
    );
    const data = {
      id: "00000000-0000-4000-8000-000000000001",
      version: 1,
      status: "submitted",
    };
    const emails = [
      {
        recipient: "test@example.com",
        subject: "Test",
        body: "Private claim",
        key: "claim:1",
      },
    ];
    const save = (d, v, e = emails) =>
      db.query(
        "select returns_save_claim($1::jsonb,$2,$3,$4,$5::jsonb) as ok",
        [JSON.stringify(d), v, "tokenhash", "requesthash", JSON.stringify(e)],
      );
    assert.equal((await save(data, 0)).rows[0].ok, true);
    assert.equal((await save(data, 0)).rows[0].ok, false);
    assert.equal(
      (await db.query("select count(*)::int n from returns_outbox")).rows[0].n,
      1,
    );
    assert.equal(
      (
        await save({ ...data, version: 2, status: "approved_keep" }, 1, [
          { ...emails[0], key: "claim:2" },
        ])
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (await save({ ...data, version: 2, status: "denied" }, 1)).rows[0].ok,
      false,
    );
    assert.equal(
      (await db.query("select data from returns_claims")).rows[0].data.status,
      "approved_keep",
    );
    await assert.rejects(
      save({ ...data, version: 3 }, 2, [{ recipient: null, key: "bad" }]),
    );
    assert.equal(
      (await db.query("select version from returns_claims")).rows[0].version,
      2,
      "failed email insert rolls back state",
    );
    await db.exec(
      "insert into returns_login_tokens values ('abc','chris@dealsandstealsmd.com',now()+interval '1 minute')",
    );
    assert.equal(
      (await db.query("select returns_consume_login('abc') as email")).rows[0]
        .email,
      "chris@dealsandstealsmd.com",
    );
    assert.equal(
      (await db.query("select returns_consume_login('abc') as email")).rows[0]
        .email,
      null,
    );
    for (let i = 0; i < 3; i++)
      assert.equal(
        (await db.query("select returns_rate_limit('test',2,60) as ok")).rows[0]
          .ok,
        i < 2,
      );
    await db.exec(
      "update returns_limits set resets_at=now()-interval '1 second'",
    );
    assert.equal(
      (await db.query("select returns_rate_limit('test',2,60) as ok")).rows[0]
        .ok,
      true,
    );
  } finally {
    await db.close();
  }
});
