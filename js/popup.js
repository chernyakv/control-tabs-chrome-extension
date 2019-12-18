$(function() {
    var urls = [];

    $('#countSave').click(function () {    
        var count = $('#tabsCount').val();
        chrome.storage.sync.set({'maxNumberOfOpenTabs': parseInt(count) });    
        window.close();   
    })

    $('#urlAddButton').click(function () {    
        var urlInput = $('#urlInput'); 
        urls = urlInput.val().split(',').map(function(item) {
            return item.trim();
        });
        chrome.storage.sync.set({'checkedUrlList': urls });
        urlInput.attr("placeholder", "Entre url...");
        updateUrlsList();  
    })

    

    function updateUrlsList() {       
        var list = document.createElement("div");
        urls.forEach(url => {
            const item = document.createElement("li");
            item.className = "list-group-item p-2";
            item.innerHTML = url;
            list.append(item);
        });
        $("#urlsList div").remove();
        $("#urlsList").append(list);    
    }
})