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
      // Verify API access
      const uidUrl = this.sign("GET", "/v2/user/uid", {});
      const uidRes = await fetch(uidUrl);
      const uidData = await uidRes.json();

      if (uidData.code !== 200 && uidData.status !== "ok") {
        return { ok: false, error: uidData.message || uidData["err-msg"] || "API error" };
      }

      // Try the v2 ledger endpoint first (has more detail and may contain user info)
      const ledgerUrl = this.sign("GET", "/v2/account/ledger", {
        accountId: String(uid),
        transactTypes: "rebate",
        limit: "100",
      });
      const ledgerRes = await fetch(ledgerUrl);
      const ledgerData = await ledgerRes.json();

      if (ledgerData.code === 200 && Array.isArray(ledgerData.data)) {
        const totalPayback = ledgerData.data.reduce(
          (sum: number, item: any) => sum + Math.abs(parseFloat(item.transactAmt || "0")),
          0
        );
        console.log(`[htx] Ledger for uid=${uid}: ${ledgerData.data.length} entries, total=$${totalPayback.toFixed(2)}`);
        return { ok: true, payback: totalPayback, uid, entries: ledgerData.data.length };
      }

      // Fallback: fetch account history with rebate filter
      const accountUrl = this.sign("GET", "/v1/account/accounts", {});
      const accountRes = await fetch(accountUrl);
      const accountData = await accountRes.json();

      if (accountData.status !== "ok" || !accountData.data?.length) {
        return { ok: true, payback: 0, uid, note: "No accounts found" };
      }

      const accountId = accountData.data[0].id;

      const historyUrl = this.sign("GET", "/v1/account/history", {
        "account-id": String(accountId),
        "transact-types": "rebate",
        size: "100",
      });
      const historyRes = await fetch(historyUrl);
      const historyData = await historyRes.json();

      let totalPayback = 0;
      if (historyData.status === "ok" && Array.isArray(historyData.data)) {
        totalPayback = historyData.data.reduce(
          (sum: number, item: any) => sum + Math.abs(parseFloat(item["transact-amt"] || "0")),
          0
        );
        console.log(`[htx] History for uid=${uid}: ${historyData.data.length} entries, total=$${totalPayback.toFixed(2)}, sample:`, JSON.stringify(historyData.data[0] || {}).slice(0, 200));
      }

      return {
        ok: true,
        payback: totalPayback,
        uid,
        accountId,
        entries: historyData.data?.length || 0,
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}

export const htxService = new HtxService();
