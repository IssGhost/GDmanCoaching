const router = require("express").Router();
const { seedPickleballDemo } = require("../utils/seedPickleballDemo");

router.get("/credentials", (_req, res) => {
  res.json({
    credentials: [
      {
        role: "Customer / Player",
        username: "customer",
        email: "customer@picklepro.demo",
        password: "customer",
        startAt: "/dashboard/submissions",
      },
      {
        role: "Coach",
        username: "coach",
        email: "coach@picklepro.demo",
        password: "coach",
        startAt: "/coach/dashboard",
      },
      {
        role: "Admin",
        username: "admin",
        email: "admin@picklepro.demo",
        password: "admin",
        startAt: "/admin/coaching",
      },
    ],
  });
});

router.post("/seed", async (_req, res, next) => {
  try {
    const result = await seedPickleballDemo();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;