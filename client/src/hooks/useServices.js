import { useMemo } from 'react';
import useFetch from './useFetch.js';
import { DEFAULT_SERVICES } from '../utils/defaults.js';
import { money } from '../utils/format.js';

/** Services for public display (falls back to the built-in list if the API is unreachable). */
export default function useServices() {
  const svc = useFetch('/services', { initial: null });
  const pricing = useFetch('/pricing/public', { initial: [] });

  const services = svc.data && svc.data.length ? svc.data : svc.loading ? [] : DEFAULT_SERVICES;

  const priceFor = useMemo(() => {
    const rules = pricing.data || [];
    return (service) => {
      const r = rules.find((x) => x.service_id === service.id);
      if (!r) return null;
      const from = r.minimum_price ?? r.base_price;
      return from != null ? `From ${money(from, r.currency)}${r.notes ? ` · ${r.notes}` : ''}` : null;
    };
  }, [pricing.data]);

  return { services, loading: svc.loading, priceFor };
}
