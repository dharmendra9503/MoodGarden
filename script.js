// DOM Elements
const emojiSelector = document.querySelector('.emoji-selector');
const logStatus = document.getElementById('log-status');
const moodNote = document.getElementById('mood-note');
const viewButtons = document.querySelectorAll('.view-btn');
const viewContents = document.querySelectorAll('.view-content');
const timeline = document.getElementById('timeline');
const weekView = document.getElementById('week-view');
const monthView = document.getElementById('month-view');
const calendarView = document.getElementById('calendar-view');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const currentMonthDisplay = document.getElementById('current-month-display');
const calendarGrid = document.querySelector('.calendar-grid');
const moodStats = document.getElementById('mood-stats');

//Selector for the theme change
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Current selected emoji/mood
let selectedMood = null;
let currentDate = new Date();
let timer = null;

// Initialize by selecting the first view button (Day view)
viewButtons[0].classList.add('active');

// Helper function to format date as "YYYY-MM-DD"
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to format date for display
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Helper function to get emoji for a mood
function getMoodEmoji(mood) {
    const emojiMap = {
        'Happy': '😊',
        'Excited': '😄',
        'Content': '😌',
        'Neutral': '😐',
        'Tired': '😪',
        'Anxious': '😰',
        'Sad': '😢',
        'Angry': '😠'
    };

    return emojiMap[mood] || '❓';
}

// Theme handling
function initTheme() {
    // Check for saved theme preference or use the system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
    } else {
        // If no saved preference, check system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.body.classList.add('dark-theme');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    }
}

// Toggle theme function
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        // Switch to light theme
        document.body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        // Switch to dark theme
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Handle emoji selection
emojiSelector.addEventListener('click', (e) => {
    if (e.target.matches('span')) {
        // Remove selected class from all emojis
        document.querySelectorAll('.emoji-selector span').forEach(span => {
            span.classList.remove('selected');
        });

        // Add selected class to clicked emoji
        e.target.classList.add('selected');

        // Store the selected mood
        selectedMood = {
            mood: e.target.getAttribute('data-mood'),
            emoji: e.target.textContent
        };

        // Log the mood for today
        logMood();
    }
});

// Log mood function
function logMood() {
    if (!selectedMood) {
        logStatus.textContent = 'Please select a mood first!';
        setTimeout(() => { logStatus.textContent = ''; }, 3000);
        return;
    }
    if(timer) clearTimeout(timer);

    const date = new Date();
    const formattedDate = formatDate(date);
    const note = moodNote.value.trim();

    let moods = JSON.parse(localStorage.getItem('moods')) || [];

    // Check if we already logged a mood for today
    const todayIndex = moods.findIndex(m => m.date === formattedDate);

    if (todayIndex !== -1) {
        // Update today's mood
        moods[todayIndex] = {
            date: formattedDate,
            mood: selectedMood.mood,
            emoji: selectedMood.emoji,
            note: note,
            timestamp: date.getTime()
        };
        logStatus.textContent = `Mood updated for today! 🔄`;
    } else {
        // Add new mood for today
        moods.push({
            date: formattedDate,
            mood: selectedMood.mood,
            emoji: selectedMood.emoji,
            note: note,
            timestamp: date.getTime()
        });
        logStatus.textContent = `Mood "${selectedMood.mood}" logged! 🎉`;
    }

    // Save to localStorage
    localStorage.setItem('moods', JSON.stringify(moods));

    // Clear the note field
    moodNote.value = '';

    // Reset the selection after a delay
    timer = setTimeout(() => {
        logStatus.textContent = '';
        document.querySelectorAll('.emoji-selector span').forEach(span => {
            span.classList.remove('selected');
        });
        selectedMood = null;
    }, 2000);

    // Refresh all views
    loadViews();
}

// View switcher
viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and views
        viewButtons.forEach(b => b.classList.remove('active'));
        viewContents.forEach(v => v.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Get the view name and activate corresponding view
        const viewName = btn.getAttribute('data-view');
        document.getElementById(`${viewName === 'day' ? 'timeline' : viewName + '-view'}`).classList.add('active');

        // If calendar view, refresh it to current month
        if (viewName === 'calendar') {
            renderCalendar(currentDate);
        }
    });
});

