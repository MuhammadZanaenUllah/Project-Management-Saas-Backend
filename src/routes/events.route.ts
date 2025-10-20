import { Router, Request, Response } from "express";
import { subscribeWorkspace } from "../utils/sse";

const eventsRoutes = Router();

// SSE subscription per workspace
eventsRoutes.get("/workspace/:workspaceId", (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  // Authenticate is handled at app level via middleware chain
  subscribeWorkspace(workspaceId, req, res);
});

export default eventsRoutes;