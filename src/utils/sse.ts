import { Request, Response } from "express";

// Maintain SSE clients per workspace
const workspaceClients: Map<string, Set<Response>> = new Map();

export type WorkspaceEvent = {
  type: string;
  payload: any;
};

export const subscribeWorkspace = (
  workspaceId: string,
  req: Request,
  res: Response
) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.status(200);

  // Initial comment to establish stream
  res.write(": connected\n\n");

  // Add client to set
  if (!workspaceClients.has(workspaceId)) {
    workspaceClients.set(workspaceId, new Set());
  }
  const clients = workspaceClients.get(workspaceId)!;
  clients.add(res);

  // Cleanup when client disconnects
  req.on("close", () => {
    const current = workspaceClients.get(workspaceId);
    if (current) {
      current.delete(res);
      if (current.size === 0) {
        workspaceClients.delete(workspaceId);
      }
    }
  });
};

export const broadcastToWorkspace = (
  workspaceId: string,
  event: WorkspaceEvent
) => {
  const clients = workspaceClients.get(workspaceId);
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify(event);
  for (const res of clients) {
    try {
      // Optionally include an event name
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${data}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
};