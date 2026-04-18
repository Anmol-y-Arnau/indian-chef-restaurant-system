/**
 * Reservation utility functions shared between server and frontend logic.
 * Opening hours: Wed–Mon 13:00–16:00 and 19:00–23:00
 * Friday & Saturday: dinner until 23:30
 * Tuesday: CLOSED
 */

/**
 * Returns the list of available time slots for a given date.
 * Returns an empty array if the restaurant is closed (Tuesday).
 */
export function getTimeSlotsForDate(dateStr: string): string[] {
  const dow = new Date(dateStr + "T12:00:00").getDay(); // 0=Sun, 1=Mon, 2=Tue, ...
  if (dow === 2) return []; // Tuesday = closed

  const lunch = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
  const dinnerBase = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
  const dinnerLate = [...dinnerBase, "23:30"];

  // Friday (5) and Saturday (6) have extended dinner hours
  const dinner = (dow === 5 || dow === 6) ? dinnerLate : dinnerBase;

  return [...lunch, ...dinner];
}

/**
 * Returns true if the restaurant is open on the given date.
 */
export function isRestaurantOpen(dateStr: string): boolean {
  return getTimeSlotsForDate(dateStr).length > 0;
}

/**
 * Returns the service period ("lunch" | "dinner" | null) for a given time.
 */
export function getServicePeriod(time: string): "lunch" | "dinner" | null {
  if (time >= "13:00" && time <= "16:00") return "lunch";
  if (time >= "19:00" && time <= "23:30") return "dinner";
  return null;
}
