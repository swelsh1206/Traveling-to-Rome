// Date utilities for Early Modern Europe (1450-1650)

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Check if a year is a leap year (Gregorian calendar adopted 1582)
export const isLeapYear = (year: number): boolean => {
    if (year >= 1582) {
        // Gregorian calendar rules
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    } else {
        // Julian calendar (simple rule)
        return year % 4 === 0;
    }
};

// Get days in a specific month
export const getDaysInMonth = (month: number, year: number): number => {
    if (month === 2 && isLeapYear(year)) {
        return 29;
    }
    return DAYS_IN_MONTH[month - 1];
};

// Generate a random starting date within 1450-1650, spring season
export const generateRandomStartDate = (): { year: number; month: number; dayOfMonth: number } => {
    const year = Math.floor(Math.random() * (1650 - 1450 + 1)) + 1450;
    // Spring months: March (3), April (4), May (5)
    const month = Math.floor(Math.random() * 3) + 3;
    const daysInMonth = getDaysInMonth(month, year);
    const dayOfMonth = Math.floor(Math.random() * daysInMonth) + 1;

    return { year, month, dayOfMonth };
};

// Advance date by one day
export const advanceDate = (currentYear: number, currentMonth: number, currentDay: number):
    { year: number; month: number; dayOfMonth: number } => {

    let year = currentYear;
    let month = currentMonth;
    let dayOfMonth = currentDay + 1;

    const daysInMonth = getDaysInMonth(month, year);

    if (dayOfMonth > daysInMonth) {
        dayOfMonth = 1;
        month++;

        if (month > 12) {
            month = 1;
            year++;
        }
    }

    return { year, month, dayOfMonth };
};

// Format date as readable string
export const formatDate = (day: number, month: number, year: number): string => {
    const monthName = MONTHS[month - 1];
    return `${day} ${monthName}, Anno Domini ${year}`;
};

// Get the historical context for a specific year
export const getHistoricalContext = (year: number): string => {
    if (year >= 1450 && year < 1500) {
        return "Late Medieval / Early Renaissance period. Printing press spreading knowledge.";
    } else if (year >= 1500 && year < 1517) {
        return "High Renaissance. Artistic and cultural flourishing across Europe.";
    } else if (year >= 1517 && year < 1555) {
        return "Protestant Reformation era. Martin Luther's challenge to the Church.";
    } else if (year >= 1555 && year < 1618) {
        return "Age of Religious Conflict. Peace of Augsburg signed but tensions remain.";
    } else if (year >= 1618 && year <= 1648) {
        return "The Thirty Years' War. Devastating religious conflict ravaging Europe.";
    } else if (year > 1648 && year <= 1650) {
        return "Post-Westphalia. Europe recovering from decades of war.";
    }
    return "Early Modern Europe";
};

// Get season based on month
export const getSeasonFromMonth = (month: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter';
};
