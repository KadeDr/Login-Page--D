// ============================================
// DOM Elements
// ============================================
const errorElement = document.querySelector('.error-message');
const loginButton = document.querySelector('.login-button');
const signupButton = document.querySelector('.signup-button');

// ============================================
// Data Storage
// ============================================
const data = {
    emails: [],
    usernames: [],
    passwords: [],
    errorQueue: []
};

// ============================================
// Firebase Management
// ============================================
async function loadDataFromFirebase() {
    try {
        const snapshot = await window.firebaseGet(window.firebaseRef(window.database, 'users'));
        
        if (snapshot.exists()) {
            const users = snapshot.val();
            data.emails = users.emails || [];
            data.usernames = users.usernames || [];
            data.passwords = users.passwords || [];
            console.log('Data loaded from Firebase:', data);
        }
    } catch (error) {
        console.error('Error loading data from Firebase:', error);
    }
}

async function saveDataToFirebase() {
    try {
        await window.firebaseSet(window.firebaseRef(window.database, 'users'), {
            emails: data.emails,
            usernames: data.usernames,
            passwords: data.passwords
        });
        console.log('Data saved to Firebase');
    } catch (error) {
        console.error('Error saving data to Firebase:', error);
    }
}

// ============================================
// Error Management
// ============================================
const ErrorManager = {
    add(code, message) {
        if (!this.exists(code)) {
            data.errorQueue.push({ code, message });
            this.display();
        }
    },

    remove(code) {
        data.errorQueue = data.errorQueue.filter(err => err.code !== code);
        this.display();
    },

    exists(code) {
        return data.errorQueue.some(err => err.code === code);
    },

    hasErrors() {
        return data.errorQueue.length > 0;
    },

    display() {
        if (data.errorQueue.length > 0) {
            errorElement.style.display = 'block';
            errorElement.innerText = data.errorQueue[data.errorQueue.length - 1].message;
            loginButton.style.marginTop = '5px';
        } else {
            errorElement.style.display = 'none';
            loginButton.style.marginTop = '20px';
        }
    },

    clear() {
        data.errorQueue = [];
        this.display();
    }
};

// ============================================
// Validation Helpers
// ============================================
const Validators = {
    isEmail(input) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    },

    hasUppercase(password) {
        return /[A-Z]/.test(password);
    },

    hasNumber(password) {
        return /[0-9]/.test(password);
    },

    hasSpecialChar(password) {
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    }
};

// ============================================
// Public Functions
// ============================================
function registerUser(usernameClass, passwordClass) {
    const username = document.querySelector(`.${usernameClass}`).value;
    const password = document.querySelector(`.${passwordClass}`).value;

    if (!username && !password) {
        ErrorManager.add('EMPTY_BOTH', 'Username and password cannot be empty.');
        return;
    }
    if (!username) {
        ErrorManager.add('EMPTY_USERNAME', 'Username cannot be empty.');
        return;
    }
    if (!password) {
        ErrorManager.add('EMPTY_PASSWORD', 'Password cannot be empty.');
        return;
    }

    const userArray = Validators.isEmail(username) ? data.emails : data.usernames;
    const isValid = userArray.some((u, i) => u === username && data.passwords[i] === password);

    if (isValid) {
        ErrorManager.clear();
        ErrorManager.add('SUCCESS', 'Successfully logged in');
    } else {
        ErrorManager.add('INVALID_CREDS', 'Invalid username or password.');
    }
}

function checkForInvalidEmail(emailClass) {
    const email = document.querySelector(`.${emailClass}`).value;

    if (!email) {
        ErrorManager.add('EMPTY_EMAIL', 'Email cannot be empty.');
        return;
    }

    if (!Validators.isEmail(email)) {
        ErrorManager.add('INVALID_EMAIL_FORMAT', 'Please enter a valid email address.');
        return;
    }

    ErrorManager.remove('INVALID_EMAIL_FORMAT');
    ErrorManager.remove('EMPTY_EMAIL');
}

function checkForInvalidUsername(usernameClass) {
    const username = document.querySelector(`.${usernameClass}`).value;

    if (!username) {
        ErrorManager.add('EMPTY_USERNAME', 'Username cannot be empty.');
        return;
    }

    if (Validators.isEmail(username)) {
        ErrorManager.add('INVALID_USERNAME_EMAIL', 'Username cannot include the following characters: @');
        return;
    }

    if (data.usernames.includes(username)) {
        ErrorManager.add('USERNAME_TAKEN', 'Username is already taken.');
        return;
    }

    ErrorManager.remove('INVALID_USERNAME_EMAIL');
    ErrorManager.remove('USERNAME_TAKEN');
    ErrorManager.remove('EMPTY_USERNAME');
}

function checkForInvalidPassword(passwordClass) {
    const password = document.querySelector(`.${passwordClass}`).value;
    const errorCodes = ['PASSWORD_TOO_SHORT', 'NO_UPPERCASE', 'NO_NUMBER', 'NO_SPECIAL_CHAR', 'EMPTY_PASSWORD'];

    if (!password) {
        ErrorManager.add('EMPTY_PASSWORD', 'Password cannot be empty.');
        return;
    }

    if (password.length < 8) {
        ErrorManager.add('PASSWORD_TOO_SHORT', 'Password must be at least 8 characters long.');
        return;
    }
    if (!Validators.hasUppercase(password)) {
        ErrorManager.add('NO_UPPERCASE', 'Password must contain at least one uppercase letter.');
        return;
    }
    if (!Validators.hasNumber(password)) {
        ErrorManager.add('NO_NUMBER', 'Password must contain at least one number.');
        return;
    }
    if (!Validators.hasSpecialChar(password)) {
        ErrorManager.add('NO_SPECIAL_CHAR', 'Password must contain at least one special character.');
        return;
    }

    errorCodes.forEach(code => ErrorManager.remove(code));
}

function checkForNonMatchingPasswords(passwordClass, confirmPasswordClass) {
    const password = document.querySelector(`.${passwordClass}`).value;
    const confirmPassword = document.querySelector(`.${confirmPasswordClass}`).value;

    if (password != confirmPassword) {
        ErrorManager.add('PASSWORDS_DO_NOT_MATCH', 'Passwords do not match.');
    } else {
        ErrorManager.remove('PASSWORDS_DO_NOT_MATCH');
    }
}

async function registerNewUser(emailClass, usernameClass, passwordClass) {
    const email = document.querySelector(`.${emailClass}`).value;
    const username = document.querySelector(`.${usernameClass}`).value;
    const password = document.querySelector(`.${passwordClass}`).value;

    // Run all validations
    checkForInvalidEmail(emailClass);
    checkForInvalidUsername(usernameClass);
    checkForInvalidPassword(passwordClass);
    checkForNonMatchingPasswords(passwordClass, 'confirm-password');

    if (ErrorManager.hasErrors()) {
        ErrorManager.add('SIGNUP_ERROR', 'Please fix all errors before signing up.');
        
        setTimeout(() => {
            ErrorManager.remove('SIGNUP_ERROR');
        }, 2000);
        
        return;
    }

    // Add user to storage
    data.emails.push(email);
    data.usernames.push(username);
    data.passwords.push(password);

    // Save to Firebase
    await saveDataToFirebase();
    
    ErrorManager.clear();
    ErrorManager.add('SUCCESS', 'Account created successfully!');
}

// ============================================
// Initialize on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', loadDataFromFirebase);