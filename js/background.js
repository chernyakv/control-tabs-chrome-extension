var checkedUrlList = [];
var maxNumberOfOpenTabs = 6;
var numberOfOpenTabs = 1;
var parentTabsMap = {};

/*
 * Удаляет вкладку, если лимит открытых вкладок превышен.
 */
function deleteIfLimitIsExceeded(newTabId) {
  if (numberOfOpenTabs >= maxNumberOfOpenTabs) {
    chrome.tabs.remove(newTabId);
  }
  updateBadgeText();
}
/*
 *  Сверяет URL для перехода со списоком проеверяемых URL.
 */
function checkWithCkechedList(navigationUrl) {
  var result = false;
  for (let item of checkedUrlList) {
    if (new RegExp(item, "i").test(navigationUrl)) {
      result = true;
      break;
    }
  }
  return result;
}
/*
 * Обновляет количество открытых вкладок.
 */
function updateNumberOfOpenTabs() {
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
    numberOfOpenTabs = tabs.length;
    updateBadgeText();
  });
}
/*
 * Обновляет текст на значке расширения.
 */
function updateBadgeText() {
  chrome.browserAction.setBadgeText({
    text: "" + numberOfOpenTabs
  });
  const color = numberOfOpenTabs == maxNumberOfOpenTabs ? "red" : "green";
  chrome.browserAction.setBadgeBackgroundColor({ color });
}
/*
 * Удаляет зависимость, если удаляемая вкладка является зависимой.
 */
function removeFromMapIfItDependentTab(removedTabId) {
  for (key in parentTabsMap) {
    if (parentTabsMap[key].childTabId == removedTabId) {
      delete parentTabsMap[key];
    }
  }
}
/*
 *  Обнавляет значения из chrome.storage.
 */
function onStorageChangedHandler(changes, namespace) {
  for (key in changes) {
    newValue = changes[key].newValue;
    if (key === "checkedUrlList") {
      checkedUrlList = [];
      newValue.forEach(item => {
        if (item.enabled) {
          checkedUrlList.push(item.url);
        }
      });
    } else if (key === "maxNumberOfOpenTabs") {
      maxNumberOfOpenTabs = newValue;
      updateBadgeText();
    }
  }
}
/*
 *  Вызывается после создания новой вкладки.
 */
function onTabCreatedHandler(tab) {
  updateNumberOfOpenTabs();
  deleteIfLimitIsExceeded(tab.id);
  //Позиционирует вкладку слева, если нет родительской вкладки.
  if (!tab.openerTabId) {
    chrome.tabs.move(tab.id, { windowId: null, index: 0 });
  }
}
/*
 *  Вызывается после удаления вкладки.
 */
function onTabRemovedHandler(removedTabId) {
  updateNumberOfOpenTabs();
  removeFromMapIfItDependentTab(removedTabId);
  if (parentTabsMap[removedTabId]) {
    chrome.tabs.remove(parentTabsMap[removedTabId].childTabId);
    delete parentTabsMap[removedTabId];
  }
}
/*
 *  Вызывается, когда создается новая вкладка для навигации.
 */
function onCreatedNavigationTargetHandler(details) {
  const isMatch = checkWithCkechedList(details.url);
  if (isMatch) {
    const deps = parentTabsMap[details.sourceTabId]
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
/*
 *  Устанавливает начальные значения.
 */
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
