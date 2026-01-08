export const formatLastUpdate = (date) => {
  if (!date) return "Never";
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return date.toLocaleTimeString();
};

export const timeFormatter = (value) => {
  if (!Number.isFinite(value)) return '';
  return new Date(value).toLocaleString('en-AU', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const parseDateInput = (value) => {
  if (!value) return undefined;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
};

export const parseNumberInput = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export const roundDomainToWhole = (domain) => {
  const [min, max] = domain;
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);
  if (!hasMin || !hasMax) return domain;

  if (min === max) {
    const value = Math.round(min);
    return [value - 1, value + 1];
  }

  return [Math.floor(min), Math.ceil(max)];
};
