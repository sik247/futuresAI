const USDT_CONTRACT_ERC20 = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT ERC-20 on Ethereum

export async function verifyEthTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number
): Promise<{ verified: boolean; from: string; amount: number; timestamp: number; error?: string }> {
  // Try Etherscan API first, then public RPC fallback
  const etherscanKey = process.env.ETHERSCAN_API_KEY || "";

  try {
    // Method 1: Etherscan transaction receipt
    const txUrl = etherscanKey
      ? `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${etherscanKey}`
      : `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}`;

    const txRes = await fetch(txUrl, { signal: AbortSignal.timeout(10000) });
    const txData = await txRes.json();

    if (!txData.result || txData.result === "null") {
      return { verified: false, from: "", amount: 0, timestamp: 0, error: "Transaction not found or not confirmed" };
    }

    const receipt = txData.result;
    const from = receipt.from || "";

    // Check logs for USDT Transfer event
    // Transfer(address,address,uint256) = 0xddf252ad...
    const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    for (const log of receipt.logs || []) {
      if (
        log.address?.toLowerCase() === USDT_CONTRACT_ERC20.toLowerCase() &&
        log.topics?.[0] === transferTopic
      ) {
        // topics[2] = to address (padded to 32 bytes)
        const toAddr = "0x" + (log.topics[2] || "").slice(26);
        if (toAddr.toLowerCase() !== expectedAddress.toLowerCase()) continue;

        // USDT has 6 decimals
        const rawAmount = parseInt(log.data, 16);
        const amount = rawAmount / 1e6;

        if (amount < expectedAmount * 0.99) {
          return { verified: false, from, amount, timestamp: 0, error: `Amount too low: ${amount} USDT (expected ${expectedAmount})` };
        }

        return { verified: true, from, amount, timestamp: Date.now() };
      }
    }

    // Method 2: Check if it's a direct ETH transfer or different token format
    // Try Etherscan token transfer API
    if (etherscanKey) {
      try {
        const tokenUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${expectedAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanKey}&page=1&offset=20`;
        const tokenRes = await fetch(tokenUrl, { signal: AbortSignal.timeout(10000) });
        const tokenData = await tokenRes.json();

        if (tokenData.result && Array.isArray(tokenData.result)) {
          const match = tokenData.result.find(
            (tx: any) =>
              tx.hash?.toLowerCase() === txHash.toLowerCase() &&
              tx.contractAddress?.toLowerCase() === USDT_CONTRACT_ERC20.toLowerCase() &&
              tx.to?.toLowerCase() === expectedAddress.toLowerCase()
          );

          if (match) {
            const amount = parseInt(match.value) / 1e6;
            if (amount >= expectedAmount * 0.99) {
              return { verified: true, from: match.from, amount, timestamp: parseInt(match.timeStamp) * 1000 };
            }
            return { verified: false, from: match.from, amount, timestamp: 0, error: `Amount too low: ${amount} USDT` };
          }
        }
      } catch {}
    }

    return { verified: false, from, amount: 0, timestamp: 0, error: "No matching USDT ERC-20 transfer to our wallet" };
  } catch (err) {
    return { verified: false, from: "", amount: 0, timestamp: 0, error: err instanceof Error ? err.message : "Verification failed" };
  }
}
