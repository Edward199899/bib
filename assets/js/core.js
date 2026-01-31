/* --- BIBCOIN CORE: SECURITY GUARD --- */
const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";

// Supabase မရှိရင် Error မတက်အောင် စစ်မယ်
if (typeof supabase === 'undefined') {
    console.error("Supabase CDN not loaded!");
} else {
    var { createClient } = supabase;
    var db = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("✅ Core System Connected");
}

async function checkAccess() {
    console.log("Checking User Session...");
    const { data: { session } } = await db.auth.getSession();
    
    // လက်ရှိ Page ကို စစ်မယ်
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');

    if (session) {
        console.log("User is Logged In:", session.user.email);
        // Login ဝင်ထားပြီး Login Page ရောက်နေရင် Index ကိုပို့
        if (isAuthPage) {
            window.location.href = 'index.html';
        }
        // Index ရောက်နေရင်တော့ ui.js က Data ဆက်လုပ်လိမ့်မယ် (ဒီမှာ ဘာမှလုပ်စရာမလို)
    } else {
        console.warn("User Not Logged In");
        // Login မဝင်ရသေးရင် Index ပေးမဝင်ဘူး
        if (!isAuthPage) {
            window.location.href = 'login.html';
        }
    }
}

// 🔥 အရေးကြီးဆုံး - Function ကို လှမ်းခေါ်မှ အလုပ်လုပ်မယ် 🔥
checkAccess();