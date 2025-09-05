// Age Calculator JavaScript
class AgeCalculator {
    constructor() {
        this.form = document.getElementById('ageForm');
        this.resultContainer = document.getElementById('result');
        this.errorContainer = document.getElementById('error');
        this.dayInput = document.getElementById('day');
        this.monthInput = document.getElementById('month');
        this.yearInput = document.getElementById('year');
        this.calculateBtn = document.querySelector('.calculate-btn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupInputValidation();
        this.setCurrentYear();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateAge();
        });
        
        // Real-time validation
        [this.dayInput, this.monthInput, this.yearInput].forEach(input => {
            input.addEventListener('input', () => {
                this.clearError();
                this.validateInput(input);
            });
            
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
        });
    }
    
    setupInputValidation() {
        // Set max day based on selected month
        this.monthInput.addEventListener('change', () => {
            this.updateDayMax();
        });
        
        // Prevent invalid characters
        this.dayInput.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        this.yearInput.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    setCurrentYear() {
        const currentYear = new Date().getFullYear();
        this.yearInput.max = currentYear;
        this.yearInput.placeholder = `1900-${currentYear}`;
    }
    
    updateDayMax() {
        const month = parseInt(this.monthInput.value);
        const year = parseInt(this.yearInput.value);
        
        if (month && year) {
            const daysInMonth = new Date(year, month, 0).getDate();
            this.dayInput.max = daysInMonth;
        } else if (month) {
            // Default to 31 if year not selected
            this.dayInput.max = 31;
        }
    }
    
    validateInput(input) {
        const value = input.value.trim();
        const inputType = input.id;
        
        if (!value) return true;
        
        switch (inputType) {
            case 'day':
                const day = parseInt(value);
                const month = parseInt(this.monthInput.value);
                const year = parseInt(this.yearInput.value);
                
                if (day < 1 || day > 31) {
                    this.showError('Day must be between 1 and 31');
                    return false;
                }
                
                if (month && year) {
                    const daysInMonth = new Date(year, month, 0).getDate();
                    if (day > daysInMonth) {
                        this.showError(`Day must be between 1 and ${daysInMonth} for the selected month`);
                        return false;
                    }
                }
                break;
                
            case 'month':
                const monthValue = parseInt(value);
                if (monthValue < 1 || monthValue > 12) {
                    this.showError('Please select a valid month');
                    return false;
                }
                break;
                
            case 'year':
                const yearValue = parseInt(value);
                const currentYear = new Date().getFullYear();
                if (yearValue < 1900 || yearValue > currentYear) {
                    this.showError(`Year must be between 1900 and ${currentYear}`);
                    return false;
                }
                break;
        }
        
        return true;
    }
    
    validateDate(day, month, year) {
        // Check if the date is valid
        const date = new Date(year, month - 1, day);
        
        if (date.getDate() !== day || 
            date.getMonth() !== month - 1 || 
            date.getFullYear() !== year) {
            this.showError('Please enter a valid date');
            return false;
        }
        
        // Check if date is not in the future
        const today = new Date();
        if (date > today) {
            this.showError('Birth date cannot be in the future');
            return false;
        }
        
        // Check if date is not too far in the past
        const minDate = new Date(1900, 0, 1);
        if (date < minDate) {
            this.showError('Birth date cannot be before 1900');
            return false;
        }
        
        return true;
    }
    
    calculateAge() {
        this.clearError();
        this.hideResult();
        
        const day = parseInt(this.dayInput.value);
        const month = parseInt(this.monthInput.value);
        const year = parseInt(this.yearInput.value);
        
        // Validate inputs
        if (!day || !month || !year) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (!this.validateDate(day, month, year)) {
            return;
        }
        
        this.showLoading();
        
        // Simulate loading for better UX
        setTimeout(() => {
            try {
                const birthDate = new Date(year, month - 1, day);
                const today = new Date();
                
                const ageData = this.calculateAgeDifference(birthDate, today);
                this.displayResult(ageData);
                this.hideLoading();
                
            } catch (error) {
                this.showError('An error occurred while calculating age');
                this.hideLoading();
            }
        }, 500);
    }
    
    calculateAgeDifference(birthDate, currentDate) {
        let years = currentDate.getFullYear() - birthDate.getFullYear();
        let months = currentDate.getMonth() - birthDate.getMonth();
        let days = currentDate.getDate() - birthDate.getDate();
        
        // Adjust for negative days
        if (days < 0) {
            months--;
            const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            days += lastMonth.getDate();
        }
        
        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // Calculate total days
        const timeDiff = currentDate.getTime() - birthDate.getTime();
        const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        return {
            years,
            months,
            days,
            totalDays
        };
    }
    
    displayResult(ageData) {
        const { years, months, days, totalDays } = ageData;
        
        // Update the result elements
        document.getElementById('years').textContent = years;
        document.getElementById('months').textContent = months;
        document.getElementById('days').textContent = days;
        document.getElementById('totalDays').textContent = totalDays.toLocaleString();
        
        // Show result with animation
        this.resultContainer.style.display = 'block';
        
        // Add some fun facts
        this.addFunFacts(ageData);
    }
    
    addFunFacts(ageData) {
        const { years, totalDays } = ageData;
        
        // Add fun facts based on age
        let funFact = '';
        
        if (years < 1) {
            funFact = 'You\'re still a baby! 👶';
        } else if (years < 5) {
            funFact = 'You\'re a toddler! 🧸';
        } else if (years < 13) {
            funFact = 'You\'re a kid! 🎮';
        } else if (years < 20) {
            funFact = 'You\'re a teenager! 🎧';
        } else if (years < 30) {
            funFact = 'You\'re in your twenties! 🎉';
        } else if (years < 40) {
            funFact = 'You\'re in your thirties! 💼';
        } else if (years < 50) {
            funFact = 'You\'re in your forties! 🏠';
        } else if (years < 60) {
            funFact = 'You\'re in your fifties! 🎯';
        } else if (years < 70) {
            funFact = 'You\'re in your sixties! 🌟';
        } else {
            funFact = 'You\'re a senior! 🧓';
        }
        
        // Add fun fact to result if not already present
        const existingFact = document.querySelector('.fun-fact');
        if (!existingFact) {
            const funFactElement = document.createElement('div');
            funFactElement.className = 'fun-fact';
            funFactElement.style.cssText = `
                margin-top: 15px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                font-style: italic;
                font-size: 0.9rem;
            `;
            funFactElement.textContent = funFact;
            document.querySelector('.result-card').appendChild(funFactElement);
        }
    }
    
    showError(message) {
        this.errorContainer.querySelector('.error-text').textContent = message;
        this.errorContainer.style.display = 'flex';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }
    
    clearError() {
        this.errorContainer.style.display = 'none';
    }
    
    hideResult() {
        this.resultContainer.style.display = 'none';
    }
    
    showLoading() {
        this.calculateBtn.classList.add('loading');
        this.calculateBtn.disabled = true;
    }
    
    hideLoading() {
        this.calculateBtn.classList.remove('loading');
        this.calculateBtn.disabled = false;
    }
}

// Utility functions
const DateUtils = {
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },
    
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    },
    
    formatNumber(num) {
        return num.toLocaleString();
    }
};

// Initialize the age calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AgeCalculator();
    
    // Add some interactive features
    addInteractiveFeatures();
});

function addInteractiveFeatures() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            document.querySelector('.calculate-btn').click();
        }
    });
    
    // Add focus management
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                } else {
                    document.querySelector('.calculate-btn').click();
                }
            }
        });
    });
    
    // Add input formatting
    const dayInput = document.getElementById('day');
    const yearInput = document.getElementById('year');
    
    dayInput.addEventListener('input', (e) => {
        if (e.target.value.length > 2) {
            e.target.value = e.target.value.slice(0, 2);
        }
    });
    
    yearInput.addEventListener('input', (e) => {
        if (e.target.value.length > 4) {
            e.target.value = e.target.value.slice(0, 4);
        }
    });
}
