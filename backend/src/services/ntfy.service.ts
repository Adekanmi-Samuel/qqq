export class NtfyService {
  async sendNotification(topic: string, title: string, message: string, tags?: string) {
    try {
      const url = `https://ntfy.sh/${topic}`;
      const headers: Record<string, string> = {
        "Title": title,
      };
      if (tags) {
        headers["Tags"] = tags;
      }
      
      await fetch(url, {
        method: "POST",
        body: message,
        headers
      });
      return true;
    } catch (error) {
      console.error("Failed to send ntfy notification:", error);
      return false;
    }
  }
}

export const ntfyService = new NtfyService();
