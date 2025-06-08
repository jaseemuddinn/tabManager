//get tab groups
function getGroups() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['tabGroups'], (result) => {
            resolve(result.tabGroups || {});
        });
    });
}

// Helper to save groups
function saveGroups(groups) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ tabGroups: groups }, resolve);
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'getGroups') {
        getGroups().then(sendResponse);
        return true;
    }
    if (msg.action === 'createGroup') {
        getGroups().then(groups => {
            if (!groups[msg.groupName]) {
                groups[msg.groupName] = [];
                saveGroups(groups).then(() => sendResponse({ success: true }));
            } else {
                sendResponse({ success: false, error: 'Group exists' });
            }
        });
        return true;
    }
    if (msg.action === 'addTabToGroup') {
        getGroups().then(groups => {
            if (!groups[msg.groupName]) {
                sendResponse({ success: false, error: 'Group not found' });
                return;
            }
            if (!groups[msg.groupName].includes(msg.tabId)) {
                groups[msg.groupName].push(msg.tabId);
                saveGroups(groups).then(() => sendResponse({ success: true }));
            } else {
                sendResponse({ success: false, error: 'Tab already in group' });
            }
        });
        return true;
    }
    if (msg.action === 'removeGroup') {
        getGroups().then(groups => {
            delete groups[msg.groupName];
            saveGroups(groups).then(() => sendResponse({ success: true }));
        });
        return true;
    }
    if (msg.action === 'hideGroup') {
        getGroups().then(groups => {
            const tabIds = groups[msg.groupName] || [];
            chrome.tabs.hide(tabIds, () => sendResponse({ success: true }));
        });
        return true;
    }
    if (msg.action === 'showGroup') {
        getGroups().then(groups => {
            const tabIds = groups[msg.groupName] || [];
            chrome.tabs.show(tabIds, () => sendResponse({ success: true }));
        });
        return true;
    }
    if (msg.action === 'getTabInfo') {
        chrome.tabs.get(msg.tabId, (tab) => {
            sendResponse({ tab });
        });
        return true;
    }
});
