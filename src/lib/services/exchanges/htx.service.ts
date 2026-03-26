import CryptoJS from "crypto-js";
import { AffiliateService } from "../core/affiliate.service";

class HtxService extends AffiliateService {
  private baseUrl = "https://api.huobi.pro";

  private sign(method: string, path: string, params: Record<string, string>) {
    const apiKey = process.env.HTX_API_KEY!;
    const apiSecret = process.env.HTX_API_SECRET!;
    const timestamp = new Date().toISOString().slice(0, 19);

    const sortedParams = {
      AccessKeyId: apiKey,
      SignatureMethod: "HmacSHA256",
      SignatureVersion: "2",
      Timestamp: timestamp,
      ...params,
    };

    const query = Object.keys(sortedParams)
      .sort()
      .map((k) => `${k}=${encodeURIComponent(sortedParams[k as keyof typeof sortedParams])}`)
      .join("&");

    const payload = `${method}\napi.huobi.pro\n${path}\n${query}`;
    const signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(payload, apiSecret)
    );

    return `${this.baseUrl}${path}?${query}&Signature=${encodeURIComponent(signature)}`;
  }

  async getAffiliateData(uid: string) {
    try {
      const url = this.sign("GET", "/v2/user/uid", {});
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 200 && data.status !== "ok") {
        return { ok: false, error: data.message || data["err-msg"] || "API error" };
      }

      // Try to get rebate data
      const rebateUrl = this.sign("GET", "/v2/account/accounts", {});
      const rebateRes = await fetch(rebateUrl);
      const rebateData = await rebateRes.json();

      return {
        ok: true,
        payback: 0, // HTX rebate API needs specific broker endpoint
        uid,
        accounts: rebateData.data || [],
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const htxService = new HtxService();
