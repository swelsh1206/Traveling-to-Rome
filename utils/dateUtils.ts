// Date utilities for Early Modern Europe (1450-1800)

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

// Generate a random starting date within 1450-1800, spring season
export const generateRandomStartDate = (): { year: number; month: number; dayOfMonth: number } => {
    const year = Math.floor(Math.random() * (1800 - 1450 + 1)) + 1450;
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

// Get the historical context for a specific year (Based on Merry Wiesner-Hanks' Early Modern Europe)
export const getHistoricalContext = (year: number): string => {
    if (year >= 1450 && year < 1500) {
        return "Era of demographic recovery and economic expansion. Printing transforms information exchange; Italian city-states dominate Mediterranean trade.";
    } else if (year >= 1500 && year < 1520) {
        return "Commercial revolution and global exploration. New trade routes challenge traditional Mediterranean dominance; urban growth accelerates.";
    } else if (year >= 1520 && year < 1560) {
        return "Religious fragmentation and social upheaval. Protestant movements divide Western Christianity; peasant rebellions challenge social hierarchy.";
    } else if (year >= 1560 && year < 1618) {
        return "Confessional tensions and state formation. Religious divisions harden; rulers consolidate power through bureaucracy and confessional identity.";
    } else if (year >= 1618 && year <= 1648) {
        return "Thirty Years' War devastates Central Europe. Military conflict, famine, and disease cause demographic catastrophe; soldiers often unpaid.";
    } else if (year >= 1649 && year < 1700) {
        return "Period of state building and mercantilism. European powers expand overseas colonies; absolutist monarchies centralize authority.";
    } else if (year >= 1700 && year < 1750) {
        return "Growth of consumer culture and Atlantic economy. Coffee houses spread; colonial trade enriches European merchant classes.";
    } else if (year >= 1750 && year <= 1800) {
        return "Age of Enlightenment and agrarian change. Population growth; proto-industrialization transforms rural economies; political challenges emerge.";
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
