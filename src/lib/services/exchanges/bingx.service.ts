import { AffiliateService } from "../core/affiliate.service";
import CryptoJS from "crypto-js";
import axios from "axios";

class BingXService extends AffiliateService {
  host = "open-api.bingx.com";
  api = {
    uri: "/openApi/agent/v1/reward/commissionDataList",
    method: "GET",
    payload: {
      pageIndex: "1",
      pageSize: "100",
      startTime: "1702731524208",
      endTime: "1702731524208",
      uid: "1234567890",
      timestamp: "1702731524208",
    },
    protocol: "https",
  };
  async getAffiliateData(uid: string, date: Date) {
    const API_KEY = process.env.BINGX_API_KEY;
    const API_SECRET = process.env.BINGX_API_SECRET;

    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    this.api.payload.uid = uid;
    this.api.payload.timestamp = new Date().getTime().toString();
    this.api.payload.startTime = yesterday.getTime().toString();
    this.api.payload.endTime = today.getTime().toString();
    return await this.bingXOpenApiTest(
      this.api.protocol,
      this.host,
      this.api.uri,
      this.api.method,
      API_KEY,
      API_SECRET
    );
  }

  private async bingXOpenApiTest(
    protocol: any,
    host: any,
    path: any,
    method: any,
    API_KEY: any,
    API_SECRET: any
  ) {
    const timestamp = new Date().getTime();
    const sign = CryptoJS.enc.Hex.stringify(
      CryptoJS.HmacSHA256(this.getParameters(this.api, timestamp), API_SECRET)
    );
    const url =
      protocol +
      "://" +
      host +
      path +
      "?" +
      this.getParameters(this.api, timestamp, true) +
      "&signature=" +
      sign;

    const config = {
      method: method,
      url: url,
      headers: {
        "X-BX-APIKEY": API_KEY,
      },
      transformResponse: (resp: any) => {
        return resp;
      },
    };
    const resp = await axios(config);
    return resp;
  }

  private getParameters(API: any, timestamp: any, urlEncode?: any) {
    let parameters = "";
    for (const key in API.payload) {
      if (urlEncode) {
        parameters += key + "=" + encodeURIComponent(API.payload[key]) + "&";
      } else {
        parameters += key + "=" + API.payload[key] + "&";
      }
    }
    if (parameters) {
      parameters = parameters.substring(0, parameters.length - 1);
      parameters = parameters + "&timestamp=" + timestamp;
    } else {
      parameters = "timestamp=" + timestamp;
    }
    return parameters;
  }
}

export const bingXService = new BingXService();
