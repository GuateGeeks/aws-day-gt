export type PhotoModerationResult = { status: "manual_review"; source: "staff_queue" };

export interface PhotoModerationAdapter {
  inspect(input: { storagePath: string; contentType: string; bytes: number }): Promise<PhotoModerationResult>;
}

// No automatic provider is configured. Every valid Challenge photo enters the existing staff queue.
export const photoModeration: PhotoModerationAdapter = {
  async inspect() { return { status: "manual_review", source: "staff_queue" }; }
};
