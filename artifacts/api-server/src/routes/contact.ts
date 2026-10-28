import { SendContactMessageBody, SendContactMessageResponse } from "@workspace/api-zod";
import { db, contactMessagesTable } from "@workspace/db";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(contactMessagesTable).values({
    ...parsed.data,
    email: parsed.data.email.toLowerCase(),
  });
  res.status(201).json(SendContactMessageResponse.parse({ success: true }));
});

export default router;
