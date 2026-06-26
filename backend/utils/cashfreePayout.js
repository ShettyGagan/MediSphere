import { ENV } from "./env.js";

const IS_SANDBOX = ENV.CASHFREE_ENV !== "production";
const PAYOUT_BASE = IS_SANDBOX
  ? "https://payout-gamma.cashfree.com/payout/v1"
  : "https://payout-api.cashfree.com/payout/v1";

// ─ Token cache ─
let _bearerToken = null;
let _tokenExpiry = 0;

async function getPayoutToken() {
  if (_bearerToken && Date.now() < _tokenExpiry - 30_000) return _bearerToken;

  const res = await fetch(`${PAYOUT_BASE}/authorize`, {
    method: "POST",
    headers: {
      "X-Client-Id": ENV.CASHFREE_APP_ID,
      "X-Client-Secret": ENV.CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok || data.status !== "SUCCESS") {
    throw new Error(`Cashfree payout auth failed: ${data.message || JSON.stringify(data)}`);
  }

  _bearerToken = data.data.token;
  _tokenExpiry = Date.now() + 30 * 60 * 1_000; // 30-min TTL
  return _bearerToken;
}

async function payoutRequest(path, options = {}) {
  const token = await getPayoutToken();
  const res = await fetch(`${PAYOUT_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok || (data.status && data.status !== "SUCCESS")) {
    throw new Error(data.message || JSON.stringify(data));
  }
  return data;
}

// ─ Sandbox simulation (auto-resolves to SUCCESS after 3 s) ─
const _simulatedTransfers = new Map();

export async function validateBankAccount({ accountNumber, ifsc, accountName }) {
  if (IS_SANDBOX) return { accountValid: true, nameAtBank: accountName };

  const data = await payoutRequest("/validation/bankAccount", {
    method: "POST",
    body: JSON.stringify({ bank_account: accountNumber, ifsc, name: accountName }),
  });
  return {
    accountValid: data.data?.account_valid ?? false,
    nameAtBank: data.data?.account_holder_name ?? null,
  };
}

export async function initiatePayout({ transferId, amount, accountNumber, ifsc, accountName }) {
  if (IS_SANDBOX) {
    _simulatedTransfers.set(transferId, { status: "PROCESSING", utr: null });
    setTimeout(() => {
      _simulatedTransfers.set(transferId, { status: "SUCCESS", utr: `UTR${Date.now()}` });
    }, 3_000);
    return { cashfreeTransferId: `sim_${transferId}` };
  }

  const data = await payoutRequest("/transfers", {
    method: "POST",
    body: JSON.stringify({
      transferId,
      amount: amount.toString(),
      currency: "INR",
      purposeMessage: "Doctor consultation earnings payout",
      bankAccount: accountNumber,
      ifsc,
      name: accountName,
    }),
  });
  return { cashfreeTransferId: data.data?.referenceId ?? transferId };
}

export async function getPayoutStatus(transferId) {
  if (IS_SANDBOX) {
    const key = transferId.replace(/^sim_/, "");
    const sim = _simulatedTransfers.get(key);
    return { status: sim?.status ?? "PENDING", utr: sim?.utr ?? null };
  }

  const data = await payoutRequest(`/transfers?transferId=${transferId}`);
  const t = data.data?.transfer;
  return { status: t?.status ?? "PENDING", utr: t?.utr ?? null };
}
