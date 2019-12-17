var checkedUrlList = [
    'https://vk.com/',
    'https://twitter.com/'
];
var maxNumberOfOpenTabs = 6;
var numberOfOpenTabs = 1;
var parentTabsMap = {};

function deleteIfLimitIsExceeded(newTabId) {
    if (numberOfOpenTabs >= maxNumberOfOpenTabs) {
        chrome.tabs.remove(newTabId);
    }
}

function updateNumberOfOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        numberOfOpenTabs = tabs.length;
    });
}

function updateMaxNubmerOfOpenTabs() {
    chrome.storage.sync.get('maxNumberOfOpenTabs', function (items) {
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
    deleteIfLimitIsExceeded(tab.id);
    if (!tab.openerTabId) {
        chrome.tabs.move(tab.id, { windowId: null, index: 0 });
    }
}

function onTabRemovedHandler(removedTabId) {
    updateNumberOfOpenTabs();
    const deps = parentTabsMap[removedTabId];
    if (deps) {
        chrome.tabs.remove(parentTabsMap[removedTabId].childrenTabId);
        delete parentTabsMap[removedTabId];
    }
}

function onCreatedNavigationTargetHandler(details) {
    if (checkedUrlList.indexOf(details.url) !== -1) {
        const deps = parentTabsMap[details.sourceTabId];
        if (deps) {
            chrome.tabs.update(parentTabsMap[details.sourceTabId].childrenTabId, { url: details.url }, function (tab) {
                if (chrome.runtime.lastError) {
                    console.log('Error:', chrome.runtime.lastError.message);
                }
            });
            chrome.tabs.remove(details.tabId);
        } else {
            parentTabsMap[details.sourceTabId] = { childrenTabId: details.tabId };
        }        
    }
}

function init() {
    chrome.runtime.onStartup.addListener(onStartupHandler);
    chrome.tabs.onCreated.addListener(onTabCreatedHandler);
    chrome.tabs.onRemoved.addListener(onTabRemovedHandler);
    chrome.storage.onChanged.addListener(onStorageChangedHandler)
    chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTargetHandler);
}

init();






