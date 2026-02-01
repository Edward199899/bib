/* --- AUTHENTICATION SYSTEM --- */

// 1. REGISTER FUNCTION
async function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const btn = document.querySelector('.btn-neon'); // Loading ပြဖို့

    if (!username || !phone || !password) {
        alert("Please fill all fields!");
        return;
    }

    // Loading ပြမယ်
    const originalText = btn.innerText;
    btn.innerText = "Creating Account...";
    btn.disabled = true;

    // Supabase မှာ User အသစ်ဆောက်မယ်
    const emailFake = phone + "@bibcoin.com"; // Phone ကို Email အတုပြောင်း
    
    const { data, error } = await db.auth.signUp({
        email: emailFake,
        password: password
    });

    if (error) {
        alert("Error: " + error.message);
        btn.innerText = originalText;
        btn.disabled = false;
    } else {
        // 🔥 အရေးကြီးဆုံးအဆင့်: Profiles Table ထဲ Data ထည့်မယ် 🔥
        const { error: profileError } = await db
            .from('profiles')
            .insert([
                { 
                    id: data.user.id, // Auth ID နဲ့ချိတ်မယ်
                    username: username,
                    phone: phone,
                    balance: 0.00
                }
            ]);

        if (profileError) {
            alert("Profile Save Error: " + profileError.message);
        } else {
            alert("Account Created Successfully!");
            window.location.href = 'index.html'; // Index ကိုပို့မယ်
        }
    }
}

// 2. LOGIN FUNCTION
async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const btn = document.querySelector('.btn-login');

    if (!phone || !password) {
        alert("Please fill all fields!");
        return;
    }

    // Loading...
    btn.innerText = "Checking...";
    
    const emailFake = phone + "@bibcoin.com";

    const { data, error } = await db.auth.signInWithPassword({
        email: emailFake,
        password: password
    });

    if (error) {
        alert("Login Failed: ဖုန်းနံပါတ် သို့မဟုတ် Password မှားနေပါသည်");
        btn.innerText = "LOGIN";
    } else {
        // Login မှန်ရင် Index ကိုတန်းပို့မယ် (Data မပြဘူး)
        window.location.href = 'index.html';
    }
}