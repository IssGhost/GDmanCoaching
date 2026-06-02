const router = require("express").Router();
const Ticket = require("../models/Ticket");
const { auth, allow } = require("../middleware/auth");

// Public/Anonymous: submit a ticket (contact form)
router.post("/", async (req, res) => {
  const row = await Ticket.create(req.body);
  res.json(row);
});

// User: my tickets
router.get("/mine", auth, async (req, res) => {
  const rows = await Ticket.find({ user: req.user.id }).sort("-createdAt");
  res.json(rows);
});

// Staff: all tickets + update
router.get("/", auth, allow("admin","employee"), async (_req, res) => {
  const rows = await Ticket.find().sort("-createdAt");
  res.json(rows);
});
router.put("/:id", auth, allow("admin","employee"), async (req, res) => {
  const row = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(row);
});

module.exports = router;
