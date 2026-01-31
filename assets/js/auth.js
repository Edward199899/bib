/* --- BIBCOIN PREMIUM AUTH SYSTEM --- */

// ၁။ UID Random ၆ လုံး ထုတ်ပေးခြင်း
function generateUID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ၂။ Register လုပ်ခြင်း
async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !phone || !password) return alert("အကုန်ဖြည့်ပါ");

    // ဖုန်းနံပါတ်ကို @bibcoin.com အဖြစ် နောက်ကွယ်မှာ ပြောင်းလိုက်တယ်
    const fakeEmail = phone + "@bibcoin.com";

    const { data, error } = await db.auth.signUp({
        email: fakeEmail,
        password: password
    });

    if (error) return alert("Register Error: " + error.message);

    if (data.user) {
        const newUID = generateUID();
        const { error: profileError } = await db.from('profiles').insert([
            { id: data.user.id, username: username, uid: newUID, balance: 0 }
        ]);

        if (!profileError) {
            alert("Account Created! UID: " + newUID);
            window.location.href = 'index.html';
        }
    }
}

// ၃။ Login ဝင်ခြင်း
async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!phone || !password) return alert("ဖုန်းနံပါတ်နှင့် Password ဖြည့်ပါ");

    const fakeEmail = phone + "@bibcoin.com";

    const { error } = await db.auth.signInWithPassword({
        email: fakeEmail,
        password: password
    });

    if (error) {
        alert("Login Error: ဖုန်းနံပါတ် (သို့) Password မှားယွင်းနေပါသည်။");
    } else {
        window.location.href = 'index.html';
    }
}