// Load all views
function loadViews() {
    loadTimeline();
    loadWeekView();
    loadMonthView();
    renderCalendar(currentDate);
    loadMoodStats();
}

// Day View (Timeline)
function loadTimeline() {
    timeline.innerHTML = '';
    const moods = JSON.parse(localStorage.getItem('moods')) || [];

    if (moods.length === 0) {
        timeline.innerHTML = "<p>No moods logged yet!</p>";
        return;
    }

    // Sort by date - newest first
    moods.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // Group by date for better visualization
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000)); // 24 hours ago

    moods.forEach(log => {
        const div = document.createElement('div');
        div.classList.add('timeline-item');

        // Add date label with relative time for recent days
        let dateLabel;
        if (log.date === today) {
            dateLabel = 'Today';
        } else if (log.date === yesterday) {
            dateLabel = 'Yesterday';
        } else {
            dateLabel = formatDateForDisplay(log.date);
        }

        let content = `
                <span class="emoji">${log.emoji}</span>
                <div class="details">
                    <div class="date">${dateLabel}</div>
                    <div class="mood-title">${log.mood}</div>
            `;

        if (log.note) {
            content += `<div class="note">"${log.note}"</div>`;
        }

        content += `</div>`;
        div.innerHTML = content;
        timeline.appendChild(div);
    });
}

// Week View
function loadWeekView() {
    weekView.innerHTML = '';
    const moods = JSON.parse(localStorage.getItem('moods')) || [];

    if (moods.length === 0) {
        weekView.innerHTML = "<p>No moods logged yet!</p>";
        return;
    }

    // Get week data
    const weekData = getWeekData(moods);

    // Sort weeks by date (newest first)
    const sortedWeeks = Object.keys(weekData).sort((a, b) => new Date(b) - new Date(a));

    // Render each week
    sortedWeeks.forEach(weekKey => {
        const weekContainer = document.createElement('div');
        weekContainer.classList.add('week-container');

        const weekTitle = document.createElement('h3');

        // Format the week title with date range
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekKey);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const formattedStart = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const formattedEnd = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        weekTitle.textContent = `${formattedStart} - ${formattedEnd}`;
        weekContainer.appendChild(weekTitle);

        // Get mood counts for this week
        const moodCounts = getMoodCounts(weekData[weekKey]);

        // Render mood distribution
        for (const mood in moodCounts) {
            const moodItem = document.createElement('div');
            moodItem.classList.add('week-day');
            moodItem.innerHTML = `
                    <div class="mood-count">
                        <span class="emoji">${getMoodEmoji(mood)}</span>
                        <span>${moodCounts[mood]}</span>
                    </div>
                    <div class="mood-name">${mood}</div>
                `;
            weekContainer.appendChild(moodItem);
        }

        weekView.appendChild(weekContainer);
    });

    if (weekView.children.length === 0) {
        weekView.innerHTML = "<p>No mood data available for any week.</p>";
    }
}

