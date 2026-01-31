/* --- BIBCOIN AUTH: REGISTER SYSTEM --- */
function generateUID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function handleRegister() {
    const username = document.getElementById('reg-username').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;

    const { data, error } = await db.auth.signUp({
        email: `${phone}@bibcoin.com`, // Phone ကို Email format ပြောင်းသိမ်းမယ်
        password: password
    });

    if (error) return alert("Register Error: " + error.message);

    if (data.user) {
        const newUID = generateUID();
        await db.from('profiles').insert([
            { id: data.user.id, username: username, uid: newUID, balance: 0 }
        ]);
        alert("Account Created! UID: " + newUID);
        window.location.href = 'index.html';
    }
}