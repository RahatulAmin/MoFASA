import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

class AuthService {
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (!hasUpperCase) {
            throw new Error('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            throw new Error('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            throw new Error('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            throw new Error('Password must contain at least one special character');
        }
    }

    static async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                await this.logout();
                throw new Error('Please verify your email before logging in');
            }
            return {
                user: userCredential.user,
                token: await userCredential.user.getIdToken()
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    static async register(email, password, username) {
        try {
            this.validatePassword(password);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update the user's profile with the username
            await updateProfile(userCredential.user, {
                displayName: username
            });

            // Reload the user to ensure the profile is updated
            await userCredential.user.reload();

            await sendEmailVerification(userCredential.user);
            return {
                user: userCredential.user,
                token: await userCredential.user.getIdToken()
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    static async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    static async logout() {
        try {
            await signOut(auth);
            return true;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    static onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }

    static handleAuthError(error) {
        let message = 'An error occurred during authentication';
        
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                message = 'Invalid email or password';
                break;
            case 'auth/email-already-in-use':
                message = 'Email is already registered';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                message = 'Too many attempts. Please try again later';
                break;
            case 'auth/requires-recent-login':
                message = 'Please log in again to perform this action';
                break;
            default:
                message = error.message;
        }
        
        return new Error(message);
    }
}

export default AuthService; 