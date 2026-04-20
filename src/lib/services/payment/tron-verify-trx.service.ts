const TRONSCAN_API = "https://apilist.tronscanapi.com/api";

// Native TRX transfers (contractType 1 = TransferContract) verify via TronScan.
// 1 TRX = 1e6 SUN. We tolerate 0.5 TRX slack to account for network fees
// between what the user thought they sent and what landed.
const AMOUNT_SLACK_TRX = 0.5;

export interface TrxVerifyResult {
  verified: boolean;
  from: string;
  amount: number;
  timestamp: number;
  error?: string;
}

export async function verifyTronNativeTransfer(
  txid: string,
  expectedAddress: string,
  expectedTrxAmount: number,
): Promise<TrxVerifyResult> {
  try {
    const res = await fetch(`${TRONSCAN_API}/transaction-info?hash=${txid}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { verified: false, from: "", amount: 0, timestamp: 0, error: "TronScan API error" };
    }

    const data = await res.json();

    if (!data.confirmed) {
      return { verified: false, from: "", amount: 0, timestamp: 0, error: "Transaction not confirmed" };
    }

    // Reject TRC-20 / smart-contract calls — this verifier is native-TRX only.
    // TRC-20 transfers populate contract_address on contractData; native transfers do not.
    if (data.contractData?.contract_address) {
      return {
        verified: false,
        from: "",
        amount: 0,
        timestamp: 0,
        error: "TRC-20 transfer detected. Use the USDT payment form instead.",
      };
    }

    // Confirm it's a TransferContract (contractType 1 in TronScan payloads)
    const isNativeTransfer = data.contractType === 1 || data.contractType === "1";
    if (!isNativeTransfer) {
      return {
        verified: false,
        from: "",
        amount: 0,
        timestamp: 0,
        error: `Unsupported contract type for native TRX transfer (got ${data.contractType}).`,
      };
    }

    const toAddr = (data.contractData?.to_address || data.toAddress || "").toString();
    const fromAddr = (data.contractData?.owner_address || data.ownerAddress || "").toString();
    const sunAmount = Number(data.contractData?.amount ?? data.amount ?? 0);
    const trxAmount = sunAmount / 1e6;

    if (toAddr.toLowerCase() !== expectedAddress.toLowerCase()) {
      return {
        verified: false,
        from: fromAddr,
        amount: trxAmount,
        timestamp: data.timestamp || 0,
        error: "Transfer destination does not match our wallet.",
      };
    }

    if (trxAmount + AMOUNT_SLACK_TRX < expectedTrxAmount) {
      return {
        verified: false,
        from: fromAddr,
        amount: trxAmount,
        timestamp: data.timestamp || 0,
        error: `Amount too low: ${trxAmount} TRX (expected ${expectedTrxAmount}).`,
      };
    }

    return {
      verified: true,
      from: fromAddr,
      amount: trxAmount,
      timestamp: data.timestamp || 0,
    };
  } catch (err) {
    return {
      verified: false,
      from: "",
      amount: 0,
      timestamp: 0,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }
}
