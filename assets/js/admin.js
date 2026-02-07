// assets/js/admin.js

// ၁။ Admin ဟုတ်မဟုတ် စစ်ဆေးခြင်း
async function checkAdmin() {
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
        window.location.href = 'login.html'; // Login မဝင်ရသေးရင် မောင်းထုတ်
        return;
    }

    // Database ထဲမှာ role က 'admin' ဖြစ်မှ ပေးဝင်မယ်
    const { data: profile } = await db
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert("Access Denied! Admins Only.");
        window.location.href = 'index.html'; // Admin မဟုတ်ရင် User Dashboard ပြန်ပို့
    } else {
        // Admin ဖြစ်မှ Data တွေ စဆွဲမယ်
        loadAdminData();
    }
}

// ၂။ Dashboard Data ဆွဲထုတ်ခြင်း
async function loadAdminData() {
    // (က) User စုစုပေါင်း
    const { count: userCount } = await db.from('profiles').select('*', { count: 'exact', head: true });
    document.getElementById('total-users').innerText = userCount || 0;

    // (ခ) User စာရင်းလိုက်ပြခြင်း (Table ထဲထည့်မယ်)
    const { data: users } = await db.from('profiles').select('*').order('created_at', { ascending: false });
    
    const userTable = document.getElementById('user-list-body');
    userTable.innerHTML = ''; // ရှင်းလင်း

    users.forEach(user => {
        const row = `
            <tr>
                <td>${user.username}</td>
                <td>${user.phone}</td>
                <td>${user.uid}</td>
                <td>
                    <button onclick="manageUser('${user.id}')" class="btn btn-sm btn-primary">Manage</button>
                </td>
            </tr>
        `;
        userTable.innerHTML += row;
    });
}

// ၃။ ပိုက်ဆံ ဖြည့်/နုတ် လုပ်ခြင်း (User တစ်ယောက်ချင်းစီအတွက်)
async function manageUser(userId) {
    const amount = prompt("Enter Amount to Add (+ve) or Deduct (-ve):");
    if (!amount) return;

    // Assets table မှာ သွားပြင်မယ်
    const { data: asset } = await db.from('assets').select('amount').eq('user_id', userId).single();
    const newAmount = parseFloat(asset.amount) + parseFloat(amount);

    const { error } = await db.from('assets').update({ amount: newAmount }).eq('user_id', userId);

    if (error) alert("Error: " + error.message);
    else alert("Success! New Balance: " + newAmount);
}

// Page ပွင့်တာနဲ့ Admin စစ်မယ်
checkAdmin();