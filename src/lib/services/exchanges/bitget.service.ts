import { AffiliateService } from "../core/affiliate.service";
import { RestClientV2 } from "bitget-api";
class RestClient extends RestClientV2 {
  constructor(options: any) {
    super(options);
  }
  async getCommission(uid: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startTime = yesterday.getTime();
    const endTime = today.getTime();

    // Use v2 endpoint (v1 was deprecated Nov 2025)
    const requestUrl = `/api/v2/broker/customer-commissions?uid=${uid}&startTime=${startTime}&endTime=${endTime}&limit=100`;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.getPrivate(requestUrl));
      }, 1000);
    });
  }
}

interface IAffiliateData {
  uid: string;
  payback: number;
  date: Date;
}
class BitgetService extends AffiliateService {
  private apiKey = process.env.BITGET_API_KEY!;
  private apiSecret = process.env.BITGET_API_SECRET!;
  private apiPass = process.env.BITGET_API_PASS!;
  private restClient = new RestClient({
    apiKey: this.apiKey,
    apiSecret: this.apiSecret,
    apiPass: this.apiPass,
  });

  async getAffiliateData(uid: string): Promise<IAffiliateData[]> {
    const { data } = await this.restClient.getCommission(uid);

    return data.commissionList.map(
      (item: { uid: string; rebateAmount: string; date: string }) => {
        console.log("item:", new Date(Number(item.date)));
        return {
          uid: item.uid,
          payback: parseFloat(item.rebateAmount),
          date: new Date(Number(item.date)),
        };
      }
    );
  }
}

export const bitgetService = new BitgetService();
