/* --- BIBCOIN SMART AUTH SYSTEM --- */

// ၁။ UID Random ၆ လုံး ထုတ်ပေးခြင်း
function generateUID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ၂။ Register လုပ်ခြင်း (ဖုန်းနံပါတ်ပါ Profile ထဲ ထည့်သိမ်းမယ်)
async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !phone || !password) return alert("အကုန်ဖြည့်ပါ");

    // ဖုန်းနံပါတ်ကို Email အတုပြောင်းမယ်
    const fakeEmail = phone + "@bibcoin.com";

    // A. Auth မှာ အကောင့်ဖွင့်မယ်
    const { data, error } = await db.auth.signUp({
        email: fakeEmail,
        password: password
    });

    if (error) return alert("Register Error: " + error.message);

    if (data.user) {
        const newUID = generateUID();
        
        // B. Profile ထဲမှာ ဖုန်းနံပါတ်ပါ ထည့်သိမ်းမယ် (ဒါမှ Username နဲ့ပြန်ရှာလို့ရမှာ)
        const { error: profileError } = await db.from('profiles').insert([
            { 
                id: data.user.id, 
                username: username, 
                phone: phone, // 🔥 ဒါလေး အသစ်ထပ်ထည့်လိုက်တယ်
                uid: newUID, 
                balance: 0 
            }
        ]);

        if (!profileError) {
            alert("Account Created! UID: " + newUID);
            window.location.href = 'index.html';
        }
    }
}

// ၃။ Login ဝင်ခြင်း (Username OR Phone)
async function handleLogin() {
    // HTML မှာ ID က login-phone ဖြစ်နေလည်း ကိစ္စမရှိဘူး၊ Username ရိုက်လည်း လက်ခံမယ်
    const input = document.getElementById('login-phone').value.trim(); 
    const password = document.getElementById('login-password').value.trim();

    if (!input || !password) return alert("အချက်အလက်များ ဖြည့်ပါ");

    let finalEmail = "";

    // စစ်ဆေးချက် - ရိုက်ထည့်လိုက်တာက ဖုန်းနံပါတ်လား? (ဂဏန်းသက်သက်ပဲလား)
    const isPhoneNumber = /^\d+$/.test(input);

    if (isPhoneNumber) {
        // (A) ဖုန်းနံပါတ်ဆိုရင် - တန်းပြီး Login ဝင်မယ်
        finalEmail = input + "@bibcoin.com";
    } else {
        // (B) Username ဆိုရင် - သူ့ဖုန်းနံပါတ်ကို Database မှာ အရင်ရှာမယ်
        const { data, error } = await db
            .from('profiles')
            .select('phone')
            .eq('username', input) // Username နဲ့ တိုက်စစ်မယ်
            .single();

        if (error || !data) {
            return alert("Username မရှိပါ (သို့မဟုတ်) မှားယွင်းနေပါသည်။");
        }

        // ဖုန်းနံပါတ်တွေ့ပြီဆိုမှ Login ဆက်လုပ်မယ်
        finalEmail = data.phone + "@bibcoin.com";
    }

    // Login လုပ်ငန်းစဉ်
    const { error } = await db.auth.signInWithPassword({
        email: finalEmail,
        password: password
    });

    if (error) {
        alert("Password မှားယွင်းနေပါသည် (သို့မဟုတ်) အကောင့်မရှိပါ။");
    } else {
        window.location.href = 'index.html';
    }
}