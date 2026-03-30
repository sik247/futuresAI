import CryptoJS from "crypto-js";
import { AffiliateService } from "../core/affiliate.service";

class GateService extends AffiliateService {
  private baseUrl = "https://api.gateio.ws";

  private sign(method: string, path: string, query: string, body: string) {
    const apiKey = process.env.GATE_API_KEY!;
    const apiSecret = process.env.GATE_API_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const hashedBody = CryptoJS.SHA512(body).toString();
    const signString = `${method}\n${path}\n${query}\n${hashedBody}\n${timestamp}`;
    const signature = CryptoJS.HmacSHA512(signString, apiSecret).toString();

    return {
      KEY: apiKey,
      SIGN: signature,
      Timestamp: timestamp,
    };
  }

  async getAffiliateData(uid: string) {
    try {
      // Fetch last 30 days of commission history
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const path = "/api/v4/rebate/agency/commission_history";
      const query = `from=${thirtyDaysAgo}&to=${now}&limit=100`;
      const headers = this.sign("GET", path, query, "");

      const res = await fetch(`${this.baseUrl}${path}?${query}`, {
        headers: {
          KEY: headers.KEY,
          SIGN: headers.SIGN,
          Timestamp: headers.Timestamp,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const total = data.reduce(
          (sum: number, item: any) => sum + parseFloat(item.commission_amount || item.amount || "0"),
          0
        );
        return { ok: true, payback: total, entries: data.length, uid };
      }

      // If commission_history returns an error object, try transaction_history
      const altPath = "/api/v4/rebate/agency/transaction_history";
      const altQuery = `from=${thirtyDaysAgo}&to=${now}&limit=100`;
      const altHeaders = this.sign("GET", altPath, altQuery, "");

      const altRes = await fetch(`${this.baseUrl}${altPath}?${altQuery}`, {
        headers: {
          KEY: altHeaders.KEY,
          SIGN: altHeaders.SIGN,
          Timestamp: altHeaders.Timestamp,
          "Content-Type": "application/json",
        },
      });

      const altData = await altRes.json();

      if (Array.isArray(altData)) {
        const total = altData.reduce(
          (sum: number, item: any) => sum + parseFloat(item.commission_amount || item.amount || "0"),
          0
        );
        return { ok: true, payback: total, entries: altData.length, uid };
      }

      return {
        ok: true,
        payback: 0,
        entries: 0,
        uid,
        note: "No commission data available yet",
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const gateService = new GateService();
