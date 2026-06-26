import DoctorWallet from "../models/DoctorWallet.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import { initiatePayout, validateBankAccount, getPayoutStatus } from "../utils/cashfreePayout.js";

export const getWallet = async (req, res) => {
  try {
    const wallet = await DoctorWallet.findOneAndUpdate(
      { doctor_id: req.user._id },
      { $setOnInsert: { doctor_id: req.user._id } },
      { upsert: true, new: true }
    ).lean();

    const history = await WithdrawalRequest.find({ doctor_id: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ wallet, history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wallet." });
  }
};

export const saveBankAccount = async (req, res) => {
  const { account_number, ifsc_code, account_name, bank_name } = req.body;

  if (!account_number || !ifsc_code || !account_name) {
    return res.status(400).json({ message: "account_number, ifsc_code, and account_name are required." });
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc_code)) {
    return res.status(400).json({ message: "Invalid IFSC code format." });
  }

  try {
    let is_verified = false;
    try {
      const { accountValid } = await validateBankAccount({
        accountNumber: account_number,
        ifsc: ifsc_code,
        accountName: account_name,
      });
      is_verified = accountValid;
    } catch (_) {}

    const wallet = await DoctorWallet.findOneAndUpdate(
      { doctor_id: req.user._id },
      {
        $set: {
          bank_account: {
            account_number,
            ifsc_code: ifsc_code.toUpperCase(),
            account_name,
            bank_name: bank_name ?? "",
            is_verified,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Bank account saved.", wallet });
  } catch (err) {
    res.status(500).json({ message: "Failed to save bank account." });
  }
};

export const requestWithdrawal = async (req, res) => {
  const withdrawAmount = Number(req.body.amount);

  if (!withdrawAmount || withdrawAmount < 100) {
    return res.status(400).json({ message: "Minimum withdrawal amount is ₹100." });
  }

  try {
    const wallet = await DoctorWallet.findOne({ doctor_id: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found. No earnings yet." });
    }
    if (!wallet.bank_account?.account_number) {
      return res.status(400).json({ message: "Please add a bank account before withdrawing." });
    }
    if (wallet.available_balance < withdrawAmount) {
      return res.status(400).json({ message: `Insufficient balance. Available: ₹${wallet.available_balance}` });
    }

    // Atomically debit wallet (balance check in query prevents race conditions)
    const updated = await DoctorWallet.findOneAndUpdate(
      { doctor_id: req.user._id, available_balance: { $gte: withdrawAmount } },
      { $inc: { available_balance: -withdrawAmount, total_withdrawn: withdrawAmount } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({ message: "Insufficient balance or concurrent withdrawal detected." });
    }

    const transferId = `payout_${req.user._id}_${Date.now()}`;
    const withdrawal = await WithdrawalRequest.create({
      doctor_id: req.user._id,
      amount: withdrawAmount,
      status: "PENDING",
      bank_snapshot: {
        account_number: wallet.bank_account.account_number,
        ifsc_code: wallet.bank_account.ifsc_code,
        account_name: wallet.bank_account.account_name,
        bank_name: wallet.bank_account.bank_name,
      },
    });

    try {
      const { cashfreeTransferId } = await initiatePayout({
        transferId,
        amount: withdrawAmount,
        accountNumber: wallet.bank_account.account_number,
        ifsc: wallet.bank_account.ifsc_code,
        accountName: wallet.bank_account.account_name,
      });

      await WithdrawalRequest.findByIdAndUpdate(withdrawal._id, {
        cashfree_transfer_id: cashfreeTransferId,
        status: "PROCESSING",
      });

      res.json({
        message: "Withdrawal initiated. Funds will be credited within 24 hours.",
        withdrawal: { ...withdrawal.toObject(), status: "PROCESSING", cashfree_transfer_id: cashfreeTransferId },
        wallet: updated,
      });
    } catch (payoutErr) {
      // Rollback wallet debit if Cashfree call fails
      await DoctorWallet.findOneAndUpdate(
        { doctor_id: req.user._id },
        { $inc: { available_balance: withdrawAmount, total_withdrawn: -withdrawAmount } }
      );
      await WithdrawalRequest.findByIdAndUpdate(withdrawal._id, {
        status: "FAILED",
        failure_reason: payoutErr.message,
      });
      res.status(502).json({ message: `Payout service error: ${payoutErr.message}` });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to process withdrawal." });
  }
};

export const getWithdrawalStatus = async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findOne({
      _id: req.params.id,
      doctor_id: req.user._id,
    });

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found." });
    }

    if (withdrawal.status === "PROCESSING" && withdrawal.cashfree_transfer_id) {
      try {
        const { status, utr } = await getPayoutStatus(withdrawal.cashfree_transfer_id);
        const mapped =
          status === "SUCCESS" || status === "REVERSED" || status === "FAILED"
            ? status === "REVERSED" ? "FAILED" : status
            : "PROCESSING";

        if (mapped !== withdrawal.status || utr) {
          await WithdrawalRequest.findByIdAndUpdate(withdrawal._id, { status: mapped, utr });
          withdrawal.status = mapped;
          withdrawal.utr = utr;
        }
      } catch (_) {}
    }

    res.json({ withdrawal });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch withdrawal status." });
  }
};
