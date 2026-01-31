/* --- BIBCOIN UI MANAGER --- */

// User Data ဆွဲထုတ်ပြီး ပြသခြင်း
async function loadUserProfile() {
    const { data: { user } } = await db.auth.getUser();

    if (user) {
        // Database ထဲက အချက်အလက်တွေ သွားယူမယ်
        const { data, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) {
            console.log("User Data Loaded:", data);
            
            // HTML ထဲက စာတွေကို လိုက်ပြောင်းမယ်
            // (မင်းရဲ့ index.html မှာ id="user-uid", id="user-balance" ရှိဖို့လိုမယ်)
            
            // ဥပမာ - UID ပြတဲ့နေရာရှိရင်
            const uidEl = document.getElementById('user-uid');
            if(uidEl) uidEl.innerText = data.uid;

            // ဥပမာ - Balance ပြတဲ့နေရာရှိရင်
            const balanceEl = document.getElementById('user-balance');
            if(balanceEl) balanceEl.innerText = `$ ${data.balance.toFixed(2)}`;

            // Loading စာသားဖျောက်ပြီး Dashboard အစစ်ကို ပြမယ်
            // (လောလောဆယ် loading div ကိုပဲ ဖျောက်ပြမယ်)
            const loadingMsg = document.querySelector('#app-content p');
            if(loadingMsg && loadingMsg.innerText === "Loading System...") {
                loadingMsg.innerText = "System Ready! Welcome " + data.username;
            }
        }
    }
}

// Page ပွင့်တာနဲ့ Data စဆွဲမယ်
loadUserProfile();