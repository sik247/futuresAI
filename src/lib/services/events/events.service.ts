import { CoreService } from "../core/core.service";

class EventsService extends CoreService {
  async getAll() {
    return this.db.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const eventsService = new EventsService();
