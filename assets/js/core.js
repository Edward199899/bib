const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    const path = window.location.pathname;

    // ဒီစာမျက်နှာတွေက Login မဝင်လည်း ကြည့်လို့ရတဲ့ စာမျက်နှာတွေ
    // blog-grid.html (Welcome Page), login, register
    const isPublicPage = path.includes('login.html') || path.includes('register.html') || path.includes('blog-grid.html');

    // ၁။ အကောင့်မရှိသူ (Not Logged In)
    if (!session) {
        // Public Page မဟုတ်တဲ့နေရာ (ဥပမာ index.html) ကို လာရင်
        if (!isPublicPage) {
            // Welcome Page (Blog) ကို မောင်းထုတ်မယ်
            window.location.href = 'blog-grid.html'; 
        }
    } 
    
    // ၂။ အကောင့်ရှိသူ (Logged In)
    else if (session) {
        // Login ဝင်ထားလျက်နဲ့ Welcome Page တွေဆီ ပြန်သွားရင်
        if (isPublicPage) {
            // Dashboard (Index) ကိုပဲ အတင်းပြန်ပို့မယ်
            window.location.href = 'index.html';
        }
    }
}

function hideLoader() {
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'none';
}

// Logout Function (Updated Flow)
async function logout() {
    const { error } = await db.auth.signOut();
    if (!error) {
        // Logout ထွက်ရင် Welcome Page (Blog) ဆီ ပြန်ပို့မယ်
        window.location.href = 'blog-grid.html'; 
    }
}