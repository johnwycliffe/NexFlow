import { useMemo } from 'react';
import { useERP } from '../context/ERPContext';

export const useMRP = () => {
  const { calculateMRP, simulateAutoRequisition } = useERP();

  const mrpData = useMemo(() => {
    return calculateMRP();
  }, [calculateMRP]);

  const criticalShortages = useMemo(() => {
    return mrpData.filter((item) => item.status === 'CRITICAL_SHORTAGE');
  }, [mrpData]);

  const reorderRecommended = useMemo(() => {
    return mrpData.filter((item) => item.status === 'REORDER_RECOMMENDED');
  }, [mrpData]);

  return {
    mrpData,
    criticalShortages,
    reorderRecommended,
    simulateAutoRequisition
  };
};

