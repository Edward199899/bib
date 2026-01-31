async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const fakeEmail = phone + "@bibcoin.com";

    const { error } = await db.auth.signInWithPassword({ email: fakeEmail, password: password });

    if (error) {
        alert("Login Error: ဖုန်းနံပါတ် သို့မဟုတ် Password မှားနေသည်");
    } else {
        window.location.href = 'index.html';
    }
}