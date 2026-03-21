interface CoreWithdrawType {
  id: string;
  exchangeName: string;
  uid: string;
  amount: number;
  status?: string;
}

interface RefundType extends CoreWithdrawType {
  tradeIds: string[];
  exchangeAccountId: string;
}

interface WithdrawType extends CoreWithdrawType {}

interface ConfirmWithdrawType extends CoreWithdrawType {}
