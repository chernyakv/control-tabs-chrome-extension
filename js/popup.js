function Rule(data) {
  var rules = document.getElementById('rules');
  this.node = document.getElementById('rule-template').cloneNode(true);
  this.node.id = 'rule' + (Rule.next_id++);
  this.node.rule = this;
  rules.appendChild(this.node);
  this.node.hidden = false;

  if (data) {
    this.getElement('url-param').value = data.url;
    this.getElement('enabled').checked = data.enabled;
  }

  this.getElement('enabled-label').htmlFor = this.getElement('enabled').id =
    this.node.id + '-enabled';

  this.getElement('url-param').onkeyup = storeRules;
  this.getElement('enabled').onchange = storeRules;

  var rule = this;

  this.getElement('remove').onclick = function () {
    rule.node.parentNode.removeChild(rule.node);
    storeRules();
  };
  storeRules();
}

Rule.prototype.getElement = function (name) {
  return document.querySelector('#' + this.node.id + ' .' + name);
}

Rule.next_id = 0;
/*
 *  Выгружает список проверяемых URL из chrome.storage.
 */
function loadRules() {
  chrome.storage.sync.get('checkedUrlList', function (items) {
    if (items.checkedUrlList) {
      items.checkedUrlList.forEach(item => {
        new Rule(item);
      });
    }
  })
}
/*
 *  Записывает список проверяемых URL в chrome.storage.
 */
function storeRules() {
  chrome.storage.sync.set({
    'checkedUrlList': Array.prototype.slice.apply(
      document.getElementById('rules').childNodes).map(function (node) {
        return {
          url: node.rule.getElement('url-param').value,
          enabled: node.rule.getElement('enabled').checked
        };
      })
  });
}
/*
 *  Записывает максимальное количество открытых вкладок в chrome.storage.
 */
function storeMaxNumberOfOpenTabs() {
  const maxNumberOfOpenTabs = document.getElementById('max-number-input').value;
  chrome.storage.sync.set({ maxNumberOfOpenTabs });
}

window.onload = function () {
  loadRules();
  chrome.storage.sync.get('maxNumberOfOpenTabs', function (items) {
    if (items.maxNumberOfOpenTabs) {
      document.getElementById('max-number-input').value = items.maxNumberOfOpenTabs;
    }
  })

  document.getElementById('new').onclick = function () {
    new Rule();
  };
  document.getElementById('save').onclick = function () {
    storeMaxNumberOfOpenTabs();
  };
}
