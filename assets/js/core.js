/* --- SGX CORE SYSTEM (INTEGRATED VERSION) --- */

// ၁။ SUPABASE CONFIGURATION (New Project Credentials)
const SUPABASE_URL = "https://labuecnbqufcljreilme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYnVlY25icXVmY2xqcmVpbG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MTU3OTUsImV4cCI6MjA4NTM5MTc5NX0.U2IW5-pYLTlqpxC1ToktWedyxHuyHQB9YnLa4wsZDBE";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let myMasterSubscription = null;

// ၂။ ACCESS CONTROL & SECURITY (From New Project)
async function checkAccess() {
    const { data: { session } } = await db.auth.getSession();
    const path = window.location.pathname;
    const isPublicPage = path.includes('login.html') || path.includes('register.html') || path.includes('blog-grid.html');

    if (!session) {
        if (!isPublicPage) {
            window.location.href = 'blog-grid.html'; 
        }
    } else {
        if (isPublicPage) {
            window.location.href = 'index.html';
        }
        // Session ရှိရင် User ID ကိုယူပြီး Real-time ချိတ်မယ်
        initMasterSystem(session.user.id);
    }
}

// ၃။ REAL-TIME ROUTING SYSTEM (From Old Project - Improved)
async function initMasterSystem(uid) {
    console.log("🚀 Initializing Routing System for ID:", uid);

    // Chat History ဆွဲတင်ခြင်း (chat.js ထဲမှာ ရှိရပါမယ်)
    if (typeof loadChatHistory === "function") {
        await loadChatHistory(uid);
    }

    if (myMasterSubscription) db.removeChannel(myMasterSubscription);

    myMasterSubscription = db.channel('user-exclusive-channel')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `uid=eq.${uid}` }, 
            (payload) => {
                const msg = payload.new;
                if (msg.is_admin === true) {
                    if (typeof renderTextMessage === "function") {
                        msg.type === 'text' ? renderTextMessage(msg.content, 'left') : renderImageMessage(msg.content, 'left');
                    }
                }
            }
        )
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, 
            (payload) => {
                const newBal = payload.new.content.balance;
                const balEl = document.getElementById('user-balance');
                if(balEl) balEl.innerText = `$${parseFloat(newBal).toFixed(2)}`;
            }
        )
        .subscribe();
}

// ၄။ UI UTILITIES (Toasts, Nav, Loaders)
function showToast(msg, type) {
    const x = document.getElementById("toast-box");
    if(!x) return;
    x.innerText = msg;
    x.className = "show " + type; 
    setTimeout(() => { x.className = x.className.replace("show", ""); }, 3000);
}

function nav(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById('btn-' + pageId);
    if(navBtn) navBtn.classList.add('active');
}

function hideLoader() {
    const loader = document.getElementById('preloader');
    if (loader) loader.style.display = 'none';
}

function generatePremiumUID() {
    return Math.floor(100000 + Math.random() * 900000);
}

// ၅။ AUTH ACTIONS
async function logout() {
    const { error } = await db.auth.signOut();
    if (!error) {
        localStorage.removeItem('sgx_user_id'); // Backup cleanup
        window.location.href = 'blog-grid.html'; 
    }
}

// ၆။ STARTUP INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    // ပထမဆုံး ဝင်ခွင့် ရှိ/မရှိ စစ်မယ်
    await checkAccess();
    
    // Loader ဖျောက်မယ်
    hideLoader();

    // Slider ရှိရင် Run မယ်
    if (typeof startSlider === "function") startSlider();
});