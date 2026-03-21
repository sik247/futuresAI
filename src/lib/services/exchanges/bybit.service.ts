import { AffiliateService } from "../core/affiliate.service";
import { RestClientV5 } from "bybit-api";

class ByBitService extends AffiliateService {
  private apiKey = process.env.BYBIT_API_KEY!;
  private apiSecret = process.env.BYBIT_API_SECRET!;
  private restClient = new RestClientV5({
    key: this.apiKey,
    secret: this.apiSecret,
  });

  async getAffiliateData(uid: string) {
    const response = await this.restClient.getAffiliateUserInfo({
      uid,
    });
    return response;
  }
}

export const byBitService = new ByBitService();
