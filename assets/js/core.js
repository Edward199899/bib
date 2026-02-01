const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    const path = window.location.pathname;
    
    // Login ဝင်မထားရင် Index ကို ပေးမဝင်ဘူး
    if (!session && !path.includes('login.html') && !path.includes('register.html')) {
        window.location.href = 'login.html';
    } 
    // Login ဝင်ထားရင် Login/Register Page ကို ပေးမဝင်ဘူး
    else if (session && (path.includes('login.html') || path.includes('register.html'))) {
        window.location.href = 'index.html';
    }
}

function hideLoader() {
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'none';
}

// Logout Function
async function logout() {
    const { error } = await db.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
}