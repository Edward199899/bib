/* ==========================================
   ADMIN DASHBOARD CONTROLLER (FIXED VERSION)
   ========================================== */

// Global Variables
let adminDB = null;
let currentChatUID = null;
let chatSubscription = null;
let currentFundMode = 'add'; // 'add' or 'subtract'

document.addEventListener('DOMContentLoaded', () => {
    console.log("Admin Panel: Initializing...");
    
    // Check for Supabase Connection from core.js
    const checkDB = setInterval(() => {
        if (window.db) {
            clearInterval(checkDB);
            adminDB = window.db;
            console.log("Admin Panel: Database Connected! 🟢");
            startAdminSystem();
        }
    }, 500); // Check every 500ms
});

function startAdminSystem() {
    // 1. Load All Users
    fetchAllUsers();
    
    // 2. Start Chat Listener
    initChatListener();
    
    // 3. Remove Loading Screen (If you have one in HTML)
    const loader = document.getElementById('admin-loader');
    if(loader) loader.style.display = 'none';
}

/* ==========================================
   TAB 1: USER MANAGEMENT (WIN/LOSE/RATE)
   ========================================== */

window.fetchAllUsers = async function() {
    const container = document.getElementById('all-users-container');
    if(!container) return;

    container.innerHTML = '<div style="color:white; text-align:center;">Loading users...</div>';

    // Fetch profiles from Supabase
    const { data: users, error } = await adminDB
        .from('profiles') // Make sure this matches your table name
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch Error:", error);
        container.innerHTML = `<div style="color:red;">Error loading users. Check console.</div>`;
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-row search-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333;">
            <div class="user-info" style="display:flex; gap:10px; align-items:center;">
                <div class="avatar" style="width:35px; height:35px; background:#0D8ABC; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:white;">
                    ${user.user_uid ? user.user_uid.substring(0,1) : 'U'}
                </div>
                <div>
                    <div style="font-weight: bold; color:white;">User ${user.user_uid || 'Unknown'}</div>
                    <div style="font-size: 11px; color: #00e676;">UID: ${user.user_uid}</div>
                    <div style="font-size: 11px; color: #888;">Bal: $${parseFloat(user.balance || 0).toFixed(2)}</div>
                </div>
            </div>
            
            <div class="control-panel" style="display:flex; align-items:center; gap:10px;">
                <div class="d-flex gap-1">
                    <button class="btn-toggle ${user.trade_mode === 'win' ? 'active-win' : ''}" 
                        style="background:${user.trade_mode === 'win' ? '#00e676' : '#333'}; color:white; border:none; padding:5px 10px; font-size:10px; cursor:pointer;"
                        onclick="updateTradeSettings('${user.id}', 'win')">WIN</button>
                    
                    <button class="btn-toggle ${user.trade_mode === 'lose' ? 'active-lose' : ''}" 
                        style="background:${user.trade_mode === 'lose' ? '#ff3d00' : '#333'}; color:white; border:none; padding:5px 10px; font-size:10px; cursor:pointer;"
                        onclick="updateTradeSettings('${user.id}', 'lose')">LOSE</button>
                </div>

                <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1);"></div>

                <div class="d-flex align-items-center gap-1">
                    <input type="number" value="${user.win_rate || 80}" 
                        onchange="updateTradeRate('${user.id}', this.value)" 
                        style="width: 45px; text-align: center; background:transparent; border:1px solid #555; color:white; border-radius:4px;">
                    <span style="font-size: 12px; color: #888;">%</span>
                </div>
            </div>
        </div>
    `).join('');
};

window.updateTradeSettings = async function(userId, mode) {
    await adminDB.from('profiles').update({ trade_mode: mode }).eq('id', userId);
    fetchAllUsers(); // Refresh UI
};

window.updateTradeRate = async function(userId, rate) {
    await adminDB.from('profiles').update({ win_rate: parseInt(rate) }).eq('id', userId);
};

window.filterUserList = function() {
    const val = document.getElementById('user-search-input').value.toLowerCase();
    document.querySelectorAll('.search-item').forEach(el => {
        el.style.display = el.innerText.toLowerCase().includes(val) ? "flex" : "none";
    });
};

/* ==========================================
   TAB 2: FUNDS MANAGER
   ========================================== */

window.checkUserForFunds = async function() {
    const uidInput = document.getElementById('fund-search-uid');
    if(!uidInput) return;
    
    const uid = uidInput.value.trim();
    if(!uid) return alert("Please enter a UID");

    const { data, error } = await adminDB.from('profiles').select('*').eq('user_uid', uid).single();
    
    if(error || !data) {
        alert("User Not Found!");
        document.getElementById('fund-action-area').style.display = 'none';
    } else {
        document.getElementById('fund-action-area').style.display = 'block';
        document.getElementById('fund-target-uid').innerText = data.user_uid;
        document.getElementById('fund-target-balance').innerText = parseFloat(data.balance).toFixed(2);
        document.getElementById('fund-target-db-id').value = data.id;
    }
};

window.setFundMode = function(mode) {
    currentFundMode = mode;
    // Optional: Visual feedback on buttons
    document.querySelectorAll('.fund-btn').forEach(b => b.style.opacity = '0.5');
    event.target.style.opacity = '1';
};

window.confirmFundUpdate = async function() {
    const dbId = document.getElementById('fund-target-db-id').value;
    const amountInput = document.getElementById('fund-amount');
    const amount = parseFloat(amountInput.value);

    if(!amount || amount <= 0) return alert("Invalid Amount");

    // Get fresh balance first
    const { data: user } = await adminDB.from('profiles').select('balance').eq('id', dbId).single();
    
    let newBal = currentFundMode === 'add' 
        ? (parseFloat(user.balance) + amount) 
        : (parseFloat(user.balance) - amount);
    
    const { error } = await adminDB.from('profiles').update({ balance: newBal }).eq('id', dbId);
    
    if(!error) {
        alert(`Successfully ${currentFundMode}ed $${amount}`);
        amountInput.value = '';
        checkUserForFunds(); // Refresh display
        fetchAllUsers(); // Refresh main list
    } else {
        alert("Transaction Failed: " + error.message);
    }
};

/* ==========================================
   TAB 3: REAL-TIME CHAT SYSTEM
   ========================================== */

function initChatListener() {
    if (chatSubscription) adminDB.removeChannel(chatSubscription);

    console.log("Chat System: Listening for messages...");

    chatSubscription = adminDB.channel('admin-global-chat')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            (payload) => {
                const newMsg = payload.new;
                
                // 1. Refresh the sidebar list (to show new user or move to top)
                refreshChatList();
                
                // 2. If we are currently chatting with this user, append message immediately
                if (currentChatUID && currentChatUID == newMsg.uid) {
                    appendMessageToUI(newMsg.content, newMsg.is_admin ? 'admin' : 'user', newMsg.created_at);
                } else {
                    // Optional: Play a sound or show a notification dot here
                }
            }
        ).subscribe();
    
    refreshChatList();
}

async function refreshChatList() {
    const listContainer = document.getElementById('chat-user-list');
    if(!listContainer) return;

    // Get all messages to find unique users
    // Note: In production, better to have a 'conversations' table. 
    // For now, we distinct by UID from messages.
    const { data } = await adminDB
        .from('messages')
        .select('uid, created_at')
        .order('created_at', { ascending: false });

    if(data) {
        // Filter unique UIDs
        const uniqueUIDs = [...new Set(data.map(m => m.uid))];

        listContainer.innerHTML = uniqueUIDs.map(uid => `
            <div class="chat-avatar-wrapper ${currentChatUID === uid ? 'active' : ''}" 
                 onclick="openChat('${uid}')"
                 style="padding:10px; cursor:pointer; display:flex; align-items:center; border-bottom:1px solid #333; background:${currentChatUID === uid ? '#1a1a1a' : 'transparent'};">
                
                <div class="chat-avatar" style="width:40px; height:40px; background:#333; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; margin-right:10px;">
                    ${uid.substring(0,2).toUpperCase()}
                </div>
                <div>
                    <div style="font-size:12px; color:white;">User: ${uid.substring(0,8)}...</div>
                    <div style="font-size:10px; color:#888;">Tap to chat</div>
                </div>
            </div>
        `).join('');
    }
}

window.openChat = async function(uid) {
    currentChatUID = uid;
    
    // Update Header
    const headerTitle = document.getElementById('chat-header-uid');
    if(headerTitle) headerTitle.innerText = `Chatting with: ${uid}`;
    
    refreshChatList(); // To update 'active' styling

    // Load Messages
    const { data } = await adminDB
        .from('messages')
        .select('*')
        .eq('uid', uid)
        .order('created_at', { ascending: true });

    const display = document.getElementById('admin-chat-display');
    display.innerHTML = ""; // Clear old chat

    if(data) {
        data.forEach(m => {
            appendMessageToUI(m.content, m.is_admin ? 'admin' : 'user', m.created_at);
        });
    }
};

window.sendAdminReply = async function() {
    const input = document.getElementById('admin-reply-input');
    const text = input.value.trim();

    if(!currentChatUID) return alert("Select a user to chat with first!");
    if(!text) return;

    // 1. Update UI Immediately (Optimistic UI)
    appendMessageToUI(text, 'admin', new Date().toISOString());

    // 2. Send to Database
    const { error } = await adminDB.from('messages').insert([
        { 
            uid: currentChatUID, 
            content: text, 
            is_admin: true,
            type: 'text' // As per your schema
        }
    ]);

    if(!error) {
        input.value = "";
    } else {
        alert("Failed to send: " + error.message);
    }
};

window.handleEnter = function(e) {
    if(e.key === 'Enter') sendAdminReply();
};

function appendMessageToUI(text, sender, time = null) {
    const display = document.getElementById('admin-chat-display');
    if(!display) return;

    const div = document.createElement('div');
    // Styling classes based on sender
    // sender 'admin' = Right side (Sent)
    // sender 'user' = Left side (Received)
    
    const isMe = sender === 'admin';
    
    div.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: ${isMe ? 'flex-end' : 'flex-start'};
        margin-bottom: 10px;
        width: 100%;
    `;

    const timeStr = time ? new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
    
    div.innerHTML = `
        <div style="
            background: ${isMe ? 'linear-gradient(135deg, #005ED3 0%, #02EBFD 100%)' : 'rgba(255, 255, 255, 0.1)'};
            color: ${isMe ? 'white' : '#e0e0e0'};
            padding: 8px 12px;
            border-radius: 15px;
            border-${isMe ? 'bottom-right' : 'bottom-left'}-radius: 2px;
            max-width: 70%;
            word-wrap: break-word;
            font-size: 14px;
        ">${text}</div>
        <div style="font-size: 9px; opacity: 0.5; margin-top: 3px; color:#888;">${timeStr}</div>
    `;

    display.appendChild(div);
    display.scrollTop = display.scrollHeight; // Auto scroll to bottom
}