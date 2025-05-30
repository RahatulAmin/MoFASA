import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAsQPgOSpmdZ1bddJa1fl76TPlXiy48PaQ",
    authDomain: "mofasa-tools.firebaseapp.com",
    projectId: "mofasa-tools",
    storageBucket: "mofasa-tools.firebasestorage.app",
    messagingSenderId: "486988793638",
    appId: "1:486988793638:web:2afc2ba18fe5a4e1a5a3e7",
    measurementId: "G-6RQ169P9R1"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 