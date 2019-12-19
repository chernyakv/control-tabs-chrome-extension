var checkedUrlList = [];
var maxNumberOfOpenTabs = 6;
var numberOfOpenTabs = 1;
var parentTabsMap = {};

function deleteIfLimitIsExceeded(newTabId) {
    if (numberOfOpenTabs >= maxNumberOfOpenTabs) {
        chrome.tabs.remove(newTabId);
    }
    updateBadgeText();
}

function updateNumberOfOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        numberOfOpenTabs = tabs.length;
        updateBadgeText();
    });
}

function updateBadgeText() {
    chrome.browserAction.setBadgeText({
        text: "" + numberOfOpenTabs
    });
    const color = numberOfOpenTabs == maxNumberOfOpenTabs ? "red" : "green";
    chrome.browserAction.setBadgeBackgroundColor({ color });
}

function removeFromMapIfItDependentTab(tabId) {
    for (key in parentTabsMap) {
        if (parentTabsMap[key].childTabId == tabId) {
            delete parentTabsMap[key];
        }
    }
}

function onStorageChangedHandler(changes, namespace) {
    for (key in changes) {
        newValue = changes[key].newValue;
        if (key === "checkedUrlList") {
            checkedUrlList = newValue;
        } else if (key === "maxNumberOfOpenTabs") {
            maxNumberOfOpenTabs = newValue;
        }
    }
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
    removeFromMapIfItDependentTab(removedTabId);
    if (parentTabsMap[removedTabId]) {
        chrome.tabs.remove(parentTabsMap[removedTabId].childTabId);
        delete parentTabsMap[removedTabId];
    }
}

function onCreatedNavigationTargetHandler(details) {
    console.log(parentTabsMap);
    if (checkedUrlList.indexOf(details.url) !== -1) {
        const deps = parentTabsMap[details.sourceTabId];
        if (deps) {
            chrome.tabs.update(deps.childTabId, { url: details.url }, function (tab) {
                if (chrome.runtime.lastError) {
                    console.log('Error:', chrome.runtime.lastError.message);
                }
            });
            chrome.tabs.remove(details.tabId);
        } else {
            parentTabsMap[details.sourceTabId] = { childTabId: details.tabId };
        }
    }
}

function setDefaults() {
    chrome.storage.sync.get(null, function (items) {
        if (items.checkedUrlList) {
            items.checkedUrlList.forEach(item => {
                if (item.enabled) {
                    checkedUrlList.push(item.url);
                }
            });
        }
        if (items.maxNumberOfOpenTabs) {
            maxNumberOfOpenTabs = parseInt(items.maxNumberOfOpenTabs);
        } else {
            chrome.storage.sync.set({ maxNumberOfOpenTabs });
        }
    });
}

function init() {
    setDefaults();   
    updateNumberOfOpenTabs();
    chrome.tabs.onCreated.addListener(onTabCreatedHandler);
    chrome.tabs.onRemoved.addListener(onTabRemovedHandler);
    chrome.storage.onChanged.addListener(onStorageChangedHandler);
    chrome.webNavigation.onCreatedNavigationTarget.addListener(onCreatedNavigationTargetHandler);
}

init();
