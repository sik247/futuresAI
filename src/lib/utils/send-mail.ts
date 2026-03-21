import axios from "axios";

export async function sendVerificationEmail(email: string, code: string) {
  const data = {
    from: "CryptoX <no-reply@cryptoxcorp.com>",
    to: email,
    subject: "[크립토엑스] 메일 인증번호입니다.",
    template: "emailverification",
    "h:X-Mailgun-Variables": JSON.stringify({ code }),
  };

  try {
    const response = await axios.post(
      "https://api.mailgun.net/v3/cryptoxcorp.com/messages",
      data,
      {
        auth: {
          username: "api",
          password: process.env.MAILGUN_API_KEY ?? "",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
