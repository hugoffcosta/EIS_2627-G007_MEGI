/* Agregações puras para os dados fictícios do Sprint 1. Não fazem pedidos de rede. */
(function (root) {
  'use strict';
  const defaultData = typeof module !== 'undefined' && module.exports ? require('./dados.js') : root.TrustPortData;
  const countBy = (rows, key) => rows.reduce((out, row) => {
    const value = typeof key === 'function' ? key(row) : row[key];
    out[value] = (out[value] || 0) + 1;
    return out;
  }, {});
  const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
  const percentage = (part, total) => total ? Math.round(part / total * 1000) / 10 : 0;
  function getHomepageMetrics(data = defaultData) {
    return {
      completedDeliveries: data.orders.filter(order => order.status === 'completed').length,
      approvedCarriers: data.carriers.filter(carrier => carrier.approvalStatus === 'approved').length,
      registeredClients: data.users.filter(user => user.role === 'client').length
    };
  }
  function getDocumentAlerts(data = defaultData) {
    const today = data.meta.referenceDate.slice(0, 10);
    const dayMs = 86400000;
    return data.vehicles.flatMap(vehicle => ['insurance', 'inspection'].flatMap(type => {
      const expiresOn = vehicle[type + 'ExpiresOn'];
      if (!expiresOn) return [];
      const daysRemaining = Math.round((Date.parse(expiresOn + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / dayMs);
      if (daysRemaining > 30) return [];
      return [{ vehicleId: vehicle.id, carrierId: vehicle.carrierId, documentType: type, expiresOn, daysRemaining, severity: daysRemaining < 0 ? 'expired' : 'expiring_soon' }];
    }));
  }
  // from/to select an order cohort by createdAt, inclusive calendar dates (UTC).
  // Other operational counts (users, fleet, pending approvals) remain a full snapshot.
  function getAdminDashboard(data = defaultData, { from, to } = {}) {
    function boundary(value, end) {
      if (value === undefined) return end ? Infinity : -Infinity;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Use uma data válida no formato YYYY-MM-DD.');
      return Date.parse(value + (end ? 'T23:59:59.999Z' : 'T00:00:00Z'));
    }
    const start = boundary(from, false), end = boundary(to, true);
    if (start > end) throw new Error('A data inicial não pode ser posterior à final.');
    const orders = data.orders.filter(order => Date.parse(order.createdAt) >= start && Date.parse(order.createdAt) <= end);
    const orderIds = new Set(orders.map(order => order.id));
    const completed = orders.filter(order => order.status === 'completed');
    const cancelled = orders.filter(order => order.status === 'cancelled');
    const payments = data.payments.filter(payment => orderIds.has(payment.orderId));
    const reviews = data.reviews.filter(review => orderIds.has(review.orderId));
    const users = new Map(data.users.map(user => [user.id, user]));
    const cities = new Map(data.cities.map(city => [city.id, city]));
    const vehicles = new Map(data.vehicles.map(vehicle => [vehicle.id, vehicle]));
    const referenceTime = Date.parse(data.meta.referenceDate);
    const onTime = completed.filter(order => Date.parse(order.completedAt) <= Date.parse(order.expectedDeliveryAt));
    const lateActiveOrders = orders.filter(order => order.status === 'in_progress' && Date.parse(order.expectedDeliveryAt) < referenceTime);
    const documentAlerts = getDocumentAlerts(data);
    const expiredVehicles = new Set(documentAlerts.filter(alert => alert.severity === 'expired').map(alert => alert.vehicleId));
    const busyCarriers = new Set(data.orders.filter(order => order.status === 'in_progress').map(order => order.carrierId));
    const eligibleCarrierIds = new Set(data.carriers.filter(carrier => carrier.approvalStatus === 'approved').map(carrier => carrier.id));
    const monthlyByCreation = Array.from({ length: 10 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, total: 0, completed: 0, initiated: 0, in_progress: 0, cancelled: 0 }));
    // Include additional months automatically if the sample is extended.
    const monthly = new Map(monthlyByCreation.map(row => [row.month, row]));
    for (const order of orders) {
      const month = order.createdAt.slice(0, 7);
      if (!monthly.has(month)) monthly.set(month, { month, total: 0, completed: 0, initiated: 0, in_progress: 0, cancelled: 0 });
      monthly.get(month).total++;
      monthly.get(month)[order.status]++;
    }
    const carrierRanking = data.carriers.map(carrier => {
      const deliveries = completed.filter(order => order.carrierId === carrier.id);
      const ratings = reviews.filter(review => review.carrierId === carrier.id);
      const punctual = deliveries.filter(order => Date.parse(order.completedAt) <= Date.parse(order.expectedDeliveryAt));
      return { carrierId: carrier.id, name: users.get(carrier.userId).name, completedDeliveries: deliveries.length, onTimeRate: percentage(punctual.length, deliveries.length), averageRating: ratings.length ? Math.round(sum(ratings, 'rating') / ratings.length * 100) / 100 : null, reviewCount: ratings.length, completedTransportValueCents: sum(deliveries, 'quotedAmountCents') };
    }).sort((a, b) => b.completedDeliveries - a.completedDeliveries || a.carrierId.localeCompare(b.carrierId));
    const topClients = data.users.filter(user => user.role === 'client').map(user => {
      const clientOrders = orders.filter(order => order.clientId === user.id);
      return { clientId: user.id, name: user.name, orderCount: clientOrders.length, completedDeliveries: clientOrders.filter(order => order.status === 'completed').length, quotedValueCents: sum(clientOrders, 'quotedAmountCents') };
    }).sort((a, b) => b.orderCount - a.orderCount || a.clientId.localeCompare(b.clientId));
    const monthlyCash = {};
    for (const payment of payments) {
      for (const [dateKey, amountKey, bucket] of [['paidAt', 'amountCents', 'collectedCents'], ['refundedAt', 'refundedAmountCents', 'refundedCents']]) {
        if (!payment[dateKey]) continue;
        const month = payment[dateKey].slice(0, 7);
        monthlyCash[month] ||= { month, collectedCents: 0, refundedCents: 0 };
        monthlyCash[month][bucket] += payment[amountKey];
      }
    }
    const collectedCents = sum(payments.filter(payment => payment.paidAt), 'amountCents');
    const refundedCents = sum(payments, 'refundedAmountCents');
    return {
      referenceDate: data.meta.referenceDate, filters: { from: from || null, to: to || null, basis: 'orders.createdAt (UTC)' },
      homepage: getHomepageMetrics(data),
      orders: { total: orders.length, byStatus: { initiated: 0, in_progress: 0, completed: 0, cancelled: 0, ...countBy(orders, 'status') }, byService: countBy(orders, 'serviceType'), byOriginRegion: countBy(orders, order => cities.get(order.origin.cityId).region), byVehicleType: countBy(orders, order => order.vehicleId ? vehicles.get(order.vehicleId).vehicleTypeId : 'unassigned'), cancellationReasons: countBy(cancelled, 'cancellationReason'), completionRate: percentage(completed.length, orders.length), cancellationRate: percentage(cancelled.length, orders.length), onTimeRate: percentage(onTime.length, completed.length), lateCompleted: completed.length - onTime.length, overdueActive: lateActiveOrders.map(order => order.id), averageDeliveryHours: completed.length ? Math.round(completed.reduce((hours, order) => hours + (Date.parse(order.completedAt) - Date.parse(order.startedAt)) / 3600000, 0) / completed.length * 10) / 10 : 0, monthlyByCreation: [...monthly.values()].sort((a,b) => a.month.localeCompare(b.month)), completedByMonth: countBy(completed, order => order.completedAt.slice(0,7)) },
      users: { byRole: countBy(data.users, 'role'), clientsByAccountStatus: countBy(data.users.filter(user => user.role === 'client'), 'accountStatus'), clientsRegisteredByMonth: countBy(data.users.filter(user => user.role === 'client'), user => user.createdAt.slice(0,7)), staffPendingApproval: data.users.filter(user => user.role === 'staff' && user.approvalStatus === 'pending').map(user => user.id) },
      carriers: { byApproval: countBy(data.carriers, 'approvalStatus'), busy: busyCarriers.size, available: data.carriers.filter(carrier => eligibleCarrierIds.has(carrier.id) && carrier.availability === 'available' && !busyCarriers.has(carrier.id)).length, pendingIds: data.carriers.filter(carrier => carrier.approvalStatus === 'pending').map(carrier => carrier.id), ranking: carrierRanking },
      fleet: { total: data.vehicles.length, byType: countBy(data.vehicles, 'vehicleTypeId'), byApproval: countBy(data.vehicles, 'approvalStatus'), inMaintenance: data.vehicles.filter(vehicle => vehicle.operationalStatus === 'maintenance').length, eligibleVehicles: data.vehicles.filter(vehicle => vehicle.approvalStatus === 'approved' && vehicle.operationalStatus === 'available' && eligibleCarrierIds.has(vehicle.carrierId) && !expiredVehicles.has(vehicle.id)).length, pendingIds: data.vehicles.filter(vehicle => vehicle.approvalStatus === 'pending').map(vehicle => vehicle.id), documentAlerts },
      payments: { byStatus: countBy(payments, 'status'), collectedCents, refundedCents, netCollectedCents: collectedCents - refundedCents, completedTransportValueCents: sum(completed, 'quotedAmountCents'), monthlyCash: Object.values(monthlyCash).sort((a,b) => a.month.localeCompare(b.month)), note: 'Valores fictícios de transporte; não representam receita ou lucro da plataforma.' },
      support: { byStatus: countBy(data.supportTickets, 'status'), byCategory: countBy(data.supportTickets, 'category'), byPriority: countBy(data.supportTickets, 'priority') },
      reviews: { count: reviews.length, averageRating: reviews.length ? Math.round(sum(reviews, 'rating') / reviews.length * 100) / 100 : null, byRating: countBy(reviews, 'rating') },
      topClients
    };
  }
  const api = { getHomepageMetrics, getAdminDashboard, getDocumentAlerts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TrustPortMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
