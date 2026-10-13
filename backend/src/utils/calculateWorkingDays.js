
const calculateWorkingDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return 0;
    }
  
    let workingDays = 0;
  
    // Work with UTC dates to avoid timezone problems.
    const current = new Date(start);
  
    while (current <= end) {
      const day = current.getUTCDay();
  
      // Sunday = 0, Saturday = 6
      // Monday to Friday = 1 to 5
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
  
      current.setUTCDate(current.getUTCDate() + 1);
    }
  
    return workingDays;
  };
  
  module.exports = calculateWorkingDays;

  