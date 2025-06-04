

(function () {
    'use strict';

    function sendMessage(msg) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(msg, resolve);
        });
    }

    async function renderGroups() {
        const groups = await sendMessage({ action: 'getGroups' });
        const container = document.getElementById('groups-container');
        container.innerHTML = '';
        for (const [groupName, tabIds] of Object.entries(groups)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group';
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span>${groupName} (${tabIds.length})</span>`;
            const actions = document.createElement('div');
            actions.className = 'group-actions';
            const hideBtn = document.createElement('button');
            hideBtn.textContent = 'Hide';
            hideBtn.onclick = async () => {
                await sendMessage({ action: 'hideGroup', groupName });
            };
            const showBtn = document.createElement('button');
            showBtn.textContent = 'Show';
            showBtn.onclick = async () => {
                await sendMessage({ action: 'showGroup', groupName });
            };
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = async () => {
                await sendMessage({ action: 'removeGroup', groupName });
                renderGroups();
            };
            actions.append(hideBtn, showBtn, removeBtn);
            header.append(actions);
            groupDiv.append(header);
            container.append(groupDiv);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderGroups();
        document.getElementById('create-group').onclick = async () => {
            const name = document.getElementById('new-group-name').value.trim();
            if (!name) return;
            await sendMessage({ action: 'createGroup', groupName: name });
            document.getElementById('new-group-name').value = '';
            renderGroups();
        };
        document.getElementById('add-current-tab').onclick = async () => {
            const name = document.getElementById('new-group-name').value.trim();
            if (!name) return;
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs.length) {
                    await sendMessage({ action: 'addTabToGroup', groupName: name, tabId: tabs[0].id });
                    renderGroups();
                }
            });
        };
    });
})();
