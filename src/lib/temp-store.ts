// NOT FOR PRODUCTION USE - In-memory store.
// Data will be lost on server restarts and won't work with multiple server instances.
// Consider a proper database or distributed cache for production.

export const imageSubmissions = new Map<string, string>(); // submissionId -> imageDataUri

export function addSubmission(id: string, dataUri: string): void {
  imageSubmissions.set(id, dataUri);
  // Basic cleanup after 5 minutes to prevent memory leaks in long-running dev servers
  setTimeout(() => {
    if (imageSubmissions.has(id)) {
      imageSubmissions.delete(id);
      console.log(`Cleaned up image submission: ${id}`);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

export function getSubmission(id: string): string | undefined {
  const data = imageSubmissions.get(id);
  // Optional: Remove after retrieval to make it a one-time token
  // if (data) {
  //   imageSubmissions.delete(id);
  // }
  return data;
}
