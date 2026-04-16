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

  private async gateGet(path: string, query: string) {
    const headers = this.sign("GET", path, query, "");
    const res = await fetch(`${this.baseUrl}${path}?${query}`, {
      headers: {
        KEY: headers.KEY,
        SIGN: headers.SIGN,
        Timestamp: headers.Timestamp,
        "Content-Type": "application/json",
      },
    });
    return res.json();
  }

  /**
   * Get commission data for a specific referred user (or all users if uid is empty).
   * Uses the PARTNER endpoint — the account is a partner referral, not an agency.
   */
  async getAffiliateData(uid: string) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const path = "/api/v4/rebate/partner/commission_history";
      const query = uid
        ? `user_id=${uid}&from=${thirtyDaysAgo}&to=${now}&limit=100`
        : `from=${thirtyDaysAgo}&to=${now}&limit=100`;

      const data = await this.gateGet(path, query);

      // Partner endpoint returns { total, list[] }
      if (data && Array.isArray(data.list)) {
        const total = data.list.reduce(
          (sum: number, item: any) => sum + parseFloat(item.commission_amount || "0"),
          0
        );
        return { ok: true, payback: total, entries: data.list.length, totalEntries: data.total, uid };
      }

      // Fallback: try transaction_history
      const altPath = "/api/v4/rebate/partner/transaction_history";
      const altQuery = uid
        ? `user_id=${uid}&from=${thirtyDaysAgo}&to=${now}&limit=100`
        : `from=${thirtyDaysAgo}&to=${now}&limit=100`;

      const altData = await this.gateGet(altPath, altQuery);

      if (altData && Array.isArray(altData.list)) {
        const total = altData.list.reduce(
          (sum: number, item: any) => sum + parseFloat(item.fee || "0"),
          0
        );
        return { ok: true, payback: total, entries: altData.list.length, totalEntries: altData.total, uid };
      }

      return { ok: true, payback: 0, entries: 0, uid, note: "No commission data available yet" };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /** Get all referred users under this partner account. */
  async getPartnerSubList() {
    try {
      const data = await this.gateGet("/api/v4/rebate/partner/sub_list", "limit=100");
      if (data && Array.isArray(data.list)) {
        return { ok: true, total: data.total, users: data.list };
      }
      return { ok: false, error: "Unexpected response" };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /** Get trading fees for a specific user from transaction history. */
  async getUserFees(uid: string) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const path = "/api/v4/rebate/partner/transaction_history";
      const query = `user_id=${uid}&from=${thirtyDaysAgo}&to=${now}&limit=100`;

      const data = await this.gateGet(path, query);

      if (data && Array.isArray(data.list)) {
        const totalFees = data.list.reduce(
          (sum: number, item: any) => sum + parseFloat(item.fee || "0"),
          0
        );
        const totalVolume = data.list.reduce(
          (sum: number, item: any) => sum + parseFloat(item.amount || "0"),
          0
        );
        return { ok: true, totalFees, totalVolume, entries: data.list.length, totalEntries: data.total, uid };
      }
      return { ok: true, totalFees: 0, totalVolume: 0, entries: 0, uid };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const gateService = new GateService();
