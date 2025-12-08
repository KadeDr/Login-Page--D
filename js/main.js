// ============================================
// DOM Elements
// ============================================
const errorElement = document.querySelector('.error-message');
const loginButton = document.querySelector('.login-button');
const signupButton = document.querySelector('.signup-button');

// ============================================
// Data Storage (for frontend validation only)
// ============================================
const data = {
    errorQueue: []
};

// ============================================
// Backend Configuration
// ============================================
const BACKEND_URL = 'https://shirleen-unreorganised-flatfootedly.ngrok-free.dev'; // Your ngrok URL

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
// LOGIN FUNCTION (Updated for new backend)
// ============================================
async function registerUser(usernameClass, passwordClass) {
    const email = document.querySelector(`.${usernameClass}`).value;
    const password = document.querySelector(`.${passwordClass}`).value;

    if (!email && !password) {
        ErrorManager.add('EMPTY_BOTH', 'Email and password cannot be empty.');
        return;
    }
    if (!email) {
        ErrorManager.add('EMPTY_USERNAME', 'Email cannot be empty.');
        return;
    }
    if (!password) {
        ErrorManager.add('EMPTY_PASSWORD', 'Password cannot be empty.');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            ErrorManager.clear();
            
            // Store user data and redirect to dashboard
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            localStorage.setItem('userEmail', result.user.email);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Handle different error cases
            if (result.status === 'pending') {
                ErrorManager.add('PENDING_APPROVAL', 'Your account is pending approval by a coach.');
            } else if (result.status === 'denied') {
                ErrorManager.add('ACCOUNT_DENIED', 'Your account has been denied access.');
            } else {
                ErrorManager.add('INVALID_CREDS', result.error || 'Invalid email or password.');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        ErrorManager.add('SERVER_ERROR', 'Could not connect to server. Please check your connection.');
    }
}

// ============================================
// Validation Functions
// ============================================
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

function showPasswordToggle(passwordClass, button) {
    const passwordInput = document.querySelector(`.${passwordClass}`);

    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    button.innerText = passwordInput.type === 'password' ? 'Show Password' : 'Hide Password';
}

// ============================================
// SIGNUP FUNCTION (Updated for new backend)
// ============================================
async function registerNewUser(emailClass, usernameClass, passwordClass) {
    const email = document.querySelector(`.${emailClass}`).value;
    const username = document.querySelector(`.${usernameClass}`).value;
    const password = document.querySelector(`.${passwordClass}`).value;
    const confirmPassword = document.querySelector('.confirm-password').value;

    // Run all validations
    checkForInvalidEmail(emailClass);
    checkForInvalidPassword(passwordClass);
    checkForNonMatchingPasswords(passwordClass, 'confirm-password');

    if (ErrorManager.hasErrors()) {
        ErrorManager.add('SIGNUP_ERROR', 'Please fix all errors before signing up.');
        
        setTimeout(() => {
            ErrorManager.remove('SIGNUP_ERROR');
        }, 2000);
        
        return;
    }

    try {
        // New backend expects: email, password, name, role, teamCode
        // We'll use username as the name and default to 'student' role
        const response = await fetch(`${BACKEND_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email,
                password: password,
                name: username, // Using username as full name
                role: 'student', // Default role
                teamCode: 'MECH5103', // Your team code
                phone: '', // Optional
                subteam: '' // Optional
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            ErrorManager.clear();
            ErrorManager.add('SUCCESS', 'Account created! Waiting for coach approval.');
            
            // Clear form fields
            document.querySelector(`.${emailClass}`).value = '';
            document.querySelector(`.${usernameClass}`).value = '';
            document.querySelector(`.${passwordClass}`).value = '';
            document.querySelector('.confirm-password').value = '';
            
            // Show approval message for 5 seconds
            setTimeout(() => {
                alert('Your account has been created and is pending approval from a coach. You will be able to log in once approved.');
            }, 1000);
        } else {
            ErrorManager.add('SIGNUP_FAILED', result.error || 'Failed to create account');
        }
    } catch (error) {
        console.error('Signup error:', error);
        ErrorManager.add('SERVER_ERROR', 'Could not connect to server. Please check your connection.');
    }
}