// Month View
function loadMonthView() {
    monthView.innerHTML = '';
    const moods = JSON.parse(localStorage.getItem('moods')) || [];

    if (moods.length === 0) {
        monthView.innerHTML = "<p>No moods logged yet!</p>";
        return;
    }

    // Get month data
    const monthData = getMonthData(moods);

    // Sort months chronologically (newest first)
    const sortedMonths = Object.keys(monthData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    // Render each month
    sortedMonths.forEach(monthKey => {
        const monthContainer = document.createElement('div');
        monthContainer.classList.add('month-container');

        const monthTitle = document.createElement('h3');
        monthTitle.textContent = monthKey;
        monthContainer.appendChild(monthTitle);

        // Get mood counts for this month
        const moodCounts = getMoodCounts(monthData[monthKey]);

        // Render mood distribution
        for (const mood in moodCounts) {
            const moodItem = document.createElement('div');
            moodItem.classList.add('month-day');
            moodItem.innerHTML = `
                    <div class="mood-count">
                        <span class="emoji">${getMoodEmoji(mood)}</span>
                        <span>${moodCounts[mood]}</span>
                    </div>
                    <div class="mood-name">${mood}</div>
                `;
            monthContainer.appendChild(moodItem);
        }

        monthView.appendChild(monthContainer);
    });

    if (monthView.children.length === 0) {
        monthView.innerHTML = "<p>No mood data available for any month.</p>";
    }
}

// Calendar View
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;

    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get stored moods
    const moods = JSON.parse(localStorage.getItem('moods')) || [];

    // Clear previous calendar days after the day headers
    const dayElements = calendarGrid.querySelectorAll('.calendar-day');
    dayElements.forEach(day => day.remove());

    // Calculate the first day of the week of the month
    let firstDayIndex = firstDay.getDay(); // 0 = Sunday

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const calendarDay = document.createElement('div');
        calendarDay.classList.add('calendar-day');

        // Format date for comparison
        const dateStr = formatDate(new Date(year, month, day));

        // Check if this day is today
        if (isCurrentMonth && today.getDate() === day) {
            calendarDay.classList.add('today');
        }

        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.classList.add('date-number');
        dateNumber.textContent = day;
        calendarDay.appendChild(dateNumber);

        // Find mood for this day
        const dayMood = moods.find(m => m.date === dateStr);

        if (dayMood) {
            const moodEmoji = document.createElement('div');
            moodEmoji.classList.add('mood-emoji');
            moodEmoji.textContent = dayMood.emoji;
            calendarDay.appendChild(moodEmoji);

            // Add tooltip functionality
            calendarDay.title = `${dayMood.mood}${dayMood.note ? ': ' + dayMood.note : ''}`;

            // Add click event to show mood details
            calendarDay.addEventListener('click', () => {
                alert(`Date: ${formatDateForDisplay(dateStr)}\nMood: ${dayMood.mood} ${dayMood.emoji}\n${dayMood.note ? 'Note: ' + dayMood.note : ''}`);
            });
        }

        calendarGrid.appendChild(calendarDay);
    }
}

// Calendar navigation
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});

// Statistics View
function loadMoodStats() {
    moodStats.innerHTML = '';
    const moods = JSON.parse(localStorage.getItem('moods')) || [];

    if (moods.length === 0) {
        moodStats.innerHTML = "<p>No moods logged yet!</p>";
        return;
    }

    // Count moods
    const moodCounts = {};
    moods.forEach(log => {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    });

    // Sort mood counts by frequency (descending)
    const sortedMoods = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]);

    // Create stat elements
    sortedMoods.forEach(mood => {
        const moodStat = document.createElement('div');
        moodStat.classList.add('mood-stat');
        moodStat.innerHTML = `
                <div class="emoji">${getMoodEmoji(mood)}</div>
                <div class="name">${mood}</div>
                <div class="count">${moodCounts[mood]}</div>
            `;
        moodStats.appendChild(moodStat);
    });

    // Add total count
    const totalStat = document.createElement('div');
    totalStat.classList.add('mood-stat', 'total');
    totalStat.innerHTML = `
            <div class="emoji">📊</div>
            <div class="name">Total</div>
            <div class="count">${moods.length}</div>
        `;
    moodStats.appendChild(totalStat);
}

// Helper function to get week data
function getWeekData(moods) {
    const weekData = {};

    moods.forEach(log => {
        const date = new Date(log.date);
        // Get the first day of the week (Sunday)
        const firstDayOfWeek = new Date(date);
        firstDayOfWeek.setDate(date.getDate() - date.getDay());

        const weekKey = formatDate(firstDayOfWeek);

        if (!weekData[weekKey]) {
            weekData[weekKey] = [];
        }

        weekData[weekKey].push(log);
    });

    return weekData;
}

// Helper function to get month data
function getMonthData(moods) {
    const monthData = {};

    moods.forEach(log => {
        const date = new Date(log.date);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

        if (!monthData[monthYear]) {
            monthData[monthYear] = [];
        }

        monthData[monthYear].push(log);
    });

    return monthData;
}

// Helper function to count moods
function getMoodCounts(logs) {
    const counts = {};

    logs.forEach(log => {
        counts[log.mood] = (counts[log.mood] || 0) + 1;
    });

    return counts;
}

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Initialize theme
initTheme();

// Initial load
loadViews();

document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('moodChart').getContext('2d');
  const moodChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Happy', 'Excited', 'Content', 'Neutral', 'Tired', 'Anxious', 'Sad', 'Angry'],
      datasets: [{
        label: 'Mood Frequency',
        data: [12, 19, 3, 5, 2, 3, 7, 8], // Example data
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(201, 203, 207, 0.2)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
});