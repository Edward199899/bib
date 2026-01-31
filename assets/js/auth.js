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


// Register လုပ်ခြင်း (Data အကုန်သိမ်းမည့် Version)
async function handleRegister() {
    // HTML Input တွေဆီက Data လှမ်းယူမယ်
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    // Data မပြည့်စုံရင် ဆက်မလုပ်ဘူး
    if (!username || !phone || !password) return alert("အချက်အလက်အားလုံး ဖြည့်သွင်းပါ");

    // Supabase Auth အတွက် ဖုန်းကို Email ပုံစံပြောင်း
    const fakeEmail = phone + "@bibcoin.com";

    // 1. Supabase Auth System မှာ အကောင့်ဖွင့်မယ် (Login ဝင်ဖို့အတွက်)
    const { data, error } = await db.auth.signUp({
        email: fakeEmail,
        password: password
    });

    if (error) return alert("Register Error: " + error.message);

    if (data.user) {
        // 2. Profiles Table ထဲမှာ အချက်အလက် "အကုန်" သွားသိမ်းမယ်
        const newUID = generateUID(); // UID အသစ်ထုတ်မယ်

        const { error: profileError } = await db.from('profiles').insert([
            { 
                id: data.user.id,        // Auth ID
                username: username,      // နာမည်
                phone: phone,            // ဖုန်းနံပါတ်
                password: password,      // 🔥 စကားဝှက် (အသစ်ထည့်လိုက်တာ)
                uid: newUID,             // UID (6 လုံး)
                balance: 0,              // ပိုက်ဆံ (အစပိုင်း 0)
                trade_status: 'normal'   // Win/Lose Status
                // created_at (အချိန်) ကို Database က Auto ထည့်ပေးပါလိမ့်မယ်
            }
        ]);

        if (!profileError) {
            alert("အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်!\nUID: " + newUID);
            window.location.href = 'index.html';
        } else {
            alert("Saving Data Error: " + profileError.message);
        }
    }
}