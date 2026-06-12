import { ENV } from "./env.js";

const CASHFREE_BASE =
    ENV.CASHFREE_ENV === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

const cashfreeHeaders = {
    "x-api-version": "2023-08-01",
    "x-client-id": ENV.CASHFREE_APP_ID,
    "x-client-secret": ENV.CASHFREE_SECRET_KEY,
    "Content-Type": "application/json",
};


const request = async (path, options = {}) => {
    const response = await fetch(`${CASHFREE_BASE}${path}`, { ...options, headers: cashfreeHeaders });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
    }
    return data;
};


export const createCashfreeOrder = ({ orderId, amount, patient }) =>
    request("/orders", {
        method: "POST",
        body: JSON.stringify({
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: patient._id.toString(),
                customer_name: patient.name,
                customer_email: patient.email,
                customer_phone: patient.phone || "9999999999",
            },
            order_meta: {
                return_url: `${ENV.CLIENT_URL}/dashboard/appointments?cf_order_id={order_id}`,
            },
        }),
    });


export const getCashfreeOrder = (orderId) =>
    request(`/orders/${orderId}`);

export const getCashfreePayments = async (orderId) => {
    const data = await request(`/orders/${orderId}/payments`);
    return Array.isArray(data) ? data : [];
};


