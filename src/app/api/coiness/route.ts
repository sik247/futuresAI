"use server";

import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let limit = parseInt(searchParams.get("limit") || "10", 10);
  const lastWeek = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updatedAt = today.toISOString();
  console.log("updatedAt", updatedAt);

  // Validate and set default values for query parameters
  if (limit < 1 || limit > 40) {
    limit = 10; // Default value
  }

  const apiUrl = new URL(
    `https://api.coinness.com/feed/v1/partners/ko/news?exceptAd=false&apiKey=${process.env.COINESS_API_KEY}&updatedAt=${updatedAt}&limit=${limit}`
  );
  // apiUrl.searchParams.append("limit", limit.toString());
  // if (updatedAt) {
  //   apiUrl.searchParams.append("updatedAt", updatedAt);
  // }

  const { data } = await axios.get(apiUrl.toString(), {
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.COINESS_API_KEY!,
    },
  });

  console.log(data);

  return Response.json({ data });
}
