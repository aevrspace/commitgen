import { WebhookEvent } from "@/models/WebhookEvent";
import { logger } from "@untools/logger";

type ProcessingStatus = "received" | "processing" | "processed" | "failed";

interface HistoryEntry {
  status: string;
  message: string;
  timestamp?: Date;
}

interface CreateEventParams {
  provider: "paystack" | "100pay";
  eventType: string;
  payload: unknown;
  initialStatus?: ProcessingStatus;
  initialHistory?: HistoryEntry[];
}

interface UpdateEventParams {
  status?: ProcessingStatus;
  historyEntry?: HistoryEntry;
  relatedTransactionId?: string;
}

/**
 * WebhookEventLogger Service
 *
 * A resilient, non-blocking service for logging webhook events.
 * All operations are wrapped in try-catch and use setImmediate
 * to avoid blocking the main request flow.
 */
class WebhookEventLogger {
  private eventId: string | null = null;
  private pendingUpdates: UpdateEventParams[] = [];

  /**
   * Creates a webhook event log entry.
   * This is NON-BLOCKING - it uses setImmediate to defer the DB operation.
   * Failures are logged but do not throw.
   */
  async create(params: CreateEventParams): Promise<string | null> {
    const {
      provider,
      eventType,
      payload,
      initialStatus = "processing",
      initialHistory = [{ status: "processing", message: "Webhook received" }],
    } = params;

    return new Promise((resolve) => {
      setImmediate(async () => {
        try {
          const event = await WebhookEvent.create({
            provider,
            eventType,
            payload,
            processingStatus: initialStatus,
            processingHistory: initialHistory,
          });
          this.eventId = event._id.toString();
          logger?.info(`[WebhookEventLogger] Event created: ${this.eventId}`);

          // Process any pending updates that were queued before creation completed
          await this.flushPendingUpdates();

          resolve(this.eventId);
        } catch (error) {
          logger?.error("[WebhookEventLogger] Failed to create event:", error);
          resolve(null);
        }
      });
    });
  }

  /**
   * Creates a webhook event synchronously (blocking).
   * Use this when you absolutely need the event ID immediately.
   * Failures are caught and logged.
   */
  async createSync(params: CreateEventParams): Promise<string | null> {
    const {
      provider,
      eventType,
      payload,
      initialStatus = "processing",
      initialHistory = [{ status: "processing", message: "Webhook received" }],
    } = params;

    try {
      const event = await WebhookEvent.create({
        provider,
        eventType,
        payload,
        processingStatus: initialStatus,
        processingHistory: initialHistory,
      });
      this.eventId = event._id.toString();
      logger?.info(
        `[WebhookEventLogger] Event created (sync): ${this.eventId}`
      );
      return this.eventId;
    } catch (error) {
      logger?.error(
        "[WebhookEventLogger] Failed to create event (sync):",
        error
      );
      return null;
    }
  }

  /**
   * Updates the webhook event status and adds a history entry.
   * This is NON-BLOCKING - it uses setImmediate to defer the DB operation.
   * If the event hasn't been created yet, updates are queued.
   */
  update(params: UpdateEventParams): void {
    if (!this.eventId) {
      // Queue the update for when the event is created
      this.pendingUpdates.push(params);
      return;
    }

    setImmediate(async () => {
      try {
        await this.applyUpdate(params);
      } catch (error) {
        logger?.error("[WebhookEventLogger] Failed to update event:", error);
      }
    });
  }

  /**
   * Updates the webhook event synchronously (blocking).
   * Use this when you need to ensure the update is complete before responding.
   */
  async updateSync(params: UpdateEventParams): Promise<void> {
    if (!this.eventId) {
      logger?.warn("[WebhookEventLogger] Cannot update: event not created yet");
      return;
    }

    try {
      await this.applyUpdate(params);
    } catch (error) {
      logger?.error(
        "[WebhookEventLogger] Failed to update event (sync):",
        error
      );
    }
  }

  /**
   * Marks the event as successfully processed.
   */
  success(message: string = "Webhook processed successfully"): void {
    this.update({
      status: "processed",
      historyEntry: { status: "success", message },
    });
  }

  /**
   * Marks the event as failed.
   */
  fail(message: string = "Webhook processing failed"): void {
    this.update({
      status: "failed",
      historyEntry: { status: "error", message },
    });
  }

  /**
   * Marks the event as skipped (e.g., duplicate or ignored event type).
   */
  skip(message: string = "Event skipped"): void {
    this.update({
      status: "processed",
      historyEntry: { status: "skipped", message },
    });
  }

  /**
   * Links the event to a WalletTransaction.
   */
  linkTransaction(transactionId: string): void {
    this.update({ relatedTransactionId: transactionId });
  }

  /**
   * Gets the current event ID (may be null if creation failed or is pending).
   */
  getEventId(): string | null {
    return this.eventId;
  }

  // --- Private Methods ---

  private async applyUpdate(params: UpdateEventParams): Promise<void> {
    if (!this.eventId) return;

    const updateOps: Record<string, unknown> = {};
    const pushOps: Record<string, unknown> = {};

    if (params.status) {
      updateOps.processingStatus = params.status;
    }

    if (params.relatedTransactionId) {
      updateOps.relatedTransactionId = params.relatedTransactionId;
    }

    if (params.historyEntry) {
      pushOps.processingHistory = {
        ...params.historyEntry,
        timestamp: new Date(),
      };
    }

    const query: Record<string, unknown> = {};
    if (Object.keys(updateOps).length > 0) {
      query.$set = updateOps;
    }
    if (Object.keys(pushOps).length > 0) {
      query.$push = pushOps;
    }

    if (Object.keys(query).length > 0) {
      await WebhookEvent.findByIdAndUpdate(this.eventId, query);
      logger?.debug(`[WebhookEventLogger] Event updated: ${this.eventId}`);
    }
  }

  private async flushPendingUpdates(): Promise<void> {
    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift();
      if (update) {
        try {
          await this.applyUpdate(update);
        } catch (error) {
          logger?.error(
            "[WebhookEventLogger] Failed to apply pending update:",
            error
          );
        }
      }
    }
  }
}

/**
 * Factory function to create a new WebhookEventLogger instance.
 * Use a new instance for each webhook request.
 */
export const createWebhookEventLogger = (): WebhookEventLogger => {
  return new WebhookEventLogger();
};

export type {
  WebhookEventLogger,
  CreateEventParams,
  UpdateEventParams,
  HistoryEntry,
};
