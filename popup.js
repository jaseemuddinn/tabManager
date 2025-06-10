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

            // Hide group
            const hideBtn = document.createElement('button');
            hideBtn.textContent = 'Hide';
            hideBtn.onclick = async () => {
                await sendMessage({ action: 'hideGroup', groupName });
                renderGroups();
            };

            // Show group
            const showBtn = document.createElement('button');
            showBtn.textContent = 'Show';
            showBtn.onclick = async () => {
                await sendMessage({ action: 'showGroup', groupName });
                renderGroups();
            };

            // Remove group
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = async () => {
                await sendMessage({ action: 'removeGroup', groupName });
                renderGroups();
            };

            // Collapse/Expand group (show tab URLs)
            const collapseBtn = document.createElement('button');
            collapseBtn.textContent = 'Expand';
            let expanded = false;
            let tabListDiv = null;
            collapseBtn.onclick = async () => {
                expanded = !expanded;
                collapseBtn.textContent = expanded ? 'Collapse' : 'Expand';
                if (expanded) {
                    if (!tabListDiv) {
                        tabListDiv = document.createElement('div');
                        tabListDiv.style.marginTop = '0.5rem';
                        tabListDiv.style.fontSize = '0.95em';
                        tabListDiv.style.color = '#444';
                        const tabInfos = await sendMessage({ action: 'getTabInfos', tabIds });
                        tabListDiv.innerHTML = tabInfos.length
                            ? tabInfos.map(tab => `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                <a href="${tab.url}" target="_blank" style="color:#2a3a5e;text-decoration:none;">${tab.title || tab.url}</a>
                            </div>`).join('')
                            : '<em>No tabs found</em>';
                        groupDiv.append(tabListDiv);
                    } else {
                        tabListDiv.style.display = '';
                    }
                } else if (tabListDiv) {
                    tabListDiv.style.display = 'none';
                }
            };

            // Focus mode: Only show this group, hide all others
            const focusBtn = document.createElement('button');
            focusBtn.textContent = 'Focus';
            focusBtn.onclick = async () => {
                await sendMessage({ action: 'focusGroup', groupName });
                renderGroups();
            };

            actions.append(collapseBtn, hideBtn, showBtn, focusBtn, removeBtn);
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
