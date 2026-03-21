import axios from "axios";
import { AffiliateService } from "../core/affiliate.service";
import CryptoJS from "crypto-js";

class OkxService extends AffiliateService {
  async getAffiliateData(uid: string) {
    const apikey = process.env.OKX_API_KEY!;
    const secretkey = process.env.OKX_API_SECRET!;
    const passPhrase = "Cryptox01!";

    const timestamp = new Date().toISOString();

    const signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(
        timestamp + "GET" + `/api/v5/affiliate/invitee/detail?uid=${uid}`,
        secretkey
      )
    );

    const headers = {
      "OK-ACCESS-KEY": apikey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passPhrase,
      "Content-Type": "application/json",
    };

    const response = await axios.get(
      `https://www.okx.com/api/v5/affiliate/invitee/detail?uid=${uid}`,
      { headers }
    );

    console.log(response.data);

    const code = response.data.code;
    if (code !== "0") {
      return {
        ok: false,
      };
    }

    const totalCommission = response.data.data[0].totalCommission;
    return {
      ok: true,
      payback: (totalCommission as number) * 0.9,
    };
  }
}

export const okxService = new OkxService();
