export function formatPrice(value, options = {}) {
    const { currency = '$', maxDecimals = 8 } = options;
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
        return `${currency}0.00`;
    }

    if (amount === 0) {
        return `${currency}0.00`;
    }

    if (Math.abs(amount) >= 1) {
        return `${currency}${amount.toFixed(2)}`;
    }

    return `${currency}${amount
        .toFixed(maxDecimals)
        .replace(/0+$/, '')
        .replace(/\.$/, '')}`;
}

export function formatNumberPrecise(value, maxDecimals = 8) {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) {
        return '0.00';
    }

    if (amount === 0) {
        return '0.00';
    }

    if (Math.abs(amount) >= 1) {
        return amount.toFixed(2);
    }

    return amount
        .toFixed(maxDecimals)
        .replace(/0+$/, '')
        .replace(/\.$/, '');
}