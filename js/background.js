var checkedUrlList = [
    'https://vk.com/',
    'https://twitter.com/'
];
var maxNumberOfOpenTabs = 6;
var numberOfOpenTabs = 1;
var parentTabsMap = [];

function deleteIfLimitIsExceeded(newTabId) {
    if (numberOfOpenTabs >= maxNumberOfOpenTabs) {
        chrome.tabs.remove(newTabId);
        alert(`Max number of tabs - ${maxNumberOfOpenTabs}`);
    }
}

function updateNumberOfOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        numberOfOpenTabs = tabs.length;        
    });
}

function updateMaxNubmerOfOpenTabs() {
    chrome.storage.sync.get('maxNumberOfOpenTabs', function(items) {
        if (items.maxNumberOfOpenTabs) {
            maxNumberOfOpenTabs = parseInt(items.maxNumberOfOpenTabs);
        } else {
            chrome.storage.sync.set({ 'maxNumberOfOpenTabs': maxNumberOfOpenTabs })
        }
    })
}

function onStartupHandler() {
    updateMaxNubmerOfOpenTabs();
}

function onStorageChangedHandler() {
    updateMaxNubmerOfOpenTabs();
}

function onTabCreatedHandler(tab) {
    updateNumberOfOpenTabs();
    if (checkedUrlList.indexOf(tab.pendingUrl) !== -1) {
        parentTabsMap.push({ id: tab.id, openerTabId: tab.openerTabId });
    }
    deleteIfLimitIsExceeded(tab.id);
    if (!tab.openerTabId) {
        chrome.tabs.move(tab.id, { windowId: null, index: 0 });
    }
}

function onTabRemovedHandler(removedTabId) {
    updateNumberOfOpenTabs();
    parentTabsMap.filter(tab => tab.id != removedTabId);
    parentTabsMap.forEach(tab => {
        if (tab.openerTabId == removedTabId) {
            chrome.tabs.remove(tab.id);
        }
    })    
}

function init() {
    chrome.runtime.onStartup.addListener(onStartupHandler);
    chrome.tabs.onCreated.addListener(onTabCreatedHandler);
    chrome.tabs.onRemoved.addListener(onTabRemovedHandler);
    chrome.storage.onChanged.addListener(onStorageChangedHandler);
}

init();






