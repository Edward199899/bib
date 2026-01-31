async function displayDashboard() {
    const { data: { user } } = await db.auth.getUser();
    if (user) {
        const { data } = await db.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            // UI ထဲမှာ Data တွေ လိုက်ထည့်မယ်
            if(document.getElementById('user-uid')) document.getElementById('user-uid').innerText = data.uid;
            if(document.getElementById('user-balance')) document.getElementById('user-balance').innerText = data.balance;
            
            // Loading Message ကို ဖျောက်မယ်
            const loadingText = document.querySelector('#app-content p');
            if(loadingText) loadingText.style.display = 'none';
            console.log("Dashboard Ready!");
        }
    }
}
displayDashboard();