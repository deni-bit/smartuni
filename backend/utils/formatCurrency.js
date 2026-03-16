// Format number as Tanzanian Shilling
const formatTZS = (amount) => {
  return `TZS ${Number(amount).toLocaleString('en-TZ')}`;
};

// Format for API responses — adds formatted string alongside raw number
const withTZS = (amount) => ({
  raw:       amount,
  formatted: formatTZS(amount),
  currency:  'TZS',
});

module.exports = { formatTZS, withTZS };