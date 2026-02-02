// Assets Logic
let userCurrentBalance = 0.00;
let isHidden = false;

async function loadUserAssets() {
    // 1. Session စစ်ဆေးမယ်
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 2. Profiles Table ကနေ UID နဲ့ Balance ကို ဆွဲထုတ်မယ်
    const { data, error } = await supabase
        .from('profiles')
        .select('user_uid, balance')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error("Assets Loading Error:", error.message);
        return;
    }

    if (data) {
        // UID ပြောင်းလဲခြင်း (User ပြောင်းလို့မရပါ)
        const uidLabel = document.getElementById('user-uid');
        uidLabel.innerText = `UID: ${data.user_uid}`;

        // UID ကို နှိပ်ရင် Copy ကူးဖို့ Logic
        document.getElementById('copy-uid-btn').onclick = () => {
            navigator.clipboard.writeText(data.user_uid);
            alert("UID Copied: " + data.user_uid);
        };

        // Balance ကို သိမ်းထားပြီး UI ကို Update လုပ်မယ်
        userCurrentBalance = data.balance || 0.00;
        updateBalanceUI();
    }
}

// မျက်လုံး နှိပ်လိုက်ရင် ဝှက်မယ်/ပြမယ်
document.getElementById('toggle-eye').addEventListener('click', () => {
    isHidden = !isHidden;
    updateBalanceUI();
});

// Balance ပြသပုံကို ထိန်းချုပ်တဲ့ Function
function updateBalanceUI() {
    const balanceDisplay = document.getElementById('user-balance');
    const eyeIcon = document.getElementById('toggle-eye');

    if (isHidden) {
        balanceDisplay.innerText = "$****.**";
        eyeIcon.style.opacity = "0.3"; // ပိတ်ထားရင် အရောင်မှိန်ပြမယ်
    } else {
        // ကိန်းဂဏန်းကို လှလှပပ ပြမယ် (ဥပမာ- 1,234.50)
        balanceDisplay.innerText = "$" + parseFloat(userCurrentBalance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        eyeIcon.style.opacity = "0.7";
    }
}

// Page ပွင့်တာနဲ့ Run မယ်
window.addEventListener('load', loadUserAssets);