/* --- DEF-ADMIN MASTER LOGIC --- */

// core.js က db ကို သုံးမယ်
const adminDB = window.db; 

let currentFundMode = 'add';
let currentChatUID = null;
let chatSubscription = null;

// ==========================================
// 1. SYSTEM STARTUP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin System Online...");
    // core.js load ဖြစ်ချိန်ကို ခဏစောင့်မယ်
    setTimeout(() => {
        fetchAllUsers(); // Tab 1
        initChatListener(); // Tab 3
    }, 800);
});

// ==========================================
// 2. TAB 1: USER CONTROL (WIN/LOSE/RATE)
// ==========================================
async function fetchAllUsers() {
    const container = document.getElementById('all-users-container');
    const { data: users, error } = await adminDB.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) { container.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`; return; }

    container.innerHTML = users.map(user => `
        <div class="user-row search-item">
            <div class="user-info">
                <div class="avatar" style="background: #0D8ABC">${user.user_uid.substring(0,1)}</div>
                <div>
                    <div style="font-weight: bold;">User ${user.user_uid}</div>
                    <div style="font-size: 11px; color: #00e676;">UID: ${user.user_uid}</div>
                    <div style="font-size: 11px; color: #888;">Bal: $${parseFloat(user.balance || 0).toFixed(2)}</div>
                </div>
            </div>
            <div class="control-panel">
                <div class="d-flex gap-1">
                    <button class="btn-toggle win ${user.trade_mode === 'win' ? 'active' : ''}" onclick="updateTradeSettings('${user.id}', 'win')">WIN</button>
                    <button class="btn-toggle lose ${user.trade_mode === 'lose' ? 'active' : ''}" onclick="updateTradeSettings('${user.id}', 'lose')">LOSE</button>
                </div>
                <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 10px;"></div>
                <div class="d-flex align-items-center gap-1">
                    <input type="number" class="cyber-input" value="${user.win_rate || 80}" onchange="updateTradeRate('${user.id}', this.value)" style="width: 45px; text-align: center; background:transparent; border:1px solid #333; color:white;">
                    <span style="font-size: 12px; color: #888;">%</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateTradeSettings(userId, mode) {
    await adminDB.from('profiles').update({ trade_mode: mode }).eq('id', userId);
    fetchAllUsers();
}

async function updateTradeRate(userId, rate) {
    await adminDB.from('profiles').update({ win_rate: parseInt(rate) }).eq('id', userId);
}

// ==========================================
// 3. TAB 2: FUNDS MANAGER (DEPOSIT/WITHDRAW)
// ==========================================
async function checkUserForFunds() {
    const uid = document.getElementById('fund-search-uid').value.trim();
    const { data } = await adminDB.from('profiles').select('*').eq('user_uid', uid).single();
    if(data) {
        document.getElementById('fund-action-area').style.display = 'block';
        document.getElementById('fund-target-uid').innerText = data.user_uid;
        document.getElementById('fund-target-balance').innerText = parseFloat(data.balance).toFixed(2);
        document.getElementById('fund-target-db-id').value = data.id;
    } else alert("User Not Found!");
}

function setFundMode(mode) {
    currentFundMode = mode;
    alert("Mode: " + mode.toUpperCase());
}

async function confirmFundUpdate() {
    const dbId = document.getElementById('fund-target-db-id').value;
    const amount = parseFloat(document.getElementById('fund-amount').value);
    const { data: user } = await adminDB.from('profiles').select('balance').eq('id', dbId).single();
    
    let newBal = currentFundMode === 'add' ? (user.balance + amount) : (user.balance - amount);
    
    const { error } = await adminDB.from('profiles').update({ balance: newBal }).eq('id', dbId);
    if(!error) {
        alert("Success!");
        checkUserForFunds();
        fetchAllUsers();
    }
}

// ==========================================
// 4. TAB 3: REAL-TIME CHAT (အပြည့်အစုံ)
// ==========================================

// Chat ကို စောင့်ကြည့်မယ့် Listener
function initChatListener() {
    if (chatSubscription) adminDB.removeChannel(chatSubscription);

    chatSubscription = adminDB.channel('admin-global-chat')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            (payload) => {
                const newMsg = payload.new;
                refreshChatList();
                if (currentChatUID && currentChatUID == newMsg.uid && !newMsg.is_admin) {
                    appendMessageToUI(newMsg.content, 'user', newMsg.created_at);
                }
            }
        ).subscribe();
    
    refreshChatList();
}

// Chat Sidebar Update လုပ်ခြင်း
async function refreshChatList() {
    const { data } = await adminDB.from('messages').select('uid, created_at').order('created_at', { ascending: false });
    if(data) {
        const uniqueUIDs = [...new Set(data.map(m => m.uid))];
        const container = document.getElementById('chat-user-list');
        container.innerHTML = uniqueUIDs.map(uid => `
            <div class="chat-avatar-wrapper ${currentChatUID === uid ? 'active' : ''}" onclick="openChat('${uid}')">
                <div class="chat-avatar" style="background:#333; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px;">
                    ${uid.substring(0,3)}
                </div>
                <div class="online-dot"></div>
            </div>
        `).join('');
    }
}

// Chat Box ဖွင့်ခြင်း
async function openChat(uid) {
    currentChatUID = uid;
    document.getElementById('chat-header-uid').innerText = uid;
    refreshChatList();

    const { data } = await adminDB.from('messages').select('*').eq('uid', uid).order('created_at', { ascending: true });
    const display = document.getElementById('admin-chat-display');
    display.innerHTML = "";
    if(data) data.forEach(m => appendMessageToUI(m.content, m.is_admin ? 'admin' : 'user', m.created_at));
}

// Admin စာပြန်ခြင်း
async function sendAdminReply() {
    const input = document.getElementById('admin-reply-input');
    const text = input.value.trim();
    if(text && currentChatUID) {
        appendMessageToUI(text, 'admin');
        const { error } = await adminDB.from('messages').insert([{ uid: currentChatUID, content: text, is_admin: true }]);
        if(!error) input.value = "";
    }
}

// UI မှာ စာသားပြသခြင်း
function appendMessageToUI(text, sender, time = null) {
    const display = document.getElementById('admin-chat-display');
    const div = document.createElement('div');
    div.className = `msg msg-${sender}`;
    const timeStr = time ? new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
    div.innerHTML = `${text}<div style="font-size: 9px; opacity: 0.5; margin-top: 5px;">${timeStr}</div>`;
    display.appendChild(div);
    display.scrollTop = display.scrollHeight;
}

// Search & Enter Key Helper
function filterUserList() {
    const val = document.getElementById('user-search-input').value.toLowerCase();
    document.querySelectorAll('.search-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(val) ? "flex" : "none");
}
function handleEnter(e) { if(e.key === 'Enter') sendAdminReply(); }