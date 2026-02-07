/* --- SGX INTEGRATED AUTHENTICATION SYSTEM --- */

// ၁။ စနစ်ချိတ်ဆက်မှု စစ်ဆေးခြင်း
if (typeof db === 'undefined') {
    console.error("CRITICAL ERROR: Core System (db) not loaded!");
}

// ၂။ REGISTER FUNCTION (အဟောင်းမှ Validation + အသစ်မှ Auth Logic)
async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const confirmPass = document.getElementById('reg-confirm-pass').value.trim();
    const isAgree = document.getElementById('reg-rule').checked;
    const btn = document.querySelector('.btn-neon');

    // Validation စစ်ဆေးခြင်း
    if (!username || !phone || !pass) return showToast("Fill all fields!", "error");
    if (pass !== confirmPass) return showToast("Passwords do not match!", "error");
    if (!isAgree) return showToast("Agree to Team Rules first!", "error");

    // Loading State ပြောင်းမယ်
    const originalText = btn.innerText;
    btn.innerText = "Creating Account...";
    btn.disabled = true;

    // Supabase Auth အတွက် Fake Email ပြောင်းလဲခြင်း
    const emailFake = phone + "@bibcoin.com";
    
    // (A) Supabase Auth မှာ User အသစ်ဆောက်ခြင်း
    const { data, error: authError } = await db.auth.signUp({
        email: emailFake,
        password: pass
    });

    if (authError) {
        showToast("Error: " + authError.message, "error");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    // (B) UID (ဂဏန်း ၆ လုံး) ထုတ်ခြင်း
    const randomUID = Math.floor(100000 + Math.random() * 900000);

    // (C) Profiles Table ထဲသို့ အချက်အလက်များ သိမ်းဆည်းခြင်း
    const { error: profileError } = await db
        .from('profiles') // Table name ကို သတိပြုပါ (profiles သို့မဟုတ် users)
        .insert([
            { 
                id: data.user.id, 
                username: username,
                phone: phone,
                balance: 0.00,
                uid: randomUID,
                joinDate: new Date().toISOString()
            }
        ]);

    if (profileError) {
        showToast("Profile Error: " + profileError.message, "error");
        btn.innerText = originalText;
        btn.disabled = false;
    } else {
        localStorage.setItem('sgx_user_id', data.user.id); // Compatibility အတွက် သိမ်းထားခြင်း
        showToast("Account Created Successfully!", "success");
        setTimeout(() => window.location.href = 'index.html', 1500);
    }
}

// ၃။ LOGIN FUNCTION (အဟောင်းမှ Chat Trigger + အသစ်မှ Auth Logic)
async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const btn = document.querySelector('.btn-login') || document.querySelector('.btn-neon');

    if (!phone || !pass) return showToast("Please fill all info", "error");

    if(btn) btn.innerText = "Checking...";
    
    const emailFake = phone + "@bibcoin.com";

    // (A) Supabase Auth ဖြင့် Login ဝင်ခြင်း
    const { data, error: loginError } = await db.auth.signInWithPassword({
        email: emailFake,
        password: pass
    });

    if (loginError) {
        showToast("Login Failed: ဖုန်းနံပါတ် သို့မဟုတ် Password မှားနေပါသည်", "error");
        if(btn) btn.innerText = "ENTER UNIVERSE";
    } else {
        // (B) Login အောင်မြင်လျှင် Session သိမ်းပြီး Profile Data ယူမယ်
        localStorage.setItem('sgx_user_id', data.user.id);
        
        // Profile data ကို ဆွဲယူခြင်း (Balance ရော UID ရော ပါအောင်လို့ပါ)
        const { data: profile } = await db.from('profiles').select('*').eq('id', data.user.id).single();
        
        if (profile) {
            // UI Transition & Chat Trigger
            if (typeof enterUniverse === 'function') enterUniverse(profile);
            if (typeof initMasterSystem === 'function') initMasterSystem(data.user.id);
        }

        showToast("Welcome back!", "success");
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
}

// ၄။ UI HELPERS
function showRegister() {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    if(loginBox) loginBox.style.display = 'none';
    if(registerBox) registerBox.style.display = 'block';
}

function showLogin() {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    if(registerBox) registerBox.style.display = 'none';
    if(loginBox) loginBox.style.display = 'block';
}