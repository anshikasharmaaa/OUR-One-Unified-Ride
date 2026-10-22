jest.mock("../services/email", () => require("./helpers/mailbox").emailModule);
const mailbox = require("./helpers/mailbox");
const {
  agent,
  bearer,
  useDatabase,
  makeUser,
  loginUser,
  models,
} = require("./helpers/testApp");
const { bootstrapAdmin } = require("../services/adminBootstrap");

useDatabase();
const ADMIN = {
  name: "Platform Admin",
  email: "admin@our.example",
  password: "Adm1n!Very-Strong-Pass",
};
const FORM = {
  name: "Riya Sharma",
  email: "riya@example.com",
  subject: "Feedback",
  message: "Great product, thank you so much!",
};

async function adminToken() {
  const r = await agent()
    .post("/api/admin/login")
    .send({ email: ADMIN.email, password: ADMIN.password });
  return r.body.data.accessToken;
}
const get = async (url, t) => bearer(agent().get(url), t);
const post = async (url, t, body) => bearer(agent().post(url).send(body), t);

beforeEach(async () => {
  mailbox.reset();
  await bootstrapAdmin(ADMIN);
});

describe("contact queries", () => {
  test("a public submission is stored with a ticket and shows up for the admin only", async () => {
    const sub = await agent().post("/api/contact").send(FORM);
    expect(sub.status).toBe(201);
    expect(sub.body.data.ticketId).toMatch(/^OUR-\d{4}-[A-Z0-9]{6}$/);
    expect(await models.ContactMessage.countDocuments({})).toBe(1);

    expect((await agent().get("/api/admin/contacts")).status).toBe(401);
    await makeUser();
    const u = await loginUser(agent());
    expect(
      (await get("/api/admin/contacts", u.body.data.accessToken)).status,
    ).toBe(403);

    const list = await get("/api/admin/contacts", await adminToken());
    expect(list.status).toBe(200);
    expect(list.body.data.items[0]).toMatchObject({
      ticketId: sub.body.data.ticketId,
      status: "OPEN",
    });
    expect(list.body.data.counts.open).toBe(1);
  });

  test("a successful reply emails the sender, resolves the query and is idempotent", async () => {
    await agent().post("/api/contact").send(FORM);
    const t = await adminToken();
    const id = (await get("/api/admin/contacts", t)).body.data.items[0].id;
    const body = {
      message: "Thanks for the kind words!",
      requestId: "req-12345678",
    };

    const r1 = await post(`/api/admin/contacts/${id}/reply`, t, body);
    expect(r1.status).toBe(200);
    expect(r1.body.data.query.status).toBe("RESOLVED");
    expect(r1.body.data.query.replies[0].state).toBe("SENT");
    expect(mailbox.replies).toHaveLength(1);
    expect(mailbox.replies[0].to).toBe(FORM.email);

    const r2 = await post(`/api/admin/contacts/${id}/reply`, t, body); // double click / retry
    expect(r2.status).toBe(200);
    expect(mailbox.replies).toHaveLength(1);
  });

  test("a failed email never resolves the query and can be retried", async () => {
    await agent().post("/api/contact").send(FORM);
    const t = await adminToken();
    const id = (await get("/api/admin/contacts", t)).body.data.items[0].id;
    const body = {
      message: "Thanks for the kind words!",
      requestId: "req-87654321",
    };

    mailbox.failNextReply();
    const bad = await post(`/api/admin/contacts/${id}/reply`, t, body);
    expect(bad.status).toBeGreaterThanOrEqual(400);
    const mid = (await get(`/api/admin/contacts/${id}`, t)).body.data.query;
    expect(mid.status).toBe("OPEN");
    expect(mid.replies[0].state).toBe("FAILED");

    const ok = await post(`/api/admin/contacts/${id}/reply`, t, body);
    expect(ok.status).toBe(200);
    expect(ok.body.data.query.status).toBe("RESOLVED");
    expect(ok.body.data.query.replies).toHaveLength(1);
  });

  test("status can be moved to in progress but never straight to resolved", async () => {
    await agent().post("/api/contact").send(FORM);
    const t = await adminToken();
    const id = (await get("/api/admin/contacts", t)).body.data.items[0].id;
    const patch = (status) =>
      bearer(
        agent().patch(`/api/admin/contacts/${id}/status`).send({ status }),
        t,
      );
    expect((await patch("IN_PROGRESS")).body.data.query.status).toBe(
      "IN_PROGRESS",
    );
    expect((await patch("RESOLVED")).status).toBe(400);
  });
});

describe("providers", () => {
  test("lists the three comparison providers, rejects duplicates, and protects built-ins", async () => {
    const t = await adminToken();
    const list = await get("/api/admin/providers", t);
    expect(list.body.data.items.map((p) => p.slug)).toEqual([
      "rapido",
      "ola",
      "uber",
    ]);

    const make = (slug) =>
      post("/api/admin/providers", t, {
        slug,
        name: "Metro Cabs",
        logoUrl: "https://example.com/logo.svg",
        categories: ["auto"],
      });
    expect((await make("metro")).status).toBe(201);
    expect((await make("metro")).status).toBe(409);
    expect(
      (
        await post("/api/admin/providers", t, {
          slug: "bad",
          name: "Bad",
          logoUrl: "http://example.com/x.png",
        })
      ).status,
    ).toBe(400);

    const uber = list.body.data.items[2];
    const off = await bearer(
      agent().patch(`/api/admin/providers/${uber.id}`).send({ active: false }),
      t,
    );
    expect(off.body.data.provider.active).toBe(false);
    expect(
      (await bearer(agent().delete(`/api/admin/providers/${uber.id}`), t))
        .status,
    ).toBe(409);
  });
});
