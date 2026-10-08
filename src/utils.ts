export const formatCurrency = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }
  if (value >= 0.01) {
    return `$${value.toFixed(4)}`;
  }
  if (value > 0.000001) {
    return `$${value.toFixed(6)}`;
  }
  if (value > 0) {
    return `$${value.toFixed(8)}`;
  }
  return '$0.00';
};

export const formatNumber = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  if (value < 0.01 && value > 0) {
    return value.toFixed(6);
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

export const formatAddress = (address: string, chars: number = 4) => {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatRelativeTime = (timestamp: number) => {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 30) return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};
