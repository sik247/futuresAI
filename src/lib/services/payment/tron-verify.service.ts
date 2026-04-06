const TRONSCAN_API = "https://apilist.tronscanapi.com/api";
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // USDT TRC20 contract

export async function verifyTronTransaction(
  txid: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<{ verified: boolean; from: string; amount: number; timestamp: number; error?: string }> {
  try {
    const res = await fetch(`${TRONSCAN_API}/transaction-info?hash=${txid}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { verified: false, from: "", amount: 0, timestamp: 0, error: "TronScan API error" };

    const data = await res.json();

    // Check if confirmed
    if (!data.confirmed) return { verified: false, from: "", amount: 0, timestamp: 0, error: "Transaction not confirmed" };

    // Check TRC20 transfers
    const trc20Transfers = data.trc20TransferInfo || data.tokenTransferInfo || [];
    const usdtTransfer = trc20Transfers.find((t: any) =>
      t.contract_address === USDT_CONTRACT &&
      t.to_address?.toLowerCase() === expectedAddress.toLowerCase()
    );

    if (!usdtTransfer) {
      // Also check trigger_info for smart contract calls
      if (data.contractData?.contract_address === USDT_CONTRACT) {
        const toAddr = data.contractData?.to_address || "";
        const amount = parseInt(data.contractData?.amount || "0") / 1e6;
        if (toAddr.toLowerCase() === expectedAddress.toLowerCase() && amount >= expectedAmount * 0.99) {
          return { verified: true, from: data.ownerAddress || "", amount, timestamp: data.timestamp || 0 };
        }
      }
      return { verified: false, from: "", amount: 0, timestamp: 0, error: "No matching USDT transfer to our wallet" };
    }

    const amount = parseInt(usdtTransfer.amount_str || "0") / 1e6;
    if (amount < expectedAmount * 0.99) {
      return { verified: false, from: usdtTransfer.from_address || "", amount, timestamp: data.timestamp || 0, error: `Amount too low: ${amount} USDT (expected ${expectedAmount})` };
    }

    return { verified: true, from: usdtTransfer.from_address || "", amount, timestamp: data.timestamp || 0 };
  } catch (err) {
    return { verified: false, from: "", amount: 0, timestamp: 0, error: err instanceof Error ? err.message : "Verification failed" };
  }
}
